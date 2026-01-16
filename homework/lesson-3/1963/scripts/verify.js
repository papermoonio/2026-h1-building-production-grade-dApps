import hre from "hardhat";

// Your deployed contract addresses (from deployment)
const TOKEN0_ADDRESS = "0xc01Ee7f10EA4aF4673cFff62710E1D7792aBa8f3";
const TOKEN1_ADDRESS = "0x970951a12F975E6762482ACA81E57D5A2A4e73F4";
const MINISWAP_ADDRESS = "0x3ed62137c5DB927cb137c26455969116BF0c23Cb";

async function main() {
  console.log("=== Verifying Deployed Contracts ===\n");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "ETH\n");

  // Verify Token0
  console.log("1. Verifying Token0...");
  try {
    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const token0 = await ERC20.attach(TOKEN0_ADDRESS);
    
    const token0Name = await token0.name();
    const token0Symbol = await token0.symbol();
    const token0TotalSupply = await token0.totalSupply();
    const token0Balance = await token0.balanceOf(signer.address);
    
    console.log("   ✅ Token0 Contract Found!");
    console.log("   Name:", token0Name);
    console.log("   Symbol:", token0Symbol);
    console.log("   Total Supply:", hre.ethers.formatEther(token0TotalSupply));
    console.log("   Your Balance:", hre.ethers.formatEther(token0Balance));
    console.log("   Address:", TOKEN0_ADDRESS);
  } catch (error) {
    console.log("   ❌ Error verifying Token0:", error.message);
  }

  console.log("\n2. Verifying Token1...");
  try {
    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const token1 = await ERC20.attach(TOKEN1_ADDRESS);
    
    const token1Name = await token1.name();
    const token1Symbol = await token1.symbol();
    const token1TotalSupply = await token1.totalSupply();
    const token1Balance = await token1.balanceOf(signer.address);
    
    console.log("   ✅ Token1 Contract Found!");
    console.log("   Name:", token1Name);
    console.log("   Symbol:", token1Symbol);
    console.log("   Total Supply:", hre.ethers.formatEther(token1TotalSupply));
    console.log("   Your Balance:", hre.ethers.formatEther(token1Balance));
    console.log("   Address:", TOKEN1_ADDRESS);
  } catch (error) {
    console.log("   ❌ Error verifying Token1:", error.message);
  }

  console.log("\n3. Verifying MiniSwap...");
  try {
    const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
    const miniswap = await MiniSwap.attach(MINISWAP_ADDRESS);
    
    // Get token addresses from MiniSwap
    const token0 = await miniswap.token0();
    const token1 = await miniswap.token1();
    
    // Get reserves
    const reserves = await miniswap.getReserves();
    
    // Get total supply
    const totalSupply = await miniswap.totalSupply();
    
    console.log("   ✅ MiniSwap Contract Found!");
    console.log("   Address:", MINISWAP_ADDRESS);
    console.log("   Token0 Address:", token0);
    console.log("   Token1 Address:", token1);
    console.log("   Reserve0:", hre.ethers.formatEther(reserves[0]));
    console.log("   Reserve1:", hre.ethers.formatEther(reserves[1]));
    console.log("   Total Supply (LP shares):", hre.ethers.formatEther(totalSupply));
    
    // Verify token addresses match
    if (token0.toLowerCase() === TOKEN0_ADDRESS.toLowerCase()) {
      console.log("   ✅ Token0 address matches!");
    } else {
      console.log("   ⚠️  Token0 address mismatch!");
    }
    
    if (token1.toLowerCase() === TOKEN1_ADDRESS.toLowerCase()) {
      console.log("   ✅ Token1 address matches!");
    } else {
      console.log("   ⚠️  Token1 address mismatch!");
    }
  } catch (error) {
    console.log("   ❌ Error verifying MiniSwap:", error.message);
  }

  console.log("\n=== Verification Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
