import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MiniSwap contract...");
  
  const MiniSwap = await ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy();
  
  await miniSwap.waitForDeployment();
  
  console.log(`MiniSwap contract deployed to: ${await miniSwap.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});