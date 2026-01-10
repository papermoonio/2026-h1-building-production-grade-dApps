import hre from "hardhat";

// Contract addresses
const TOKEN0_ADDRESS = "0x21cb3940e6Ba5284E1750F1109131a8E8062b9f1";
const TOKEN1_ADDRESS = "0x3469E1DaC06611030AEce8209F07501E9A7aCC69";
const MINISWAP_ADDRESS = "0x7d4567B7257cf869B01a47E8cf0EDB3814bDb963";

async function main() {
  console.log("=== Testing MiniSwap Contract Interactions ===\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "ETH\n");

  // Get contract instances
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const token0 = await ERC20.attach(TOKEN0_ADDRESS);
  const token1 = await ERC20.attach(TOKEN1_ADDRESS);
  
  const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
  const miniswap = await MiniSwap.attach(MINISWAP_ADDRESS);

  // Test 1: Check initial state
  console.log("1. Checking initial state...");
  const initialReserves = await miniswap.getReserves();
  console.log("   Initial Reserves:", {
    token0: hre.ethers.formatEther(initialReserves[0]),
    token1: hre.ethers.formatEther(initialReserves[1])
  });

  const token0Balance = await token0.balanceOf(signer.address);
  const token1Balance = await token1.balanceOf(signer.address);
  console.log("   Your Token0 balance:", hre.ethers.formatEther(token0Balance));
  console.log("   Your Token1 balance:", hre.ethers.formatEther(token1Balance));

  // Test 2: Add liquidity
  console.log("\n2. Adding liquidity...");
  const liquidityAmount0 = hre.ethers.parseEther("100");
  const liquidityAmount1 = hre.ethers.parseEther("200");
  
  console.log("   Approving tokens...");
  const approve0Tx = await token0.approve(miniswap.target, liquidityAmount0);
  await approve0Tx.wait();
  console.log("   ✅ Token0 approved");

  const approve1Tx = await token1.approve(miniswap.target, liquidityAmount1);
  await approve1Tx.wait();
  console.log("   ✅ Token1 approved");

  console.log("   Adding liquidity: 100 T0 + 200 T1...");
  const addLiquidityTx = await miniswap.addLiquidity(liquidityAmount0, liquidityAmount1);
  const receipt = await addLiquidityTx.wait();
  console.log("   ✅ Liquidity added! Transaction:", receipt.hash);

  // Check reserves after adding liquidity
  const reservesAfterLiquidity = await miniswap.getReserves();
  console.log("   New Reserves:", {
    token0: hre.ethers.formatEther(reservesAfterLiquidity[0]),
    token1: hre.ethers.formatEther(reservesAfterLiquidity[1])
  });

  // Check LP shares
  const lpShares = await miniswap.balance(signer.address);
  console.log("   Your LP shares:", hre.ethers.formatEther(lpShares));

  // Test 3: Perform a swap
  console.log("\n3. Testing swap (Token0 -> Token1)...");
  const swapAmount = hre.ethers.parseEther("10");
  
  console.log("   Approving Token0 for swap...");
  const swapApproveTx = await token0.approve(miniswap.target, swapAmount);
  await swapApproveTx.wait();
  console.log("   ✅ Approved");

  const token1BalanceBefore = await token1.balanceOf(signer.address);
  console.log("   Token1 balance before swap:", hre.ethers.formatEther(token1BalanceBefore));

  console.log("   Swapping 10 T0 for T1...");
  const swapTx = await miniswap.swap(token0.target, swapAmount);
  const swapReceipt = await swapTx.wait();
  console.log("   ✅ Swap completed! Transaction:", swapReceipt.hash);

  const token1BalanceAfter = await token1.balanceOf(signer.address);
  const token1Received = token1BalanceAfter - token1BalanceBefore;
  console.log("   Token1 received:", hre.ethers.formatEther(token1Received));
  console.log("   Token1 balance after swap:", hre.ethers.formatEther(token1BalanceAfter));

  // Check reserves after swap
  const reservesAfterSwap = await miniswap.getReserves();
  console.log("   Reserves after swap:", {
    token0: hre.ethers.formatEther(reservesAfterSwap[0]),
    token1: hre.ethers.formatEther(reservesAfterSwap[1])
  });

  // Test 4: Remove liquidity
  console.log("\n4. Removing liquidity...");
  console.log("   Removing all LP shares...");
  const removeLiquidityTx = await miniswap.removeLiquidity(lpShares);
  const removeReceipt = await removeLiquidityTx.wait();
  console.log("   ✅ Liquidity removed! Transaction:", removeReceipt.hash);

  // Check final reserves
  const finalReserves = await miniswap.getReserves();
  console.log("   Final Reserves:", {
    token0: hre.ethers.formatEther(finalReserves[0]),
    token1: hre.ethers.formatEther(finalReserves[1])
  });

  const finalToken0Balance = await token0.balanceOf(signer.address);
  const finalToken1Balance = await token1.balanceOf(signer.address);
  console.log("   Final Token0 balance:", hre.ethers.formatEther(finalToken0Balance));
  console.log("   Final Token1 balance:", hre.ethers.formatEther(finalToken1Balance));

  console.log("\n=== All Tests Completed Successfully! ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });