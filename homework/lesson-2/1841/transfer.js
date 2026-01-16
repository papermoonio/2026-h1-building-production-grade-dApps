// transfer.js
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

async function main() {
    // 1. 连接节点
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });
    console.log("✅ 节点连接成功！");

    // 2. 准备账户
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice'); // 发款人
    const bob = keyring.addFromUri('//Bob');     // 收款人

    // 3. 构造交易：Alice 向 Bob 转账 1234567890000 (约 1.2 DOT)
    // 注意：Polkadot 中金额通常带10-12个零
    const amount = 1234567890000;
    console.log(`\n💸 正在发起交易：Alice -> Bob 转账...`);

    // 4. 发送并监听（这是最关键的一步）
    // signAndSend 会对交易进行签名并广播出去
    const unsub = await api.tx.balances
        .transferAllowDeath(bob.address, amount) 
        .signAndSend(alice, ({ status, events = [], dispatchError }) => {
            
            // 监听交易状态变化
            if (status.isInBlock) {
                console.log(`🧱 交易已打包进区块，区块Hash: ${status.asInBlock}`);
            } else if (status.isFinalized) {
                console.log(`🎉 交易已确认（不可逆转），区块Hash: ${status.asFinalized}`);
                
                // 打印这次交易产生的所有事件（比如手续费扣除、余额变动）
                events.forEach(({ phase, event: { data, method, section } }) => {
                    console.log(`\t📋 事件: ${section}.${method}:: ${data}`);
                });

                console.log("\n✅ 演示结束，程序退出。");
                unsub(); // 取消监听
                process.exit(0);
            }
        });
}

main().catch(console.error);
