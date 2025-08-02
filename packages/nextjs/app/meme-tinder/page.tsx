"use client";

import { useCallback, useEffect, useState } from "react";
import { PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import type { NextPage } from "next";
import { ClockIcon, FireIcon, HeartIcon, TrophyIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { notification } from "~~/utils/scaffold-eth";

interface Meme {
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

// 生成100个meme数据
const generateMemes = (): Meme[] => {
  const memeTemplates = [
    { title: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg" },
    { title: "Drake Pointing", url: "https://i.imgflip.com/30b1gx.jpg" },
    { title: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg" },
    { title: "Surprised Pikachu", url: "https://i.imgflip.com/26am.jpg" },
    { title: "Stonks", url: "https://i.imgflip.com/4t0m5.jpg" },
    { title: "Success Kid", url: "https://i.imgflip.com/1bij.jpg" },
    { title: "Woman Yelling at Cat", url: "https://i.imgflip.com/345v97.jpg" },
    { title: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
    { title: "This Is Fine", url: "https://i.imgflip.com/26ufmz.jpg" },
    { title: "Mocking SpongeBob", url: "https://i.imgflip.com/1otk96.jpg" },
  ];

  const memes: Meme[] = [];
  for (let i = 0; i < 30; i++) {
    const template = memeTemplates[i % memeTemplates.length];
    memes.push({
      id: i + 1,
      imageUrl: template.url,
      title: `${template.title} #${Math.floor(i / memeTemplates.length) + 1}`,
      description: `Meme variant ${i + 1} - Rate this spicy content!`,
    });
  }
  return memes;
};

const TOTAL_MEMES = generateMemes();
const GAME_DURATION = 20 * 1000; // 20 seconds in milliseconds

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
  const [isVoting, setIsVoting] = useState(false);

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
    const completedInTime = currentMemeIndex >= TOTAL_MEMES.length - 1;

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
    if (completedInTime) {
      reward += 100; // 完成奖励
    }
    reward += Math.floor(totalVotes / 10) * 5; // 投票奖励

    const result: GameResult = {
      totalVotes,
      likes,
      dislikes,
      completedInTime,
      reward,
      topMeme,
      worstMeme,
    };

    setGameResult(result);
  }, [likes, dislikes, currentMemeIndex, voteResults]);

  // 计时器
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
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

  // 开始游戏
  const startGame = () => {
    // if (!isConnected) {
    //   notification.error("请先连接钱包");
    //   return;
    // }
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    setCurrentMemeIndex(0);
    setLikes(0);
    setDislikes(0);
    setVoteResults([]);
    setGameResult(null);
    setGameEnded(false);
  };

  // 投票交易（模拟）
  const submitVote = async (vote: "like" | "dislike") => {
    // if (!isConnected) {
    //   notification.error("请先连接钱包");
    //   return;
    // }

    setIsVoting(true);
    try {
      // 这里应该调用智能合约进行投票
      // 暂时模拟交易延迟 - demo版本更快
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      const voteResult: VoteResult = {
        memeId: currentMeme.id,
        vote,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`, // 模拟交易哈希
      };

      setVoteResults(prev => [...prev, voteResult]);

      if (vote === "like") {
        setLikes(prev => prev + 1);
      } else {
        setDislikes(prev => prev + 1);
      }

      notification.success(`投票成功! ${vote === "like" ? "👍" : "👎"}`);

      // 检查是否完成所有投票
      if (currentMemeIndex >= TOTAL_MEMES.length - 1) {
        setGameEnded(true);
        calculateGameResult();
      } else {
        nextMeme();
      }
    } catch (error) {
      notification.error("投票失败，请重试");
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (isVoting || gameEnded) return;

    const threshold = 100;

    if (Math.abs(info.offset.x) > threshold) {
      setIsAnimating(true);

      const vote = info.offset.x > 0 ? "like" : "dislike";

      // 移动卡片动画
      setTimeout(() => {
        submitVote(vote);
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
    if (isAnimating || isVoting || gameEnded) return;
    setIsAnimating(true);
    x.set(300);

    setTimeout(() => {
      submitVote("like");
      x.set(0);
      setIsAnimating(false);
    }, 200);
  };

  const handleDislike = () => {
    if (isAnimating || isVoting || gameEnded) return;
    setIsAnimating(true);
    x.set(-300);

    setTimeout(() => {
      submitVote("dislike");
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
          <div className="mb-6">
            <FireIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Meme Battle</h1>
            <p className="text-gray-600">投票选出最火的Meme，赢取奖励！</p>
          </div>

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

  // 游戏结束界面
  if (gameEnded && gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-6">游戏结束！</h2>

          <div className="space-y-4 mb-8">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{gameResult.reward} ETH</div>
              <div className="text-green-700 text-sm">获得奖励</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pink-50 rounded-lg p-3">
                <div className="text-xl font-bold text-pink-600">{gameResult.likes}</div>
                <div className="text-pink-700 text-sm">喜欢</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-gray-600">{gameResult.dislikes}</div>
                <div className="text-gray-700 text-sm">不喜欢</div>
              </div>
            </div>

            {gameResult.topMeme && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-700 mb-1">🔥 最火 Meme</div>
                <div className="font-bold text-yellow-800">{gameResult.topMeme.title}</div>
              </div>
            )}

            {gameResult.worstMeme && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">📉 冷门 Meme</div>
                <div className="font-bold text-blue-800">{gameResult.worstMeme.title}</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setGameStarted(false)}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
          >
            再来一局
          </button>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Meme Battle 🔥</h1>
          <p className="text-white/80">左滑不喜欢，右滑喜欢</p>

          {/* 时间倒计时 */}
          <div className="flex items-center justify-center gap-2 mt-4 mb-4">
            <ClockIcon className="w-5 h-5 text-white" />
            <span className={`text-xl font-bold ${timeLeft < 60000 ? "text-red-300" : "text-white"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-4">
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

              {/* 投票状态指示器 */}
              {isVoting && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-600">投票中...</div>
                  </div>
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
            disabled={isAnimating || isVoting}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
          >
            <XMarkIcon className="w-8 h-8 text-red-500" />
          </button>

          <button
            onClick={handleLike}
            disabled={isAnimating || isVoting}
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
          <p className="text-white/60 text-sm">💡 每次投票都会进行链上交易，完成所有投票可获得奖励</p>
        </div>
      </div>
    </div>
  );
};

export default MemeTinder;
