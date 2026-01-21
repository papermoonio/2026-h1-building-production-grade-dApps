import { ethers, upgrades } from "hardhat";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface DeploymentData {
  proxyAddress: string;
  implementationAddress: string;
  deployTxHash: string;
  deployer: string;
}

async function main() {
  console.log("\n=== 开始升级 UUPS 合约到 V2 ===\n");

  // 读取部署信息
  const deployFilePath = join(__dirname, "..", "deployment.json");
  let deploymentData: DeploymentData;

  try {
    const fileContent = readFileSync(deployFilePath, "utf-8");
    deploymentData = JSON.parse(fileContent);
  } catch (error) {
    console.error("无法读取 deployment.json，请先运行部署脚本");
    process.exit(1);
  }

  const [upgrader] = await ethers.getSigners();
  console.log("升级账户:", upgrader.address);
  console.log("当前代理合约地址:", deploymentData.proxyAddress);
  console.log("当前实现合约地址:", deploymentData.implementationAddress);

  // 升级前状态
  console.log("\n--- 升级前的状态 ---");
  const CounterV1 = await ethers.getContractFactory("UpgradeableCounterV1");
  const counterBefore = CounterV1.attach(deploymentData.proxyAddress);
  const infoBefore = await counterBefore.getInfo();
  console.log("版本号 (version):", infoBefore[0].toString());
  console.log("计数 (count):", infoBefore[1].toString());
  console.log("名称 (name):", infoBefore[2]);
  console.log("最后更新时间 (lastUpdated):", new Date(Number(infoBefore[3]) * 1000).toLocaleString());

  // 执行升级
  console.log("\n正在升级到 V2...");

  // 首先需要注册已部署的代理（如果本地 manifest 被清除）
  try {
    await upgrades.forceImport(
      deploymentData.proxyAddress,
      CounterV1,
      { kind: "uups" }
    );
    console.log("已注册现有代理合约");
  } catch (e: any) {
    console.log("代理已注册或注册失败，继续升级");
  }

  const CounterV2 = await ethers.getContractFactory("UpgradeableCounterV2");

  // upgrades.upgradeProxy 返回升级后的合约实例
  await upgrades.upgradeProxy(
    deploymentData.proxyAddress,
    CounterV2
  );

  console.log("✅ 升级成功!");

  // 获取新的实现合约地址
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(
    deploymentData.proxyAddress
  );
  console.log("新的实现合约地址:", newImplementationAddress);

  // 升级交易 Hash (可以通过区块浏览器查询)
  const upgradeTxHash = "查看区块浏览器获取升级交易";

  // 升级后状态验证
  console.log("\n--- 升级后的状态 ---");
  const counterV2 = CounterV2.attach(deploymentData.proxyAddress);

  // 调用迁移函数更新版本号
  console.log("\n调用 migrateToV2 更新版本号...");
  const migrateTx = await counterV2.migrateToV2();
  await migrateTx.wait();
  console.log("迁移交易 Hash:", migrateTx.hash);

  const infoAfter = await counterV2.getInfo();
  console.log("版本号 (version):", infoAfter[0].toString(), "← 已变化!");
  console.log("计数 (count):", infoAfter[1].toString(), "← 保持不变");
  console.log("名称 (name):", infoAfter[2], "← 保持不变");
  console.log("最后更新时间 (lastUpdated):", new Date(Number(infoAfter[3]) * 1000).toLocaleString(), "← 保持不变");
  console.log("更新次数 (updateCount):", infoAfter[4].toString(), "← V2 新增字段");
  console.log("最大计数限制 (maxCount):", infoAfter[5].toString(), "← V2 新增字段");

  // 获取扩展信息
  console.log("\n--- V2 扩展信息 ---");
  const extInfo = await counterV2.getExtendedInfo();
  console.log("合约所有者 (owner):", extInfo[6]);

  // 测试 V2 新功能
  console.log("\n--- 测试 V2 新功能 ---");

  // 测试重置计数器
  console.log("执行重置计数器...");
  const resetTx = await counterV2.resetCounter();
  await resetTx.wait();
  console.log("重置交易 Hash:", resetTx.hash);

  const afterReset = await counterV2.getInfo();
  console.log("重置后计数 (count):", afterReset[1].toString());
  console.log("重置后更新次数 (updateCount):", afterReset[4].toString());

  // 测试设置计数器值
  console.log("\n先设置最大计数限制...");
  const maxTx = await counterV2.setMaxCount(10000);
  await maxTx.wait();
  console.log("设置最大限制交易 Hash:", maxTx.hash);

  console.log("\n执行设置计数器值为 888...");
  const setTx = await counterV2.setCount(888);
  await setTx.wait();
  console.log("设置交易 Hash:", setTx.hash);

  const afterSet = await counterV2.getInfo();
  console.log("设置后计数 (count):", afterSet[1].toString());
  console.log("设置后更新次数 (updateCount):", afterSet[4].toString());

  // 测试增加计数器
  console.log("\n执行增加计数器 111...");
  const incTx = await counterV2.increment(111);
  await incTx.wait();
  console.log("增加交易 Hash:", incTx.hash);

  const finalInfo = await counterV2.getInfo();
  console.log("最终计数 (count):", finalInfo[1].toString());
  console.log("最终更新次数 (updateCount):", finalInfo[4].toString());

  // 保存升级信息
  const upgradeData = {
    ...deploymentData,
    upgradeTxHash: upgradeTxHash,
    oldImplementationAddress: deploymentData.implementationAddress,
    newImplementationAddress: newImplementationAddress,
    upgradedAt: new Date().toISOString(),
    storageComparison: {
      before: {
        version: infoBefore[0].toString(),
        count: infoBefore[1].toString(),
        name: infoBefore[2],
        lastUpdated: infoBefore[3].toString()
      },
      after: {
        version: finalInfo[0].toString(),
        count: finalInfo[1].toString(),
        name: finalInfo[2],
        lastUpdated: finalInfo[3].toString(),
        updateCount: finalInfo[4].toString(),
        maxCount: finalInfo[5].toString()
      }
    },
    newFields: {
      updateCount: finalInfo[4].toString(),
      maxCount: finalInfo[5].toString()
    }
  };

  writeFileSync(deployFilePath, JSON.stringify(upgradeData, null, 2));
  console.log("\n升级信息已更新到:", deployFilePath);

  console.log("\n=== 升级完成 ===\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
