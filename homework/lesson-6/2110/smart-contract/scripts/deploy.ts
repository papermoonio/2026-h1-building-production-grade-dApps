import hre from "hardhat";

async function main() {
  console.log("开始部署 ERC2110FT 合约...");

  // 获取部署账户
  const [deployer] = await hre.viem.getWalletClients();
  console.log("部署账户:", deployer.account.address);

  // 获取账户余额
  const publicClient = await hre.viem.getPublicClient();
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("账户余额:", (Number(balance) / 1e18).toFixed(4), "PAS");

  // 部署合约
  console.log("\n正在部署合约...");
  const token = await hre.viem.deployContract("ERC2110FT", ["TestToken", "TTK", 1000n]);

  console.log("✅ ERC2110FT 合约已部署到:", token.address);

  // 验证部署
  const name = await token.read.name();
  const symbol = await token.read.symbol();
  const totalSupply = await token.read.totalSupply();
  
  console.log("\n合约信息:");
  console.log("- 名称:", name);
  console.log("- 符号:", symbol);
  console.log("- 总供应量:", (Number(totalSupply) / 1e18).toFixed(0), "TTK");
  console.log("\n📋 请保存合约地址用于验证:", token.address);
  console.log("\n🔗 在区块链浏览器查看:");
  console.log("https://polkadot.testnet.routescan.io/address/" + token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
