import hre from "hardhat";

async function main() {
  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "No accounts available. Please provide a valid MNEMONIC environment variable.\n" +
      "Example: export MNEMONIC='your twelve word mnemonic phrase here'\n" +
      "Or update hardhat.config.js with a valid mnemonic."
    );
  }
  const [deployer] = signers;
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy ERC20 tokens
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const token0 = await ERC20.deploy("Token0", "T0", 1000000);
  await token0.waitForDeployment();
  console.log("Token0 deployed to:", await token0.getAddress());

  const token1 = await ERC20.deploy("Token1", "T1", 1000000);
  await token1.waitForDeployment();
  console.log("Token1 deployed to:", await token1.getAddress());

  // Deploy MiniSwap
  const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
  const miniswap = await MiniSwap.deploy(await token0.getAddress(), await token1.getAddress());
  await miniswap.waitForDeployment();
  console.log("MiniSwap deployed to:", await miniswap.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("Token0:", await token0.getAddress());
  console.log("Token1:", await token1.getAddress());
  console.log("MiniSwap:", await miniswap.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });