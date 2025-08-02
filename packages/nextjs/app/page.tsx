"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FireIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="flex items-center flex-col grow pt-10 px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">Meme Battle 🔥</h1>
            <p className="text-xl text-white/80 mb-6 max-w-2xl">
              投票选出最火的 Meme，参与拍卖赢取奖励！每次滑动都是链上交易，完成投票获得激励。
            </p>

            {connectedAddress && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
                <p className="text-white/80 text-sm mb-2">当前连接地址:</p>
                <Address address={connectedAddress} />
              </div>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mb-12">
            {/* Demo Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-4 border-purple-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎭</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">演示版本</h3>
                <p className="text-gray-600 mb-6">体验滑动投票界面，无需连接钱包即可演示</p>
                <Link
                  href="/demo"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 inline-block"
                >
                  🎭 演示体验
                </Link>
              </div>
            </div>

            {/* Start Game Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <FireIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">开始投票</h3>
                <p className="text-gray-600 mb-6">对100个 Meme 进行快速投票，每次滑动都会触发链上交易</p>
                <Link
                  href="/meme-tinder"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 inline-block"
                >
                  🚀 开始挑战
                </Link>
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">排行榜</h3>
                <p className="text-gray-600 mb-6">查看最受欢迎的 Meme 排行榜和实时投票统计</p>
                <Link
                  href="/meme-leaderboard"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 inline-block"
                >
                  🏆 查看排行
                </Link>
              </div>
            </div>

            {/* Auction Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <CurrencyDollarIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">NFT 拍卖</h3>
                <p className="text-gray-600 mb-6">竞拍最火和最冷门的 Meme NFT，支持者可分享收益</p>
                <Link
                  href="/meme-leaderboard"
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-300 inline-block"
                >
                  🔨 参与拍卖
                </Link>
              </div>
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl w-full mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">🎮 游戏规则</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <ClockIcon className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">时间限制</h3>
                  <p className="text-white/80">5分钟内完成100个 Meme 的投票，时间到自动结束</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <UserGroupIcon className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">链上投票</h3>
                  <p className="text-white/80">每次滑动都会触发区块链交易，确保投票公开透明</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <TrophyIcon className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">奖励机制</h3>
                  <p className="text-white/80">完成投票获得基础奖励，参与拍卖可获得额外收益</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <ChartBarIcon className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">结果公布</h3>
                  <p className="text-white/80">投票结束后公布最受欢迎和最不受欢迎的 Meme</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">100</div>
              <div className="text-white/80 text-sm">Meme 总数</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">5:00</div>
              <div className="text-white/80 text-sm">游戏时间</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">24h</div>
              <div className="text-white/80 text-sm">拍卖时长</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">🔥</div>
              <div className="text-white/80 text-sm">链上投票</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
