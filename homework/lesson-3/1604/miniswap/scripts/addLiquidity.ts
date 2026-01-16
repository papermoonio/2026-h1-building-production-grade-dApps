import { ethers } from "hardhat";
import { MiniSwap, MockERC20 } from "../typechain-types";

async function main() {
  // Get the deployed contract addresses (you may need to update these)
  // For now, let's first get the deployed instances
  const [owner, addr1] = await ethers.getSigners();
  
  // Assuming you know the deployed addresses
  // You can either hardcode them or read from a deployed addresses file
  // For this example, we'll redeploy to get fresh addresses
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKNA", ethers.parseEther("1000000"));
  const tokenB = await MockERC20.deploy("Token B", "TKNB", ethers.parseEther("1000000"));
  
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();
  
  console.log(`Token A deployed to: ${await tokenA.getAddress()}`);
  console.log(`Token B deployed to: ${await tokenB.getAddress()}`);

  const MiniSwap = await ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy();
  await miniSwap.waitForDeployment();
  
  console.log(`MiniSwap deployed to: ${await miniSwap.getAddress()}`);

  // Amount of liquidity to add
  const liquidityAmount = ethers.parseEther("100");

  // Approve the MiniSwap contract to spend tokens
  console.log("Approving tokens for MiniSwap contract...");
  await tokenA.approve(await miniSwap.getAddress(), ethers.MaxUint256);
  await tokenB.approve(await miniSwap.getAddress(), ethers.MaxUint256);

  // Add liquidity
  console.log(`Adding liquidity: ${ethers.formatEther(liquidityAmount)} of each token...`);
  const tx = await miniSwap.addLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    liquidityAmount
  );
  await tx.wait();

  console.log("Liquidity added successfully!");
  
  // Log the pool info
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
  const userShares = await miniSwap.userLiquidity(poolKey, await owner.getAddress());
  const totalShares = await miniSwap.totalLiquidityShares(poolKey);

  console.log("Pool Info:");
  console.log(`Pool amount: ${ethers.formatEther(poolAmount)}`);
  console.log(`User shares: ${ethers.formatEther(userShares)}`);
  console.log(`Total shares: ${ethers.formatEther(totalShares)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});