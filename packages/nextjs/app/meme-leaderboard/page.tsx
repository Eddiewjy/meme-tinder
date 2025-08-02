"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ChartBarIcon, CurrencyDollarIcon } from "@heroicons/react/24/solid";
import { notification } from "~~/utils/scaffold-eth";

interface MemeStats {
  id: number;
  title: string;
  imageUrl: string;
  likes: number;
  dislikes: number;
  totalVotes: number;
  likeRate: number;
  rank: number;
}

interface AuctionItem {
  memeId: number;
  meme: MemeStats;
  currentBid: number;
  highestBidder: string;
  auctionEndTime: number;
  isActive: boolean;
}

const MemeLeaderboard: NextPage = () => {
  const { address, isConnected } = useAccount();
  const [memeStats, setMemeStats] = useState<MemeStats[]>([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "auction">("leaderboard");
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<{ [key: number]: string }>({});

  // 模拟数据加载
  useEffect(() => {
    loadMemeStats();
    loadAuctionData();
  }, []);

  const loadMemeStats = async () => {
    // 模拟从链上获取投票数据
    const mockStats: MemeStats[] = [
      {
        id: 1,
        title: "Distracted Boyfriend #1",
        imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
        likes: 856,
        dislikes: 234,
        totalVotes: 1090,
        likeRate: 0.785,
        rank: 1,
      },
      {
        id: 2,
        title: "Drake Pointing #1",
        imageUrl: "https://i.imgflip.com/30b1gx.jpg",
        likes: 742,
        dislikes: 298,
        totalVotes: 1040,
        likeRate: 0.713,
        rank: 2,
      },
      {
        id: 3,
        title: "Surprised Pikachu #1",
        imageUrl: "https://i.imgflip.com/26am.jpg",
        likes: 689,
        dislikes: 401,
        totalVotes: 1090,
        likeRate: 0.632,
        rank: 3,
      },
      {
        id: 4,
        title: "Stonks #1",
        imageUrl: "https://i.imgflip.com/4t0m5.jpg",
        likes: 523,
        dislikes: 567,
        totalVotes: 1090,
        likeRate: 0.48,
        rank: 4,
      },
      {
        id: 5,
        title: "Success Kid #1",
        imageUrl: "https://i.imgflip.com/1bij.jpg",
        likes: 234,
        dislikes: 856,
        totalVotes: 1090,
        likeRate: 0.215,
        rank: 5,
      },
    ];

    setMemeStats(mockStats);
    setLoading(false);
  };

  const loadAuctionData = async () => {
    // 模拟拍卖数据（最高和最低排名的meme）
    const mockAuctions: AuctionItem[] = [
      {
        memeId: 1,
        meme: {
          id: 1,
          title: "Distracted Boyfriend #1",
          imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
          likes: 856,
          dislikes: 234,
          totalVotes: 1090,
          likeRate: 0.785,
          rank: 1,
        },
        currentBid: 2.5,
        highestBidder: "0x1234...5678",
        auctionEndTime: Date.now() + 24 * 60 * 60 * 1000, // 24小时后结束
        isActive: true,
      },
      {
        memeId: 5,
        meme: {
          id: 5,
          title: "Success Kid #1",
          imageUrl: "https://i.imgflip.com/1bij.jpg",
          likes: 234,
          dislikes: 856,
          totalVotes: 1090,
          likeRate: 0.215,
          rank: 5,
        },
        currentBid: 0.1,
        highestBidder: "0x8765...4321",
        auctionEndTime: Date.now() + 24 * 60 * 60 * 1000,
        isActive: true,
      },
    ];

    setAuctionItems(mockAuctions);
  };

  const handleBid = async (auctionId: number) => {
    if (!isConnected) {
      notification.error("请先连接钱包");
      return;
    }

    const bidValue = bidAmount[auctionId];
    if (!bidValue || parseFloat(bidValue) <= 0) {
      notification.error("请输入有效的出价金额");
      return;
    }

    try {
      // 这里应该调用智能合约进行出价
      notification.success(`出价成功！金额: ${bidValue} ETH`);

      // 更新拍卖数据
      setAuctionItems(prev =>
        prev.map(item =>
          item.memeId === auctionId
            ? { ...item, currentBid: parseFloat(bidValue), highestBidder: address || "" }
            : item,
        ),
      );

      setBidAmount(prev => ({ ...prev, [auctionId]: "" }));
    } catch (error) {
      notification.error("出价失败，请重试");
      console.error("Bid error:", error);
    }
  };

  const formatTimeLeft = (endTime: number) => {
    const diff = endTime - Date.now();
    if (diff <= 0) return "已结束";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}小时${minutes}分钟`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-600 bg-yellow-50";
      case 2:
        return "text-gray-600 bg-gray-50";
      case 3:
        return "text-amber-600 bg-amber-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>加载排行榜数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Meme 排行榜</h1>
          <p className="text-white/80">查看最受欢迎的 Meme 和拍卖</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "leaderboard" ? "bg-white text-purple-600 shadow-lg" : "text-white hover:bg-white/10"
              }`}
            >
              <ChartBarIcon className="w-5 h-5 inline mr-2" />
              排行榜
            </button>
            <button
              onClick={() => setActiveTab("auction")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "auction" ? "bg-white text-purple-600 shadow-lg" : "text-white hover:bg-white/10"
              }`}
            >
              <CurrencyDollarIcon className="w-5 h-5 inline mr-2" />
              拍卖
            </button>
          </div>
        </div>

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            {memeStats.map(meme => (
              <div
                key={meme.id}
                className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div
                    className={`w-16 h-16 rounded-xl ${getRankColor(meme.rank)} flex items-center justify-center text-2xl font-bold`}
                  >
                    {getRankIcon(meme.rank)}
                  </div>

                  {/* Meme Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={meme.imageUrl}
                      alt={meme.title}
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.currentTarget.src = "https://via.placeholder.com/80x80/ff6b6b/ffffff?text=?";
                      }}
                    />
                  </div>

                  {/* Meme Info */}
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{meme.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>👍 {meme.likes}</span>
                      <span>👎 {meme.dislikes}</span>
                      <span>📊 {meme.totalVotes} 总票数</span>
                    </div>
                  </div>

                  {/* Like Rate */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{(meme.likeRate * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">支持率</div>

                    {/* Progress Bar */}
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${meme.likeRate * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Auction Tab */}
        {activeTab === "auction" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">🔨 Meme 拍卖</h2>
              <p className="text-white/80">竞拍最受欢迎和最不受欢迎的 Meme</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {auctionItems.map(auction => (
                <div key={auction.memeId} className="bg-white rounded-2xl p-6 shadow-xl">
                  {/* Auction Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        auction.meme.rank === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {auction.meme.rank === 1 ? "🔥 最受欢迎" : "📉 最不受欢迎"}
                    </div>
                    <div className="text-sm text-gray-500">⏰ {formatTimeLeft(auction.auctionEndTime)}</div>
                  </div>

                  {/* Meme Display */}
                  <div className="text-center mb-6">
                    <img
                      src={auction.meme.imageUrl}
                      alt={auction.meme.title}
                      className="w-32 h-32 object-cover rounded-xl mx-auto mb-3"
                      onError={e => {
                        e.currentTarget.src = "https://via.placeholder.com/128x128/ff6b6b/ffffff?text=?";
                      }}
                    />
                    <h3 className="font-bold text-gray-800">{auction.meme.title}</h3>
                    <p className="text-sm text-gray-600">支持率: {(auction.meme.likeRate * 100).toFixed(1)}%</p>
                  </div>

                  {/* Current Bid */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{auction.currentBid} ETH</div>
                      <div className="text-sm text-gray-600">当前最高出价</div>
                      {auction.highestBidder && (
                        <div className="text-xs text-gray-500 mt-1">
                          出价者: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bid Input */}
                  {auction.isActive && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min={auction.currentBid + 0.01}
                          placeholder={`最低 ${(auction.currentBid + 0.01).toFixed(2)} ETH`}
                          value={bidAmount[auction.memeId] || ""}
                          onChange={e =>
                            setBidAmount(prev => ({
                              ...prev,
                              [auction.memeId]: e.target.value,
                            }))
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleBid(auction.memeId)}
                          disabled={!isConnected || !bidAmount[auction.memeId]}
                          className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          出价
                        </button>
                      </div>

                      {!isConnected && <p className="text-sm text-red-500 text-center">请连接钱包以参与拍卖</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Auction Rules */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-8">
              <h3 className="text-xl font-bold text-white mb-4">🔨 拍卖规则</h3>
              <div className="grid md:grid-cols-2 gap-4 text-white/80 text-sm">
                <div>
                  <h4 className="font-medium mb-2">• 拍卖物品</h4>
                  <p>支持率最高和最低的 Meme NFT</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">• 拍卖时间</h4>
                  <p>每轮投票结束后开始，持续24小时</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">• 最低加价</h4>
                  <p>每次出价至少比当前价格高 0.01 ETH</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">• 奖励分配</h4>
                  <p>拍卖收益的一部分将分给支持者</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeLeaderboard;
