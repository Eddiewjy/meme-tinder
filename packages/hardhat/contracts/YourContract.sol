//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

/**
 * A smart contract for Meme Tinder game
 * Users pay 0.001 MON per swipe and get rewards after reaching certain thresholds
 * @author MemeTinder Team
 */
contract YourContract {
    // 每次滑动的费用：0.001 MON
    uint256 public constant SWIPE_FEE = 0.001 ether;

    // 奖励阈值和奖励金额
    uint256 public constant REWARD_THRESHOLD = 10; // 滑动10次后给奖励
    uint256 public constant REWARD_AMOUNT = 0.005 ether; // 奖励0.005 MON

    // 用户数据
    mapping(address => uint256) public userSwipeCount;
    mapping(address => uint256) public userTotalRewards;
    mapping(address => uint256) public userBalance; // 用户预充值余额

    // 合约所有者
    address public immutable owner;

    // 事件
    event SwipeRecorded(address indexed user, uint256 swipeCount, uint256 fee);
    event RewardGiven(address indexed user, uint256 amount, uint256 totalSwipes);
    event BalanceDeposited(address indexed user, uint256 amount, uint256 newBalance);
    event BalanceWithdrawn(address indexed user, uint256 amount, uint256 remainingBalance);

    // Constructor: Called once on contract deployment
    constructor(address _owner) {
        owner = _owner;
    }

    // Modifier: used to define a set of rules that must be met before or after a function is executed
    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    // 记录滑动并收取费用（从预充值余额扣除）
    function recordSwipe() external {
        require(userBalance[msg.sender] >= SWIPE_FEE, "Insufficient balance. Please deposit more MON.");

        userBalance[msg.sender] -= SWIPE_FEE;
        userSwipeCount[msg.sender]++;

        console.log("Swipe recorded for %s, total: %d", msg.sender, userSwipeCount[msg.sender]);

        emit SwipeRecorded(msg.sender, userSwipeCount[msg.sender], SWIPE_FEE);

        // 检查是否达到奖励阈值
        if (userSwipeCount[msg.sender] % REWARD_THRESHOLD == 0) {
            _giveReward(msg.sender);
        }
    }

    // 用户预充值
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        userBalance[msg.sender] += msg.value;

        console.log("User %s deposited %d MON", msg.sender, msg.value);

        emit BalanceDeposited(msg.sender, msg.value, userBalance[msg.sender]);
    }

    // 用户提取余额
    function withdraw(uint256 amount) external {
        require(userBalance[msg.sender] >= amount, "Insufficient balance");
        require(amount > 0, "Withdrawal amount must be greater than 0");

        userBalance[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Failed to send MON");

        console.log("User %s withdrew %d MON", msg.sender, amount);

        emit BalanceWithdrawn(msg.sender, amount, userBalance[msg.sender]);
    }

    // 给用户奖励（直接加到用户余额）
    function _giveReward(address user) internal {
        require(address(this).balance >= REWARD_AMOUNT, "Insufficient contract balance for reward");

        userTotalRewards[user] += REWARD_AMOUNT;
        userBalance[user] += REWARD_AMOUNT; // 直接加到用户余额

        console.log("Reward given to %s: %d MON", user, REWARD_AMOUNT);

        emit RewardGiven(user, REWARD_AMOUNT, userSwipeCount[user]);
    }

    // 查询用户统计（包含余额）
    function getUserStats(address user) external view returns (uint256 swipes, uint256 rewards, uint256 balance) {
        return (userSwipeCount[user], userTotalRewards[user], userBalance[user]);
    }

    // 查询用户余额
    function getUserBalance(address user) external view returns (uint256) {
        return userBalance[user];
    }

    // 合约余额
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // 查询距离下次奖励还需要多少次滑动
    function getSwipesToNextReward(address user) external view returns (uint256) {
        uint256 swipes = userSwipeCount[user];
        uint256 remainder = swipes % REWARD_THRESHOLD;
        return remainder == 0 ? REWARD_THRESHOLD : REWARD_THRESHOLD - remainder;
    }

    // 合约所有者存入资金用于奖励
    function fundContract() external payable isOwner {
        // Contract can receive funds for rewards
    }

    // 提取合约资金（仅所有者）
    function withdraw() external isOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send MON");
    }

    /**
     * Function that allows the contract to receive MON
     */
    receive() external payable {}
}
