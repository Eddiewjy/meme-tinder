"use client";

import { useCallback, useEffect, useState } from "react";
import { PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import type { NextPage } from "next";
import { ClockIcon, FireIcon, HeartIcon, TrophyIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { getLocalMemes } from "~~/utils/memeLoader";

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
const GAME_DURATION = 10 * 1000; // 10 seconds in milliseconds

const DemoMemeTinder: NextPage = () => {
  // Motion values for card animation - 必须在所有其他 hooks 之前
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 150], [0, 1]);
  const dislikeOpacity = useTransform(x, [-150, 0], [1, 0]);

  // State hooks
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Demo stats (模拟数据)
  const demoStats = {
    totalSwipes: 42,
    totalLikes: 28,
    totalDislikes: 14,
    contractBalance: 0.15, // MON
    currentStreak: 5,
  };

  // 回调函数 - 必须在 useEffect 之前定义
  const endGame = useCallback(() => {
    if (!gameStarted || gameEnded) return;

    const totalVotes = likes + dislikes;
    const allMemesCompleted = currentMemeIndex >= TOTAL_MEMES.length;
    const timeRemaining = timeLeft > 0;
    const completedInTime = allMemesCompleted || timeRemaining;

    // 计算模拟奖励
    let reward = 0;
    if (allMemesCompleted) {
      reward += 0.005; // 完成所有meme奖励
    } else if (timeRemaining) {
      reward += 0.002; // 时间内完成奖励
    }
    if (totalVotes >= 5) reward += 0.001;
    if (totalVotes >= 10) reward += 0.002;

    // 计算每个meme的投票统计
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

    setGameResult({
      totalVotes,
      likes,
      dislikes,
      completedInTime: allMemesCompleted,
      reward,
      topMeme,
      worstMeme,
    });

    setGameEnded(true);
  }, [likes, dislikes, timeLeft, gameStarted, gameEnded, voteResults, currentMemeIndex]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameEnded && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) {
            endGame();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameEnded, timeLeft, endGame]);

  // 监听meme完成情况 - 当所有meme都完成时立即结束游戏
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    if (currentMemeIndex >= TOTAL_MEMES.length) {
      endGame();
    }
  }, [currentMemeIndex, gameStarted, gameEnded, endGame]);

  const startGame = () => {
    setGameStarted(true);
    setGameEnded(false);
    setCurrentMemeIndex(0);
    setLikes(0);
    setDislikes(0);
    setTimeLeft(GAME_DURATION);
    setVoteResults([]);
    setGameResult(null);
  };

  const vote = async (voteType: "like" | "dislike") => {
    if (isAnimating || currentMemeIndex >= TOTAL_MEMES.length || gameEnded) return;

    setIsAnimating(true);

    const currentMeme = TOTAL_MEMES[currentMemeIndex];
    const result: VoteResult = {
      memeId: currentMeme.id,
      vote: voteType,
      timestamp: Date.now(),
    };

    setVoteResults(prev => [...prev, result]);

    if (voteType === "like") {
      setLikes(prev => prev + 1);
    } else {
      setDislikes(prev => prev + 1);
    }

    // 模拟动画延迟
    setTimeout(() => {
      if (currentMemeIndex + 1 >= TOTAL_MEMES.length) {
        // 所有meme完成，立即结束游戏
        setCurrentMemeIndex(TOTAL_MEMES.length);
        // endGame会在useEffect中被调用
      } else {
        setCurrentMemeIndex(prev => prev + 1);
      }
      setIsAnimating(false);
      x.set(0);
    }, 300);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      vote(info.offset.x > 0 ? "like" : "dislike");
    } else {
      x.set(0);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setCurrentMemeIndex(0);
    setLikes(0);
    setDislikes(0);
    setTimeLeft(GAME_DURATION);
    setVoteResults([]);
    setGameResult(null);
    x.set(0);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const currentMeme = TOTAL_MEMES[currentMemeIndex];

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Meme Battle Demo 🔥</h1>
            <p className="text-gray-600">演示版本 - 体验滑动投票界面</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">演示统计</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{demoStats.totalSwipes}</div>
                <div className="text-gray-600">总滑动次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{demoStats.totalLikes}</div>
                <div className="text-gray-600">喜欢</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{demoStats.totalDislikes}</div>
                <div className="text-gray-600">不喜欢</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{demoStats.currentStreak}</div>
                <div className="text-gray-600">连续投票</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <FireIcon className="h-5 w-5" />
              <span className="font-medium">游戏规则</span>
            </div>
            <ul className="text-sm text-yellow-700 mt-2 text-left space-y-1">
              <li>• 10秒内尽可能多地投票</li>
              <li>• 向右滑动表示喜欢 ❤️</li>
              <li>• 向左滑动表示不喜欢 ❌</li>
              <li>• 演示版本仅展示界面效果</li>
            </ul>
          </div>

          <button
            onClick={startGame}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 w-full"
          >
            开始演示 🚀
          </button>

          <div className="mt-4 text-sm text-gray-500">这是演示版本，不需要连接钱包</div>
        </div>
      </div>
    );
  }

  if (gameEnded || currentMemeIndex >= TOTAL_MEMES.length) {
    // 计算每个meme的投票统计用于详细展示
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
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 头部总结 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 mb-6 text-center shadow-2xl">
            <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">🎉 Demo 投票汇总报告</h2>

            {/* 总体统计 */}
            {gameResult && (
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
                  <div className="text-2xl font-bold text-yellow-600">{gameResult.reward.toFixed(4)}</div>
                  <div className="text-yellow-700 text-sm">模拟奖励</div>
                </div>
              </div>
            )}

            {/* 完成状态 */}
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                gameResult?.completedInTime ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
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
                  return "✅ 演示完成！";
                }
              })()}
            </div>
          </div>

          {/* 详细投票统计表 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">📊 Meme 排行榜 (演示)</h3>

            {/* 表格头部 - 仅在桌面显示 */}
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
                  {memeVoteStats[0] && memeVoteStats[0].totalVotes > 0 && (
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
                      .sort((a, b) => Math.abs(50 - a.likeRate) - Math.abs(50 - b.likeRate))[0];

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
                onClick={resetGame}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                🔄 再次演示
              </button>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(memeVoteStats, null, 2);
                  const dataBlob = new Blob([dataStr], { type: "application/json" });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `demo-meme-voting-results-${new Date().toISOString().split("T")[0]}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-300"
              >
                📊 导出演示数据
              </button>
            </div>

            {/* 提示信息 */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">💡 这是演示版本，数据仅供展示参考</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-6 w-6" />
          <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-80">演示模式</div>
          <div className="text-lg font-bold">
            {currentMemeIndex + 1} / {TOTAL_MEMES.length}
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <HeartIcon className="h-5 w-5 text-green-400 mx-auto" />
            <span>{likes}</span>
          </div>
          <div className="text-center">
            <XMarkIcon className="h-5 w-5 text-red-400 mx-auto" />
            <span>{dislikes}</span>
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm h-96">
          {/* Background cards */}
          {TOTAL_MEMES.slice(currentMemeIndex + 1, currentMemeIndex + 3).map((meme, index) => (
            <div
              key={meme.id}
              className="absolute inset-0 bg-white rounded-3xl shadow-2xl"
              style={{
                zIndex: 2 - index,
                transform: `scale(${0.95 - index * 0.05}) translateY(${index * 8}px)`,
                opacity: 0.7 - index * 0.2,
              }}
            >
              <div className="w-full h-full rounded-3xl overflow-hidden">
                <img src={meme.imageUrl} alt={meme.title} className="w-full h-3/4 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800">{meme.title}</h3>
                  <p className="text-gray-600 text-sm">{meme.description}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Current card */}
          {currentMeme && (
            <motion.div
              className="absolute inset-0 bg-white rounded-3xl shadow-2xl cursor-grab active:cursor-grabbing"
              style={{
                x,
                rotate,
                opacity,
                zIndex: 3,
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.05 }}
            >
              <div className="w-full h-full rounded-3xl overflow-hidden">
                <img src={currentMeme.imageUrl} alt={currentMeme.title} className="w-full h-3/4 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800">{currentMeme.title}</h3>
                  <p className="text-gray-600 text-sm">{currentMeme.description}</p>
                </div>
              </div>

              {/* Overlay indicators */}
              <motion.div
                className="absolute inset-0 bg-green-500/80 rounded-3xl flex items-center justify-center"
                style={{
                  opacity: likeOpacity,
                }}
              >
                <HeartIcon className="h-24 w-24 text-white" />
              </motion.div>

              <motion.div
                className="absolute inset-0 bg-red-500/80 rounded-3xl flex items-center justify-center"
                style={{
                  opacity: dislikeOpacity,
                }}
              >
                <XMarkIcon className="h-24 w-24 text-white" />
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-8 p-8">
        <button
          onClick={() => vote("dislike")}
          disabled={isAnimating || gameEnded}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110 disabled:scale-100"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>

        <button
          onClick={() => vote("like")}
          disabled={isAnimating || gameEnded}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110 disabled:scale-100"
        >
          <HeartIcon className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default DemoMemeTinder;
