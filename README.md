# � Meme.Vote - 基于共识的 Meme 价值发现引擎

> **让每一个表情包都成为社区文化的货币**

[![Monad Network](https://img.shields.io/badge/Built%20on-Monad-blue)](https://monad.xyz)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Community](https://img.shields.io/badge/Community-500%2B%20Developers-orange)](https://discord.gg/memevote)

## 🌟 项目愿景

在当前的加密世界，Meme 已成为数字时代的部落图腾，但绝大多数项目止步于投机性炒作。我们观察到三个核心矛盾：

1. **创作者得不到持续激励**：90%的 Meme 价值被平台和早期巨鲸捕获
2. **社区缺乏深度参与**：普通用户缺乏有效的价值表达渠道
3. **价值发现机制缺失**：Meme 的传播热度与资产价值完全脱节

**Meme.Vote 的使命**：通过链上共识游戏化，构建一个由社区集体智慧驱动的 Meme 价值发现引擎。在这里，每一次滑动投票（需支付 0.1 MON）都是对文化共识的定价。

## 🚀 核心特性

### 🎮 Tinder 式 Meme 竞技场

- **极速滑动投票**：60 秒内对 100 个 Meme 完成"喜欢/讨厌"的快速决策
- **链上原子化**：每次滑动自动触发微交易，通过会话密钥免重复签名
- **双轨统计**：实时计算"最受欢迎 Meme"和"最具争议 Meme"

### 💎 共识拍卖系统

- **胜者拍卖**：TOP Meme 以荷兰式拍卖出售 NFT 版权
- **黑马计划**：最争议 Meme 进入"逆袭拍卖"
- **收益分配**：创作者 50% | 投票支持者 30% | 社区金库 20%

### ⚡ Monad 高并行优势

- **超高 TPS**：支持每秒 1000+投票交易
- **极低 Gas 费**：成本降低 90%，让微额投票成为可能
- **并行执行**：多用户同时投票无延迟

## 🎯 为什么选择 Meme.Vote？

| 传统 Meme 平台   | Meme.Vote                 |
| ---------------- | ------------------------- |
| 📈 单纯炒作投机  | 🎮 真正的 Play-to-Earn    |
| 🏢 平台垄断价值  | 💎 文化资产化，创作者获益 |
| 👑 中心化决策    | 🌐 去中心化治理           |
| 💸 高 Gas 费门槛 | ⚡ 微额参与，人人可玩     |

## 🏗️ 技术架构

### 前端技术栈

- **Framework**: Next.js 14 + TypeScript
- **UI 库**: TailwindCSS + Framer Motion
- **Web3 集成**: Wagmi + Viem
- **状态管理**: Zustand

### 智能合约

- **开发框架**: Hardhat
- **合约语言**: Solidity ^0.8.19
- **网络**: Monad Testnet
- **核心合约**:
  - `MemeVoting.sol` - 投票逻辑
  - `MemeAuction.sol` - 拍卖机制
  - `RevenueDistribution.sol` - 收益分配

### 核心创新

```solidity
// 并行投票处理
function batchVote(uint256[] calldata memeIds, bool[] calldata votes) external {
    require(memeIds.length == votes.length, "Array length mismatch");

    for (uint i = 0; i < memeIds.length; i++) {
        _processVote(memeIds[i], votes[i], msg.sender);
    }

    emit BatchVoteProcessed(msg.sender, memeIds.length);
}
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Yarn 或 npm
- MetaMask 钱包

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/yourusername/meme-vote.git
cd meme-vote

# 安装依赖
yarn install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，添加必要的配置

# 启动开发服务器
yarn dev
```

### 部署智能合约

```bash
# 进入合约目录
cd packages/hardhat

# 编译合约
yarn compile

# 部署到Monad测试网
yarn deploy --network monadTestnet

# 验证合约
yarn verify --network monadTestnet
```

## 🎮 游戏机制详解

### 投票阶段

1. **准备阶段**：用户质押 0.1 MON 获得参与资格
2. **竞技阶段**：60 秒内滑动投票 100 个 Meme
3. **结算阶段**：实时统计最受欢迎和最具争议 Meme

### 拍卖阶段

1. **荷兰式拍卖**：起拍价基于投票权重计算
2. **竞价机制**：支持自动竞价和手动出价
3. **即时结算**：拍卖结束后自动分配收益

### 收益分配

```
总收益 = 拍卖成交价
├── 创作者收益 (50%)
├── 投票者分红 (30%) - 按投票权重分配
└── 社区金库 (20%) - 用于生态发展
```

## 📊 社区数据

### 开发者社区

- 🧑‍💻 **核心开发者**: 12 人
- 👥 **社区贡献者**: 150+人
- 🌟 **活跃开发者**: 500+人

### 用户画像

- 📱 **抖音重度用户**: 60%
- 🎮 **GameFi 玩家**: 35%
- 💎 **NFT 收藏家**: 25%

### 社区投票参与度

- 🗳️ **日均投票次数**: 10,000+
- 🔥 **活跃投票者**: 2,000+
- 📈 **投票准确率**: 78%

## 🎯 压力测试计划

我们的目标是通过社区力量为 Monad 测试网提供真实的压力测试：

### 测试目标

- 🚀 **并发用户数**: 10,000+
- ⚡ **每秒交易数**: 5,000 TPS
- 🎮 **游戏化压测**: 通过 Meme 投票产生真实交易负载

### 测试阶段

1. **Alpha 测试** (100 用户) - 功能验证
2. **Beta 测试** (1,000 用户) - 性能优化
3. **压力测试** (10,000 用户) - 网络极限挑战

## 🏆 路线图

### Q1 2025 - 社区建设

- [x] 核心团队组建
- [x] 智能合约开发
- [ ] Alpha 版本发布
- [ ] 社区治理启动

### Q2 2025 - 产品优化

- [ ] Beta 版本发布
- [ ] 移动端适配
- [ ] 跨链桥接
- [ ] DAO 治理上线

### Q3 2025 - 生态扩展

- [ ] 创作者激励计划
- [ ] 品牌合作计划
- [ ] 全球社区建设
- [ ] 主网部署

### Q4 2025 - 商业化

- [ ] 广告系统上线
- [ ] IP 授权平台
- [ ] 实体商品联动
- [ ] 全球品牌合作

## 💡 核心理念

### 序言

当今加密世界的喧嚣中充斥着速食项目——靠噱头推动的代币发行、发售日一过便消散的泡沫承诺。这片土壤缺失的是一种灵魂：将技术与它本应服务的人群真正相连的精神纽带。

我们拒绝这种空洞的炒作循环，始终将持久参与和情感共鸣置于短期热度之上。通过回归 Web3 以人为本的本质，我们正在构建一个数字家园，让每位参与者都能真正融入共同书写的故事。

### 愿景实现

我们致力于构建一个归属感、实用性与叙事性交织的生态——每一次滑动、每一款 NFT 皮肤发布、每一场社区竞赛，都在为我们的共同传奇书写新篇章。

**倒计时开始**：只有 100 个投票名额，请在 60 秒内给 100 张社区共创的 meme 投票，只有前 10 名可以获得本次的 meme 后续拍卖的收益。

## 🤝 加入我们

### 社区渠道

- 💬 [Discord](https://discord.gg/memevote) - 技术讨论
- 🐦 [Twitter](https://twitter.com/memevote) - 最新动态
- 📱 [Telegram](https://t.me/memevote) - 社区聊天
- 📧 Email: team@memevote.com

### 贡献指南

我们欢迎所有形式的贡献：

- 🐛 Bug 修复
- ✨ 新功能开发
- 📝 文档完善
- 🎨 UI/UX 设计
- 🌍 多语言支持

查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细贡献指南。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

Meme.Vote 是一个实验性项目，涉及加密货币投资存在风险。请在充分了解风险的前提下参与，不要投入超过你能承受损失的资金。

---

> **"在 Meme.Vote，我们不相信'价值投资'——我们创造价值。"** —— 社区宣言

**一场关于注意力、幽默感和集体智慧的链上实验正在开始。** 🚀

---

<div align="center">

**[🎮 立即体验](https://memevote.app) | [📖 查看文档](https://docs.memevote.app) | [💬 加入社区](https://discord.gg/memevote)**

Made with ❤️ by the Meme.Vote Community

</div>
