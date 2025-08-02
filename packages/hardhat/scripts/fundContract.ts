import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  // 获取已部署的合约
  const contractAddress = "0x3dCA4E402cb096EBef075eE4c24d7142829eec4b";
  const yourContract = await ethers.getContractAt("YourContract", contractAddress);

  // 充值金额：0.01 MON (足够支付2次奖励)
  const fundAmount = ethers.parseEther("0.01");

  console.log(`💰 Funding contract ${contractAddress} with ${ethers.formatEther(fundAmount)} MON...`);

  // 调用 fundContract 函数
  const tx = await yourContract.fundContract({ value: fundAmount });

  console.log(`📡 Transaction sent: ${tx.hash}`);

  // 等待交易确认
  await tx.wait();

  console.log("✅ Contract funded successfully!");

  // 检查合约余额
  const balance = await yourContract.getContractBalance();
  console.log(`🏦 Contract balance: ${ethers.formatEther(balance)} MON`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
