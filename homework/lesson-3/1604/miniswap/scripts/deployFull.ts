import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Deploy MockERC20 tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKNA", ethers.parseEther("1000000"));
  const tokenB = await MockERC20.deploy("Token B", "TKNB", ethers.parseEther("1000000"));

  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();

  console.log(`Token A (TKNA) deployed to: ${await tokenA.getAddress()}`);
  console.log(`Token B (TKNB) deployed to: ${await tokenB.getAddress()}`);

  // Deploy MiniSwap contract
  const MiniSwap = await ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy();

  await miniSwap.waitForDeployment();

  console.log(`MiniSwap contract deployed to: ${await miniSwap.getAddress()}`);

  // Get signers - ensure we have enough accounts
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const addr1 = signers[1] || signers[0];  // Fallback to first signer if second doesn't exist
  const addr2 = signers[2] || signers[0];  // Fallback to first signer if third doesn't exist

  // Transfer some tokens to test accounts for liquidity provision (only if different)
  if (addr1.address !== owner.address) {
    await tokenA.transfer(addr1.address, ethers.parseEther("10000"));
    await tokenB.transfer(addr1.address, ethers.parseEther("10000"));
  }
  if (addr2.address !== owner.address && addr2.address !== addr1.address) {
    await tokenA.transfer(addr2.address, ethers.parseEther("10000"));
    await tokenB.transfer(addr2.address, ethers.parseEther("10000"));
  }

  console.log("\nContract addresses:");
  console.log(`MiniSwap: ${await miniSwap.getAddress()}`);
  console.log(`Token A: ${await tokenA.getAddress()}`);
  console.log(`Token B: ${await tokenB.getAddress()}`);
  
  console.log(`\nTest accounts:`);
  console.log(`Owner: ${await owner.getAddress()}`);
  console.log(`Addr1: ${await addr1.getAddress()}`);
  console.log(`Addr2: ${await addr2.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});