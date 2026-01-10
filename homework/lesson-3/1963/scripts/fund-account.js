import hre from "hardhat";

// Your connected wallet address (the one shown in MetaMask)
const RECIPIENT_ADDRESS = "0x5e0774b9f1B5737c2c5e2eb88a6ca2eD08D9D629"; // TODO: Update with your actual address

async function main() {
  // Get the deployer account (which has ETH from the local node)
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("=== Funding Account with Native ETH ===");
  console.log("From (Deployer):", deployer.address);
  console.log("To (Your Wallet):", RECIPIENT_ADDRESS);
  
  // Check deployer balance
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("\nDeployer ETH balance:", hre.ethers.formatEther(deployerBalance), "ETH");
  
  // Check recipient balance before
  const recipientBalanceBefore = await hre.ethers.provider.getBalance(RECIPIENT_ADDRESS);
  console.log("Recipient ETH balance (before):", hre.ethers.formatEther(recipientBalanceBefore), "ETH");
  
  // Transfer 10 ETH (should be enough for many transactions)
  const amountToSend = hre.ethers.parseEther("10");
  
  console.log("\nTransferring 10 ETH...");
  const tx = await deployer.sendTransaction({
    to: RECIPIENT_ADDRESS,
    value: amountToSend,
  });
  
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  // Check recipient balance after
  const recipientBalanceAfter = await hre.ethers.provider.getBalance(RECIPIENT_ADDRESS);
  console.log("\n✅ Transfer Complete!");
  console.log("Recipient ETH balance (after):", hre.ethers.formatEther(recipientBalanceAfter), "ETH");
  console.log("\nYou now have ETH for gas fees! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
