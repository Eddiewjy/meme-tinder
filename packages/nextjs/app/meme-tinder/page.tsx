"use client";

import { useEffect, useRef, useState } from "react";
import { PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import type { NextPage } from "next";
import { HeartIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Meme {
  id: number;
  imageUrl: string;
  title: string;
  description?: string;
}

// 示例 meme 数据
const sampleMemes: Meme[] = [
  {
    id: 1,
    imageUrl: "https://i.imgflip.com/1bij.jpg",
    title: "Success Kid",
    description: "Classic success meme",
  },
  {
    id: 2,
    imageUrl: "https://i.imgflip.com/4t0m5.jpg",
    title: "Stonks",
    description: "Number goes up!",
  },
  {
    id: 3,
    imageUrl: "https://i.imgflip.com/26am.jpg",
    title: "Surprised Pikachu",
    description: "When something obvious happens",
  },
  {
    id: 4,
    imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
    title: "Distracted Boyfriend",
    description: "Looking at something else",
  },
  {
    id: 5,
    imageUrl: "https://i.imgflip.com/30b1gx.jpg",
    title: "Drake Pointing",
    description: "This is better",
  },
];

const MemeTinder: NextPage = () => {
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const currentMeme = sampleMemes[currentMemeIndex];

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;

    if (Math.abs(info.offset.x) > threshold) {
      setIsAnimating(true);

      if (info.offset.x > 0) {
        // 向右滑动 - 喜欢
        setLikes(prev => prev + 1);
        console.log(`👍 Liked: ${currentMeme.title}`);
      } else {
        // 向左滑动 - 不喜欢
        setDislikes(prev => prev + 1);
        console.log(`👎 Disliked: ${currentMeme.title}`);
      }

      // 移动到下一个 meme
      setTimeout(() => {
        nextMeme();
        x.set(0);
        setIsAnimating(false);
      }, 300);
    } else {
      // 回到原位
      x.set(0);
    }
  };

  const nextMeme = () => {
    setCurrentMemeIndex(prev => (prev + 1) % sampleMemes.length);
  };

  const handleLike = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setLikes(prev => prev + 1);
    x.set(300);

    setTimeout(() => {
      nextMeme();
      x.set(0);
      setIsAnimating(false);
    }, 300);
  };

  const handleDislike = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDislikes(prev => prev + 1);
    x.set(-300);

    setTimeout(() => {
      nextMeme();
      x.set(0);
      setIsAnimating(false);
    }, 300);
  };

  if (!currentMeme) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No more memes!</h2>
          <button onClick={() => setCurrentMemeIndex(0)} className="btn btn-primary">
            Restart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">MemeTinder 🔥</h1>
          <p className="text-white/80">Swipe right to like, left to pass</p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{likes}</div>
              <div className="text-white/80 text-sm">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{dislikes}</div>
              <div className="text-white/80 text-sm">Passes</div>
            </div>
          </div>
        </div>

        {/* Card Stack Container */}
        <div className="relative h-[600px] flex items-center justify-center">
          {/* Background Cards */}
          {sampleMemes.slice(currentMemeIndex + 1, currentMemeIndex + 3).map((meme, index) => (
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
                  // Fallback image
                  e.currentTarget.src = "https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Meme+Not+Found";
                }}
              />

              {/* Swipe Indicators */}
              <motion.div
                className="absolute top-8 left-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xl transform -rotate-12"
                style={{
                  opacity: useTransform(x, [50, 150], [0, 1]),
                }}
              >
                LIKE
              </motion.div>

              <motion.div
                className="absolute top-8 right-8 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xl transform rotate-12"
                style={{
                  opacity: useTransform(x, [-150, -50], [1, 0]),
                }}
              >
                NOPE
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
            disabled={isAnimating}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
          >
            <XMarkIcon className="w-8 h-8 text-red-500" />
          </button>

          <button
            onClick={handleLike}
            disabled={isAnimating}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
          >
            <HeartIcon className="w-8 h-8 text-pink-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="text-white/80 text-sm">
            {currentMemeIndex + 1} of {sampleMemes.length}
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentMemeIndex + 1) / sampleMemes.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeTinder;
