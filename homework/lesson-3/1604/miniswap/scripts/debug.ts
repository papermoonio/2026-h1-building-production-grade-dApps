import { ethers } from "hardhat";

async function main() {
  console.log("Getting signers...");
  const [owner] = await ethers.getSigners();
  console.log("Deploying contracts...");

  // Deploy mock tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKNA", ethers.parseEther("1000000"));
  const tokenB = await MockERC20.deploy("Token B", "TKNB", ethers.parseEther("1000000"));
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();
  
  console.log("Token A:", await tokenA.getAddress());
  console.log("Token B:", await tokenB.getAddress());

  // Deploy MiniSwap
  const MiniSwap = await ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy();
  await miniSwap.waitForDeployment();
  console.log("MiniSwap deployed to:", await miniSwap.getAddress());

  // Mint tokens to owner
  await tokenA.transfer(owner.address, ethers.parseEther("1000"));
  await tokenB.transfer(owner.address, ethers.parseEther("1000"));

  // Approve tokens
  await tokenA.approve(await miniSwap.getAddress(), ethers.parseEther("1000"));
  await tokenB.approve(await miniSwap.getAddress(), ethers.parseEther("1000"));

  console.log("Adding liquidity...");
  await miniSwap.addLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    ethers.parseEther("100")
  );

  console.log("Checking liquidity pools...");
  // Need to generate the correct key for testing
  const tokenAAddr = await tokenA.getAddress();
  const tokenBAddr = await tokenB.getAddress();
  let poolKey: string;
  if (tokenAAddr.toLowerCase() < tokenBAddr.toLowerCase()) {
    poolKey = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address", "address"], [tokenAAddr, tokenBAddr]));
  } else {
    poolKey = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address", "address"], [tokenBAddr, tokenAAddr]));
  }
  
  console.log("Pool Key:", poolKey);
  
  // Get the pool amount directly from the contract mapping
  const liquidityPoolsSlot = 0; // slot 0 is liquidityPools
  const poolAmount = await ethers.provider.getStorage(
    await miniSwap.getAddress(),
    ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "uint256"], 
        [poolKey, liquidityPoolsSlot]
      )
    )
  );
  
  console.log("Pool amount from storage:", poolAmount);
  
  const poolAmountResult = await miniSwap.liquidityPools(poolKey);
  console.log("Pool amount from view function:", poolAmountResult.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });