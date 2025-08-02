import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing MemeTinder Contract on Monad Testnet...");

  const contractAddress = "0x3dCA4E402cb096EBef075eE4c24d7142829eec4b";
  const yourContract = await ethers.getContractAt("YourContract", contractAddress);

  const [signer] = await ethers.getSigners();
  const userAddress = await signer.getAddress();

  console.log(`📱 User Address: ${userAddress}`);
  console.log(`📄 Contract Address: ${contractAddress}`);

  // 检查合约基本信息
  try {
    const owner = await yourContract.owner();
    const swipeFee = await yourContract.SWIPE_FEE();
    const rewardThreshold = await yourContract.REWARD_THRESHOLD();
    const rewardAmount = await yourContract.REWARD_AMOUNT();

    console.log(`👑 Contract Owner: ${owner}`);
    console.log(`💰 Swipe Fee: ${ethers.formatEther(swipeFee)} MON`);
    console.log(`🎯 Reward Threshold: ${rewardThreshold} swipes`);
    console.log(`🎁 Reward Amount: ${ethers.formatEther(rewardAmount)} MON`);

    // 检查合约余额
    const contractBalance = await yourContract.getContractBalance();
    console.log(`🏦 Contract Balance: ${ethers.formatEther(contractBalance)} MON`);

    // 检查用户余额
    const userBalance = await ethers.provider.getBalance(userAddress);
    console.log(`👤 User Balance: ${ethers.formatEther(userBalance)} MON`);

    // 检查用户统计
    const userStats = await yourContract.getUserStats(userAddress);
    console.log(`📊 User Swipes: ${userStats[0]}`);
    console.log(`🏆 User Rewards: ${ethers.formatEther(userStats[1])} MON`);

    // 检查距离下次奖励的滑动次数
    const swipesToNextReward = await yourContract.getSwipesToNextReward(userAddress);
    console.log(`⏳ Swipes to next reward: ${swipesToNextReward}`);

    console.log("\n✅ Contract is working correctly!");
  } catch (error) {
    console.error("❌ Error testing contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
