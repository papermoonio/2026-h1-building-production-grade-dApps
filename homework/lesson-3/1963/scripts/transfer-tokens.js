import hre from "hardhat";

// Contract addresses (update after redeployment)
const TOKEN0_ADDRESS = "0xc01Ee7f10EA4aF4673cFff62710E1D7792aBa8f3";
const TOKEN1_ADDRESS = "0x970951a12F975E6762482ACA81E57D5A2A4e73F4";

// Replace with your connected wallet address (the one shown in the UI)
const RECIPIENT_ADDRESS = "0x5e0774b9f1B5737c2c5e2eb88a6ca2eD08D9D629"; // TODO: Replace with your actual connected wallet address

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Transferring tokens from deployer:", deployer.address);
  console.log("To recipient:", RECIPIENT_ADDRESS);
  console.log("Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get contract instances
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const token0 = await ERC20.attach(TOKEN0_ADDRESS);
  const token1 = await ERC20.attach(TOKEN1_ADDRESS);

  // Check deployer balances
  const deployerToken0Balance = await token0.balanceOf(deployer.address);
  const deployerToken1Balance = await token1.balanceOf(deployer.address);
  console.log("Deployer Token0 balance:", hre.ethers.formatEther(deployerToken0Balance));
  console.log("Deployer Token1 balance:", hre.ethers.formatEther(deployerToken1Balance));

  // Transfer tokens (1000 of each)
  const transferAmount = hre.ethers.parseEther("1000");
  
  console.log("\nTransferring 1000 T0...");
  const tx0 = await token0.transfer(RECIPIENT_ADDRESS, transferAmount);
  await tx0.wait();
  console.log("✅ Token0 transferred");

  console.log("\nTransferring 1000 T1...");
  const tx1 = await token1.transfer(RECIPIENT_ADDRESS, transferAmount);
  await tx1.wait();
  console.log("✅ Token1 transferred");

  // Verify balances
  const recipientToken0Balance = await token0.balanceOf(RECIPIENT_ADDRESS);
  const recipientToken1Balance = await token1.balanceOf(RECIPIENT_ADDRESS);
  
  console.log("\n=== Transfer Complete ===");
  console.log("Recipient Token0 balance:", hre.ethers.formatEther(recipientToken0Balance));
  console.log("Recipient Token1 balance:", hre.ethers.formatEther(recipientToken1Balance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
