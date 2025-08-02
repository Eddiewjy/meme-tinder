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
const GAME_DURATION = 30 * 1000; // 30 seconds in milliseconds

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
    const completedInTime = timeLeft > 0;
    
    // 计算模拟奖励
    let reward = 0;
    if (totalVotes >= 5) reward += 0.001;
    if (totalVotes >= 10) reward += 0.002;
    if (completedInTime) reward += 0.001;

    const topMeme = voteResults.reduce((top, result) => {
      if (result.vote === "like") {
        return top || TOTAL_MEMES.find(m => m.id === result.memeId);
      }
      return top;
    }, undefined as Meme | undefined);

    const worstMeme = voteResults.reduce((worst, result) => {
      if (result.vote === "dislike") {
        return worst || TOTAL_MEMES.find(m => m.id === result.memeId);
      }
      return worst;
    }, undefined as Meme | undefined);

    setGameResult({
      totalVotes,
      likes,
      dislikes,
      completedInTime,
      reward,
      topMeme,
      worstMeme,
    });
  }, [likes, dislikes, timeLeft, gameStarted, gameEnded, voteResults]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameEnded && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) {
            setGameEnded(true);
            endGame();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameEnded, timeLeft, endGame]);

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
        endGame();
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
              <li>• 30秒内尽可能多地投票</li>
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

          <div className="mt-4 text-sm text-gray-500">
            这是演示版本，不需要连接钱包
          </div>
        </div>
      </div>
    );
  }

  if (gameEnded || currentMemeIndex >= TOTAL_MEMES.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <TrophyIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">游戏结束！</h2>
            <p className="text-gray-600">演示完成</p>
          </div>

          {gameResult && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">本轮结果</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{gameResult.likes}</div>
                  <div className="text-gray-600">喜欢</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{gameResult.dislikes}</div>
                  <div className="text-gray-600">不喜欢</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{gameResult.totalVotes}</div>
                  <div className="text-gray-600">总投票数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {gameResult.completedInTime ? "✅" : "⏰"}
                  </div>
                  <div className="text-gray-600">
                    {gameResult.completedInTime ? "按时完成" : "时间到"}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-green-800 font-medium">模拟奖励</div>
                <div className="text-2xl font-bold text-green-600">{gameResult.reward.toFixed(4)} MON</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 w-full"
            >
              再次演示
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all duration-200 w-full"
            >
              返回首页
            </button>
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
                <img
                  src={meme.imageUrl}
                  alt={meme.title}
                  className="w-full h-3/4 object-cover"
                />
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
                <img
                  src={currentMeme.imageUrl}
                  alt={currentMeme.title}
                  className="w-full h-3/4 object-cover"
                />
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
