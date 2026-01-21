import { ethers, upgrades } from "hardhat";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("\n=== 开始部署 UUPS 可升级合约到波卡测试网 ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 部署 V1 合约
  console.log("正在部署 UpgradeableCounterV1...");
  const CounterV1 = await ethers.getContractFactory("UpgradeableCounterV1");
  const proxy = await upgrades.deployProxy(
    CounterV1,
    ["MyUpgradeableCounter"], // 初始化参数: name
    {
      kind: "uups",
      initializer: "initialize",
      redeployImplementation: "always"  // 强制重新部署实现合约
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log("✅ V1 合约部署成功!");
  console.log("代理合约地址:", proxyAddress);

  // 获取实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("实现合约地址:", implementationAddress);

  // 获取部署交易 hash
  const receipt = await proxy.deploymentTransaction()?.wait();
  const deployTxHash = receipt?.hash || "N/A";
  console.log("部署交易 Hash:", deployTxHash);

  // 验证初始状态
  console.log("\n--- 验证初始状态 ---");
  const counter = CounterV1.attach(proxyAddress);
  const info = await counter.getInfo();
  console.log("版本号 (version):", info[0].toString());
  console.log("计数 (count):", info[1].toString());
  console.log("名称 (name):", info[2]);
  console.log("最后更新时间 (lastUpdated):", new Date(Number(info[3]) * 1000).toLocaleString());

  // 执行一些操作来设置初始数据
  console.log("\n--- 执行初始操作 ---");
  const tx1 = await counter.increment(100);
  await tx1.wait();
  console.log("增加 100: 交易 Hash", tx1.hash);

  const tx2 = await counter.increment(50);
  await tx2.wait();
  console.log("增加 50: 交易 Hash", tx2.hash);

  const updatedInfo = await counter.getInfo();
  console.log("\n更新后的计数 (count):", updatedInfo[1].toString());

  // 保存部署信息到文件
  const deployData = {
    network: "polkadotTestnet",
    rpc: "https://services.polkadothub-rpc.com/testnet",
    deployer: deployer.address,
    deployTxHash: deployTxHash,
    proxyAddress: proxyAddress,
    implementationAddress: implementationAddress,
    deployedAt: new Date().toISOString(),
    initialStorage: {
      version: info[0].toString(),
      count: updatedInfo[1].toString(),
      name: info[2],
      lastUpdated: info[3].toString()
    }
  };

  const deployFilePath = join(__dirname, "..", "deployment.json");
  writeFileSync(deployFilePath, JSON.stringify(deployData, null, 2));
  console.log("\n部署信息已保存到:", deployFilePath);

  console.log("\n=== 部署完成 ===\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
