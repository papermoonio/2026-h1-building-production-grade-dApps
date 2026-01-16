import { ethers } from "hardhat";
import { MiniSwap, MockERC20 } from "../typechain-types";

async function main() {
  // Get the deployed contract addresses
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const addr1 = signers[1] || signers[0];  // Fallback to first signer if second doesn't exist
  const addr2 = signers[2] || signers[0];  // Fallback to first signer if third doesn't exist
  
  // Deploy MockERC20 tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKNA", ethers.parseEther("1000000"));
  const tokenB = await MockERC20.deploy("Token B", "TKNB", ethers.parseEther("1000000"));
  
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();
  
  console.log(`Token A deployed to: ${await tokenA.getAddress()}`);
  console.log(`Token B deployed to: ${await tokenB.getAddress()}`);

  // Deploy MiniSwap contract
  const MiniSwap = await ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy();
  await miniSwap.waitForDeployment();
  
  console.log(`MiniSwap deployed to: ${await miniSwap.getAddress()}`);

  // Transfer tokens to other accounts for testing (only if different)
  if (addr1.address !== owner.address) {
    await tokenA.transfer(addr1.address, ethers.parseEther("10000"));
    await tokenB.transfer(addr1.address, ethers.parseEther("10000"));
  }
  if (addr2.address !== owner.address && addr2.address !== addr1.address) {
    await tokenA.transfer(addr2.address, ethers.parseEther("10000"));
    await tokenB.transfer(addr2.address, ethers.parseEther("10000"));
  }

  // Add initial liquidity
  console.log("\n--- Adding Initial Liquidity ---");

  // Approve tokens for the owner
  await tokenA.approve(await miniSwap.getAddress(), ethers.MaxUint256);
  await tokenB.approve(await miniSwap.getAddress(), ethers.MaxUint256);

  const liquidityAmount = ethers.parseEther("100");
  const tx1 = await miniSwap.addLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    liquidityAmount
  );
  await tx1.wait();
  console.log("Initial liquidity added by owner");

  // Add more liquidity from another account (only if different)
  if (addr1.address !== owner.address) {
    await tokenA.connect(addr1).approve(await miniSwap.getAddress(), ethers.MaxUint256);
    await tokenB.connect(addr1).approve(await miniSwap.getAddress(), ethers.MaxUint256);

    const additionalLiquidity = ethers.parseEther("50");
    const tx2 = await miniSwap.connect(addr1).addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      additionalLiquidity
    );
    await tx2.wait();
    console.log("Additional liquidity added by addr1");
  } else {
    console.log("Addr1 is same as owner, skipping additional liquidity addition");
  }

  // Perform a swap (only if different account)
  console.log("\n--- Performing Swap ---");

  if (addr2.address !== owner.address) {
    // Approve tokenA for swapping
    await tokenA.connect(addr2).approve(await miniSwap.getAddress(), ethers.MaxUint256);

    const swapAmount = ethers.parseEther("10");
    const tx3 = await miniSwap.connect(addr2).swap(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      swapAmount
    );
    await tx3.wait();
    console.log("Swap performed: 10 TokenA -> 10 TokenB");
  } else {
    console.log("Addr2 is same as owner, skipping swap");
  }

  // Remove some liquidity (only if different account)
  console.log("\n--- Removing Liquidity ---");

  if (addr1.address !== owner.address) {
    const removeLiquidityAmount = ethers.parseEther("30");
    const tx4 = await miniSwap.connect(addr1).removeLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      removeLiquidityAmount
    );
    await tx4.wait();
    console.log("Liquidity removed by addr1");
  } else {
    console.log("Addr1 is same as owner, skipping liquidity removal");
  }

  console.log("\nInteraction completed successfully!");
  
  // Show final stats
  const tokenAAddr = await tokenA.getAddress();
  const tokenBAddr = await tokenB.getAddress();
  
  // Replicate the pool key calculation from the contract
  let poolKey: string;
  if (BigInt(tokenAAddr) < BigInt(tokenBAddr)) {
    poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddr, tokenBAddr]));
  } else {
    poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenBAddr, tokenAAddr]));
  }

  const poolAmount = await miniSwap.liquidityPools(poolKey);
  const ownerShares = await miniSwap.userLiquidity(poolKey, await owner.getAddress());
  const addr1Shares = await miniSwap.userLiquidity(poolKey, await addr1.getAddress());
  const totalShares = await miniSwap.totalLiquidityShares(poolKey);

  console.log("\nFinal Pool Stats:");
  console.log(`Total pool amount: ${ethers.formatEther(poolAmount)}`);
  console.log(`Owner shares: ${ethers.formatEther(ownerShares)}`);
  console.log(`Addr1 shares: ${ethers.formatEther(addr1Shares)}`);
  console.log(`Total shares: ${ethers.formatEther(totalShares)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});