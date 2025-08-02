"use client";

import { useCallback, useEffect, useState } from "react";
import { Blink, useActionsRegistryInterval, useBlink } from "@dialectlabs/blinks";
import { useEvmWagmiAdapter } from "@dialectlabs/blinks/hooks/evm";
import "@dialectlabs/blinks/index.css";
import { ConnectKitButton, useModal } from "connectkit";
import { PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ClockIcon, FireIcon, HeartIcon, TrophyIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useScaffoldReadContract, useScaffoldWriteContract, useWatchBalance } from "~~/hooks/scaffold-eth";
import { getLocalMemes } from "~~/utils/memeLoader";
import { notification } from "~~/utils/scaffold-eth";

export interface Meme {
  id: number;
  imageUrl: string;
  title: string;
  description?: string;
}

interface VoteResult {
  memeId: number;
  vote: "like" | "dislike";
  timestamp: number;
  txHash?: string;
  status?: "pending" | "confirmed" | "failed";
}

interface PendingTransaction {
  memeId: number;
  vote: "like" | "dislike";
  timestamp: number;
  retryCount?: number;
}

interface GameResult {
  totalVotes: number;
  likes: number;
  dislikes: number;
  completedInTime: boolean;
  reward: number;
  topMeme?: Meme;
  worstMeme?: Meme;
}

// 使用本地meme图片
const TOTAL_MEMES = getLocalMemes();
const GAME_DURATION = 30 * 1000; // 30 seconds in milliseconds

const MemeTinder: NextPage = () => {
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // 预充值相关状态
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("0.01"); // 默认0.01 MON

  // Wallet connection
  const { address, isConnected } = useAccount();

  // 合约交互hooks
  const { writeContractAsync: recordSwipe, isPending: isSwipePending } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  // 预充值hooks
  const { writeContractAsync: depositFunds, isPending: isDepositing } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  // 提取余额hooks
  const { writeContractAsync: withdrawFunds, isPending: isWithdrawing } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  // 读取用户统计（现在包含合约内余额）
  const { data: userStats, refetch: refetchUserStats } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getUserStats",
    args: [address],
  });

  // 读取下次奖励需要的滑动次数
  const { data: swipesToNextReward } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getSwipesToNextReward",
    args: [address],
  });

  // 监听用户钱包余额
  const { data: balance, isLoading: isBalanceLoading } = useWatchBalance({
    address: address,
  });

  // Blink相关hooks
  useActionsRegistryInterval();
  const { setOpen } = useModal();

  // Wagmi adapter for Blink
  const { adapter } = useEvmWagmiAdapter({
    onConnectWalletRequest: async () => {
      setOpen(true);
    },
  });

  // 监听钱包连接状态变化，连接成功后关闭modal
  useEffect(() => {
    if (isConnected) {
      // 钱包连接成功后，延迟一下再关闭modal，确保连接过程完成
      const timer = setTimeout(() => {
        setOpen(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, setOpen]);

  // 组件初始化时，如果钱包已连接，确保modal处于关闭状态
  useEffect(() => {
    if (isConnected) {
      setOpen(false);
    }
  }, []); // 只在组件挂载时执行一次

  // 始终创建这些hooks，无论游戏状态如何
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // 用于滑动指示器的transform
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const dislikeOpacity = useTransform(x, [-150, -50], [1, 0]);

  const currentMeme = TOTAL_MEMES[currentMemeIndex];

  // 计算游戏结果
  const calculateGameResult = useCallback(() => {
    const totalVotes = likes + dislikes;
    const allMemesCompleted = currentMemeIndex >= TOTAL_MEMES.length;
    const timeRemaining = timeLeft > 0;

    // 更新判断逻辑：要么时间内完成所有meme，要么所有meme都被评价完
    const completedInTime = allMemesCompleted || timeRemaining;

    // 计算投票统计
    const memeVoteStats = TOTAL_MEMES.map(meme => {
      const memeVotes = voteResults.filter(v => v.memeId === meme.id);
      const likesCount = memeVotes.filter(v => v.vote === "like").length;
      const dislikesCount = memeVotes.filter(v => v.vote === "dislike").length;
      const totalVotesForMeme = likesCount + dislikesCount;
      const likeRate = totalVotesForMeme > 0 ? likesCount / totalVotesForMeme : 0;

      return {
        meme,
        likesCount,
        dislikesCount,
        likeRate,
        totalVotes: totalVotesForMeme,
      };
    }).filter(stat => stat.totalVotes > 0);

    // 找出支持率最高和最低的meme
    const sortedByLikeRate = memeVoteStats.sort((a, b) => b.likeRate - a.likeRate);
    const topMeme = sortedByLikeRate[0]?.meme;
    const worstMeme = sortedByLikeRate[sortedByLikeRate.length - 1]?.meme;

    // 计算奖励
    let reward = 0;
    if (allMemesCompleted) {
      reward += 100; // 完成所有meme奖励
    } else if (timeRemaining) {
      reward += 50; // 时间内完成奖励
    }
    reward += Math.floor(totalVotes / 10) * 5; // 投票奖励

    const result: GameResult = {
      totalVotes,
      likes,
      dislikes,
      completedInTime: allMemesCompleted, // 这里改为是否完成所有meme
      reward,
      topMeme,
      worstMeme,
    };

    setGameResult(result);
  }, [likes, dislikes, currentMemeIndex, voteResults, timeLeft]);

  // 计时器 - 同时检查时间和是否完成所有meme
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        // 检查时间是否到了
        if (prev <= 1000) {
          setGameEnded(true);
          calculateGameResult();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameEnded, calculateGameResult]);

  // 监听meme完成情况 - 当所有meme都完成时立即结束游戏
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    if (currentMemeIndex >= TOTAL_MEMES.length) {
      setGameEnded(true);
      calculateGameResult();
    }
  }, [currentMemeIndex, gameStarted, gameEnded, calculateGameResult]);

  // 开始游戏
  const startGame = () => {
    if (!isConnected) {
      notification.error("请先连接钱包");
      return;
    }
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    setCurrentMemeIndex(0);
    setLikes(0);
    setDislikes(0);
    setVoteResults([]);
    setGameResult(null);
    setGameEnded(false);
  };

  // 直接调用合约进行投票（从预充值余额扣除）
  const handleVote = async (vote: "like" | "dislike") => {
    if (!isConnected) {
      notification.error("请先连接钱包");
      return;
    }

    // 检查用户合约内余额（暂时跳过检查，让合约报错）
    // const contractBalance = userStats?.[2] || BigInt(0);
    // if (contractBalance < BigInt("1000000000000000")) { // 0.001 MON
    //   notification.error("合约内余额不足，请先充值");
    //   setShowDepositModal(true);
    //   return;
    // }

    const currentMeme = TOTAL_MEMES[currentMemeIndex];

    try {
      // 调用合约记录滑动（无需付款，从预充值扣除）
      const tx = await recordSwipe({
        functionName: "recordSwipe",
      });

      // 立即更新计数器
      if (vote === "like") {
        setLikes(prev => prev + 1);
      } else {
        setDislikes(prev => prev + 1);
      }

      // 记录投票结果
      const voteResult: VoteResult = {
        memeId: currentMeme.id,
        vote,
        timestamp: Date.now(),
        status: "confirmed",
        txHash: tx,
      };

      setVoteResults(prev => [...prev, voteResult]);

      // 显示成功消息
      notification.success(`投票成功! ${vote === "like" ? "👍" : "👎"} 从预充值扣除 0.001 MON`);

      // 刷新用户统计
      refetchUserStats();

      // 进入下一张图片
      if (currentMemeIndex >= TOTAL_MEMES.length - 1) {
        setGameEnded(true);
        calculateGameResult();
      } else {
        nextMeme();
      }
    } catch (error: any) {
      console.error("Vote failed:", error);
      if (error.message?.includes("Insufficient balance")) {
        notification.error("合约内余额不足，请先充值");
        setShowDepositModal(true);
      } else {
        notification.error(`投票失败: ${error.message || "请检查网络连接"}`);
      }
    }
  };

  // 处理预充值
  const handleDeposit = async () => {
    if (!isConnected) {
      notification.error("请先连接钱包");
      return;
    }

    try {
      const amountInWei = BigInt(Math.floor(parseFloat(depositAmount) * 1e18));

      const tx = await depositFunds({
        functionName: "deposit",
        value: amountInWei,
      });

      notification.success(`充值成功! 充值了 ${depositAmount} MON`);
      setShowDepositModal(false);
      refetchUserStats();
    } catch (error: any) {
      console.error("Deposit failed:", error);
      notification.error(`充值失败: ${error.message || "请检查钱包余额"}`);
    }
  };

  // 处理提现
  const handleWithdraw = async () => {
    if (!isConnected) {
      notification.error("请先连接钱包");
      return;
    }

    if (!userStats || !userStats[2] || Number(userStats[2]) === 0) {
      notification.error("合约内没有余额可提现");
      return;
    }

    try {
      await withdrawFunds({
        functionName: "withdraw",
        args: [userStats[2]],
      } as any);

      const withdrawAmountFormatted = (Number(userStats[2]) / 1e18).toFixed(4);
      notification.success(`提现成功! 提现了 ${withdrawAmountFormatted} MON`);
      refetchUserStats();
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      notification.error(`提现失败: ${error.message || "交易被拒绝"}`);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (gameEnded) return; // 移除 isVoting 检查，允许快速投票

    const threshold = 100;

    if (Math.abs(info.offset.x) > threshold) {
      setIsAnimating(true);

      const vote = info.offset.x > 0 ? "like" : "dislike";

      // 移动卡片动画
      setTimeout(() => {
        handleVote(vote);
        x.set(0);
        setIsAnimating(false);
      }, 200);
    } else {
      x.set(0);
    }
  };

  const nextMeme = () => {
    setCurrentMemeIndex(prev => prev + 1);
  };

  const handleLike = () => {
    if (isAnimating || gameEnded) return;
    setIsAnimating(true);
    x.set(300);

    setTimeout(() => {
      handleVote("like");
      x.set(0);
      setIsAnimating(false);
    }, 200);
  };

  const handleDislike = () => {
    if (isAnimating || gameEnded) return;
    setIsAnimating(true);
    x.set(-300);

    setTimeout(() => {
      handleVote("dislike");
      x.set(0);
      setIsAnimating(false);
    }, 200);
  };

  // 格式化时间
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // 游戏未开始界面
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          {/* 钱包连接按钮 */}
          <div className="mb-4 flex justify-center">
            <ConnectKitButton />
          </div>

          <div className="mb-6">
            <FireIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Meme Battle</h1>
            <p className="text-gray-600">投票选出最火的Meme，赢取奖励！</p>
          </div>

          {/* 钱包余额显示 */}
          {isConnected && balance && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-700 mb-1">💰 当前余额</div>
              <div className="font-bold text-blue-800">
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </div>
            </div>
          )}

          {/* 用户统计显示 */}
          {isConnected && userStats && (
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-green-700 mb-1">📊 历史记录</div>
              <div className="text-xs text-green-600">
                总滑动: {userStats[0]?.toString() || "0"} 次 | 累计奖励:{" "}
                {userStats[1] ? parseFloat((Number(userStats[1]) / 1e18).toString()).toFixed(4) : "0"} MON
              </div>
              <div className="text-xs text-green-600 mt-1">
                合约内余额: {userStats[2] ? parseFloat((Number(userStats[2]) / 1e18).toString()).toFixed(4) : "0"} MON
              </div>
              {swipesToNextReward && (
                <div className="text-xs text-green-600 mt-1">
                  距离下次奖励还需: {swipesToNextReward.toString()} 次滑动
                </div>
              )}
            </div>
          )}

          {/* 预充值按钮 */}
          {isConnected && (
            <div className="mb-4">
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300"
              >
                预充值到合约 💰
              </button>
              <p className="text-xs text-gray-500 mt-1">预充值后无需每次确认交易</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">总Meme数量:</span>
              <span className="font-bold text-purple-600">{TOTAL_MEMES.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">游戏时间:</span>
              <span className="font-bold text-purple-600">{formatTime(GAME_DURATION)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">投票方式:</span>
              <span className="font-bold text-purple-600">左滑/右滑</span>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            开始挑战 🚀
          </button>
        </div>
      </div>
    );
  }

  // 游戏结束界面 - 详细汇总表
  if (gameEnded && gameResult) {
    // 计算每个meme的投票统计
    const memeVoteStats = TOTAL_MEMES.map(meme => {
      const memeVotes = voteResults.filter(v => v.memeId === meme.id);
      const likesCount = memeVotes.filter(v => v.vote === "like").length;
      const dislikesCount = memeVotes.filter(v => v.vote === "dislike").length;
      const totalVotesForMeme = likesCount + dislikesCount;
      const likeRate = totalVotesForMeme > 0 ? (likesCount / totalVotesForMeme) * 100 : 0;

      return {
        meme,
        likesCount,
        dislikesCount,
        likeRate,
        totalVotes: totalVotesForMeme,
      };
    }).sort((a, b) => b.likeRate - a.likeRate); // 按支持率排序

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 头部总结 */}
          <div className="bg-white rounded-3xl p-6 mb-6 text-center shadow-2xl">
            <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">🎉 投票汇总报告</h2>

            {/* 总体统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-pink-600">{gameResult.totalVotes}</div>
                <div className="text-pink-700 text-sm">总投票数</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{gameResult.likes}</div>
                <div className="text-green-700 text-sm">👍 喜欢</div>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{gameResult.dislikes}</div>
                <div className="text-red-700 text-sm">👎 不喜欢</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{gameResult.reward}</div>
                <div className="text-yellow-700 text-sm">获得奖励</div>
              </div>
            </div>

            {/* 完成状态 */}
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                gameResult.completedInTime ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              {(() => {
                const allMemesCompleted = currentMemeIndex >= TOTAL_MEMES.length;
                const timeRemaining = timeLeft > 0;

                if (allMemesCompleted && timeRemaining) {
                  return "🎯 完美！提前完成所有投票！";
                } else if (allMemesCompleted && !timeRemaining) {
                  return "✅ 刚好完成所有投票！";
                } else if (!allMemesCompleted && !timeRemaining) {
                  return `⏰ 时间到！完成了 ${currentMemeIndex}/${TOTAL_MEMES.length} 个投票`;
                } else {
                  return "✅ 游戏完成！";
                }
              })()}
            </div>
          </div>

          {/* 详细投票统计表 */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">📊 Meme 排行榜</h3>

            {/* 表格头部 */}
            <div className="hidden md:grid md:grid-cols-6 gap-4 pb-4 border-b border-gray-200 font-semibold text-gray-700">
              <div className="col-span-1">排名</div>
              <div className="col-span-2">Meme</div>
              <div className="col-span-1 text-center">👍</div>
              <div className="col-span-1 text-center">👎</div>
              <div className="col-span-1 text-center">支持率</div>
            </div>

            {/* 投票统计列表 */}
            <div className="space-y-4 mt-4 max-h-96 overflow-y-auto">
              {memeVoteStats.map((stat, index) => (
                <div key={stat.meme.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="md:grid md:grid-cols-6 gap-4 items-center">
                    {/* 排名 */}
                    <div className="col-span-1 mb-2 md:mb-0">
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-gray-400"
                              : index === 2
                                ? "bg-orange-600"
                                : "bg-gray-300"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index === 0 && <span className="ml-2 text-yellow-600 font-medium">👑</span>}
                    </div>

                    {/* Meme 信息 */}
                    <div className="col-span-2 flex items-center gap-3 mb-2 md:mb-0">
                      <img
                        src={stat.meme.imageUrl}
                        alt={stat.meme.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{stat.meme.title}</div>
                        {stat.meme.description && (
                          <div className="text-xs text-gray-600 truncate">{stat.meme.description}</div>
                        )}
                      </div>
                    </div>

                    {/* 喜欢数 */}
                    <div className="col-span-1 text-center mb-1 md:mb-0">
                      <div className="text-green-600 font-bold">{stat.likesCount}</div>
                    </div>

                    {/* 不喜欢数 */}
                    <div className="col-span-1 text-center mb-1 md:mb-0">
                      <div className="text-red-600 font-bold">{stat.dislikesCount}</div>
                    </div>

                    {/* 支持率 */}
                    <div className="col-span-1 text-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`font-bold ${stat.likeRate >= 60 ? "text-green-600" : stat.likeRate >= 40 ? "text-yellow-600" : "text-red-600"}`}
                        >
                          {stat.totalVotes > 0 ? `${stat.likeRate.toFixed(1)}%` : "N/A"}
                        </div>
                        {stat.totalVotes > 0 && (
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${stat.likeRate >= 60 ? "bg-green-500" : stat.likeRate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${stat.likeRate}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 移动端额外信息 */}
                  <div className="md:hidden mt-2 flex justify-between text-sm text-gray-600">
                    <span>
                      👍 {stat.likesCount} 👎 {stat.dislikesCount}
                    </span>
                    <span
                      className={`font-medium ${stat.likeRate >= 60 ? "text-green-600" : stat.likeRate >= 40 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {stat.totalVotes > 0 ? `${stat.likeRate.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 特殊奖项 */}
            {memeVoteStats.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 最受欢迎 */}
                  {memeVoteStats[0] && (
                    <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-4 text-center">
                      <div className="text-yellow-700 text-sm font-medium mb-2">🏆 最受欢迎</div>
                      <img
                        src={memeVoteStats[0].meme.imageUrl}
                        alt={memeVoteStats[0].meme.title}
                        className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"
                      />
                      <div className="font-bold text-yellow-800">{memeVoteStats[0].meme.title}</div>
                      <div className="text-yellow-700 text-sm">{memeVoteStats[0].likeRate.toFixed(1)}% 支持率</div>
                    </div>
                  )}

                  {/* 最具争议 */}
                  {(() => {
                    const controversialMeme = memeVoteStats
                      .filter(stat => stat.totalVotes > 0)
                      .sort((a, b) => Math.abs(50 - b.likeRate) - Math.abs(50 - a.likeRate))[0];

                    return (
                      controversialMeme && (
                        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-4 text-center">
                          <div className="text-purple-700 text-sm font-medium mb-2">⚡ 最具争议</div>
                          <img
                            src={controversialMeme.meme.imageUrl}
                            alt={controversialMeme.meme.title}
                            className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"
                          />
                          <div className="font-bold text-purple-800">{controversialMeme.meme.title}</div>
                          <div className="text-purple-700 text-sm">{controversialMeme.likeRate.toFixed(1)}% 支持率</div>
                        </div>
                      )
                    );
                  })()}

                  {/* 最冷门 */}
                  {memeVoteStats.length > 0 && memeVoteStats[memeVoteStats.length - 1].totalVotes > 0 && (
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-4 text-center">
                      <div className="text-blue-700 text-sm font-medium mb-2">❄️ 最需要爱</div>
                      <img
                        src={memeVoteStats[memeVoteStats.length - 1].meme.imageUrl}
                        alt={memeVoteStats[memeVoteStats.length - 1].meme.title}
                        className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"
                      />
                      <div className="font-bold text-blue-800">
                        {memeVoteStats[memeVoteStats.length - 1].meme.title}
                      </div>
                      <div className="text-blue-700 text-sm">
                        {memeVoteStats[memeVoteStats.length - 1].likeRate.toFixed(1)}% 支持率
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={() => {
                  setGameStarted(false);
                  setGameEnded(false);
                  setCurrentMemeIndex(0);
                  setLikes(0);
                  setDislikes(0);
                  setVoteResults([]);
                  setGameResult(null);
                }}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
              >
                🔄 再来一局
              </button>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(memeVoteStats, null, 2);
                  const dataBlob = new Blob([dataStr], { type: "application/json" });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `meme-voting-results-${new Date().toISOString().split("T")[0]}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-300"
              >
                📊 导出数据
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 无更多meme时的处理
  if (!currentMeme || currentMemeIndex >= TOTAL_MEMES.length) {
    if (!gameEnded) {
      setGameEnded(true);
      calculateGameResult();
    }
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            {/* 钱包连接按钮 */}
            <div className="mb-4 flex justify-center">
              <ConnectKitButton />
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Meme Battle 🔥</h1>
            <p className="text-white/80">左滑不喜欢，右滑喜欢</p>
            <p className="text-white/60 text-sm mt-1">每次投票从预充值余额扣除 0.001 MON</p>

            {/* 钱包余额显示 */}
            {isConnected && balance && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-white/80 text-sm">
                  💰 钱包余额: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </span>
              </div>
            )}

            {/* 合约内余额显示 */}
            {isConnected && userStats && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 text-sm">
                    🏦 合约余额: {userStats[2] ? parseFloat((Number(userStats[2]) / 1e18).toString()).toFixed(4) : "0"}{" "}
                    MON
                  </span>
                </div>

                {/* 充值和提现按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors"
                  >
                    💰 充值
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={!userStats[2] || Number(userStats[2]) === 0 || isWithdrawing}
                    className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWithdrawing ? "处理中..." : "🎁 提现"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 时间倒计时 */}
          <div className="flex items-center justify-center gap-2 mt-4 mb-4">
            <ClockIcon className="w-5 h-5 text-white" />
            <span className={`text-xl font-bold ${timeLeft < 60000 ? "text-red-300" : "text-white"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* 用户统计 */}
          {isConnected && userStats && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-white/80 text-sm">
                总滑动: {userStats[0]?.toString() || "0"} 次 | 累计奖励:{" "}
                {userStats[1] ? (Number(userStats[1]) / 1e18).toFixed(3) : "0"} MON
              </span>
            </div>
          )}

          {/* 距离下次奖励 */}
          {isConnected && swipesToNextReward && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-orange-400 text-sm">
                距离下次奖励还需要: {swipesToNextReward.toString()} 次滑动
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{likes}</div>
              <div className="text-white/80 text-sm">👍 喜欢</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{dislikes}</div>
              <div className="text-white/80 text-sm">👎 不喜欢</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{likes + dislikes}</div>
              <div className="text-white/80 text-sm">🗳️ 总计</div>
            </div>
            {/* 余额显示 */}
            {isConnected && balance && (
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-300">{parseFloat(balance.formatted).toFixed(3)}</div>
                <div className="text-white/80 text-sm">💰 {balance.symbol}</div>
              </div>
            )}
          </div>
        </div>

        {/* Card Stack Container */}
        <div className="relative h-[600px] flex items-center justify-center">
          {/* Background Cards */}
          {TOTAL_MEMES.slice(currentMemeIndex + 1, currentMemeIndex + 3).map((meme: Meme, index: number) => (
            <div
              key={meme.id}
              className="absolute w-80 h-96 bg-white rounded-2xl shadow-2xl"
              style={{
                zIndex: 10 - index,
                transform: `scale(${0.95 - index * 0.05}) translateY(${index * 10}px)`,
              }}
            />
          ))}

          {/* Current Card */}
          <motion.div
            key={currentMeme.id}
            className="absolute w-80 h-96 bg-white rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden"
            style={{
              x,
              rotate,
              opacity,
              zIndex: 20,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 0.95 }}
          >
            {/* Meme Image */}
            <div className="h-3/4 relative overflow-hidden">
              <img
                src={currentMeme.imageUrl}
                alt={currentMeme.title}
                className="w-full h-full object-cover"
                onError={e => {
                  e.currentTarget.src = "https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Meme+Not+Found";
                }}
              />

              {/* 交易处理状态指示器 */}
              {isSwipePending && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                  交易处理中...
                </div>
              )}

              {/* Swipe Indicators */}
              <motion.div
                className="absolute top-8 left-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xl transform -rotate-12"
                style={{
                  opacity: likeOpacity,
                }}
              >
                喜欢 👍
              </motion.div>

              <motion.div
                className="absolute top-8 right-8 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xl transform rotate-12"
                style={{
                  opacity: dislikeOpacity,
                }}
              >
                不喜欢 👎
              </motion.div>
            </div>

            {/* Meme Info */}
            <div className="h-1/4 p-4 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-800 mb-1">{currentMeme.title}</h3>
              {currentMeme.description && <p className="text-gray-600 text-sm">{currentMeme.description}</p>}
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mt-8">
          <button
            onClick={handleDislike}
            disabled={isAnimating} // 移除 isVoting，允许快速投票
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
          >
            <XMarkIcon className="w-8 h-8 text-red-500" />
          </button>

          <button
            onClick={handleLike}
            disabled={isAnimating} // 移除 isVoting，允许快速投票
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
          >
            <HeartIcon className="w-8 h-8 text-pink-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="text-white/80 text-sm">
            {currentMemeIndex + 1} / {TOTAL_MEMES.length}
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentMemeIndex + 1) / TOTAL_MEMES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">💡 预充值后即可快速滑动，完成所有投票可获得奖励</p>
        </div>
      </div>

      {/* 充值模态框 */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        onDeposit={handleDeposit}
        isLoading={isDepositing}
      />
    </>
  );
};

// 充值模态框组件
const DepositModal = ({
  isOpen,
  onClose,
  depositAmount,
  setDepositAmount,
  onDeposit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  onDeposit: () => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">预充值到合约</h2>
        <p className="text-gray-600 text-sm mb-4 text-center">预充值后，您可以在游戏中快速滑动，无需每次确认交易</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">充值金额 (MON)</label>
          <input
            type="number"
            step="0.001"
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.01"
            min="0.001"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setDepositAmount("0.01")}
              className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
            >
              0.01
            </button>
            <button
              onClick={() => setDepositAmount("0.05")}
              className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
            >
              0.05
            </button>
            <button
              onClick={() => setDepositAmount("0.1")}
              className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
            >
              0.1
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={onDeposit}
            disabled={isLoading || !depositAmount || parseFloat(depositAmount) <= 0}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "处理中..." : "充值"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemeTinder;
