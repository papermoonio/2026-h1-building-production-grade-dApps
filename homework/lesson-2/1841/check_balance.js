// 引入 Polkadot 官方工具
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/api');
const { waitReady } = require('@polkadot/wasm-crypto');

async function main() {
    // 1. 连接到你本地的私链节点
    // 默认本地节点端口是 9944，如果你的不一样请修改这里
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });
    
    // 等待加密库加载完成
    await waitReady();

    console.log("------------------------------------------------");
    console.log("✅ 成功连接到本地节点！");

    // 2. 创建账户管理环 (Keyring)
    // type: 'sr25519' 是 Polkadot 默认的加密类型
    const keyring = new Keyring({ type: 'sr25519' });

    // 3. 使用开发环境默认账号 "Alice"
    // Alice 是私链自带的超级管理员，默认有很多钱
    const alice = keyring.addFromUri('//Alice');

    // --- 这里的魔法是：同一个公钥，生成不同格式的地址 ---
    
    // 格式 A：Substrate 通用格式 (前缀 42)
    const addressSubstrate = keyring.encodeAddress(alice.publicKey, 42);
    
    // 格式 B：Polkadot 主网格式 (前缀 0)
    const addressPolkadot = keyring.encodeAddress(alice.publicKey, 0);

    console.log("\n--- 地址转换演示 ---");
    console.log(`原始公钥 (Hex):   ${alice.addressRaw}`); // 这是一个十六进制字符串，是账户的真身
    console.log(`格式 42 (通用):   ${addressSubstrate}`);
    console.log(`格式 0 (波卡):    ${addressPolkadot}`);
    console.log("注意：这上面两个地址看起来完全不同，但其实是同一个人！");

    // 4. 查询余额
    // 我们分别用这两个看起来不一样的地址去查余额
    console.log("\n--- 开始查询余额 ---");

    // 查询通用格式地址
    const { data: balance1 } = await api.query.system.account(addressSubstrate);
    console.log(`地址 [通用格式] 的余额: ${balance1.free.toHuman()}`);

    // 查询波卡格式地址
    const { data: balance2 } = await api.query.system.account(addressPolkadot);
    console.log(`地址 [波卡格式] 的余额: ${balance2.free.toHuman()}`);

    // 5. 自动验证
    if (balance1.free.toString() === balance2.free.toString()) {
        console.log("\n🎉 测试成功！两个不同格式的地址，余额完全一致！");
    } else {
        console.log("\n❌ 测试失败，余额不一致（请检查节点连接）。");
    }

    console.log("------------------------------------------------");
    process.exit(0);
}

main().catch(console.error);
