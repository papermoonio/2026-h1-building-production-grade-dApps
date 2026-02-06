import { ethers } from "hardhat";

async function main() {
  console.log("========================================");
  console.log("MiniSwap Deployment Script");
  console.log("========================================\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  // 1. Deploy MiniSwap contract
  console.log("\n1. Deploying MiniSwap contract...");
  const MiniSwapFactory = await ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwapFactory.deploy();
  await miniSwap.waitForDeployment();
  const miniSwapAddress = await miniSwap.getAddress();
  console.log(`✓ MiniSwap deployed to: ${miniSwapAddress}`);

  // 2. Deploy TestToken A
  console.log("\n2. Deploying TestToken A...");
  const TestTokenFactory = await ethers.getContractFactory("TestToken");
  const tokenA = await TestTokenFactory.deploy("Token A", "TKA", 18);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log(`✓ Token A deployed to: ${tokenAAddress}`);

  // 3. Deploy TestToken B
  console.log("\n3. Deploying TestToken B...");
  const tokenB = await TestTokenFactory.deploy("Token B", "TKB", 18);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log(`✓ Token B deployed to: ${tokenBAddress}`);

  // 4. Mint initial tokens
  console.log("\n4. Minting initial tokens...");
  const initialMint = ethers.parseEther("10000");
  
  await tokenA.mint(deployer.address, initialMint);
  console.log(`✓ Minted ${ethers.formatEther(initialMint)} Token A`);
  
  await tokenB.mint(deployer.address, initialMint);
  console.log(`✓ Minted ${ethers.formatEther(initialMint)} Token B`);

  // 5. Check balances
  console.log("\n5. Checking balances...");
  const balanceA = await tokenA.balanceOf(deployer.address);
  const balanceB = await tokenB.balanceOf(deployer.address);
  console.log(`Token A balance: ${ethers.formatEther(balanceA)}`);
  console.log(`Token B balance: ${ethers.formatEther(balanceB)}`);

  // 6. Approve MiniSwap to spend tokens
  console.log("\n6. Approving MiniSwap to spend tokens...");
  await tokenA.approve(miniSwapAddress, ethers.MaxUint256);
  console.log(`✓ Approved Token A`);
  
  await tokenB.approve(miniSwapAddress, ethers.MaxUint256);
  console.log(`✓ Approved Token B`);

  // 7. Add initial liquidity
  console.log("\n7. Adding initial liquidity...");
  const liquidityAmount = ethers.parseEther("100");
  const tx = await miniSwap.addLiquidity(
    tokenAAddress,
    tokenBAddress,
    liquidityAmount,
    liquidityAmount
  );
  await tx.wait();
  console.log(`✓ Added ${ethers.formatEther(liquidityAmount)} of each token`);

  // 8. Check pool info
  console.log("\n8. Checking pool info...");
  const [reserve0, reserve1, totalLiquidity] = await miniSwap.getPoolInfo(
    tokenAAddress,
    tokenBAddress
  );
  console.log(`Reserve A: ${ethers.formatEther(reserve0)}`);
  console.log(`Reserve B: ${ethers.formatEther(reserve1)}`);
  console.log(`Total Liquidity: ${ethers.formatEther(totalLiquidity)}`);

  // 9. Summary
  console.log("\n========================================");
  console.log("Deployment Summary");
  console.log("========================================");
  console.log(`MiniSwap Address: ${miniSwapAddress}`);
  console.log(`Token A Address: ${tokenAAddress}`);
  console.log(`Token B Address: ${tokenBAddress}`);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log("\nRemember to update your .env file with these addresses!");

  // 10. Save addresses to file
  const fs = require("fs");
  const addresses = {
    miniSwap: miniSwapAddress,
    tokenA: tokenAAddress,
    tokenB: tokenBAddress,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
  };

  fs.writeFileSync(
    "deployment_addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n✓ Addresses saved to deployment_addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
