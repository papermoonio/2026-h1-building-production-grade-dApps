import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  
  if (owner) {
    const address = await owner.getAddress();
    console.log(`Checking balance for account: ${address}`);
    
    const balance = await owner.provider!.getBalance(address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  } else {
    console.log("No signer available");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});