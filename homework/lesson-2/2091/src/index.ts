/**
 * Lesson 2 作业主程序
 * 演示 Substrate 和 EVM 地址转换，以及余额查询的一致性验证
 */

import { ethers } from "ethers";
import { getWsProvider } from 'polkadot-api/ws-provider';
import { createClient } from 'polkadot-api';
import { devnet } from '@polkadot-api/descriptors';
import { accountId32ToH160, convertPublicKeyToSs58, getAlice, getRandomSubstrateKeypair, h160ToAccountId32 } from './accounts';
import { getApi, getProvider, setBalance } from './utils';
//import { createERC20Asset, getERC20Balance } from './erc20';

/**
 * 测试1：查询 Alice 账户余额并验证地址转换
 * 
 * 流程：
 * 1. 获取 Alice 的 Substrate 密钥对
 * 2. 将公钥转换为 SS58 地址
 * 3. 通过 Substrate API 查询余额
 * 4. 将 AccountId32 转换为 H160 地址
 * 5. 通过 EVM RPC 查询余额
 * 6. 验证两种方式查询的余额是否一致
 */
async function getBalance_alice() {
    console.log("\n=== 测试 Alice 账户 ===");
    
    const api = getApi(false);
    const provider = getProvider(false);
    
    // 获取 Alice 的密钥对
    const alice = getAlice();
    
    // 转换为 SS58 地址并查询 Substrate 余额
    const aliceSs58 = convertPublicKeyToSs58(alice.publicKey);
    console.log(`Alice SS58 address: ${aliceSs58}`);
    const balance = await api.query.System.Account.getValue(aliceSs58);
    console.log(`Substrate balance: ${balance.data.free}`);

    // 转换为 H160 地址并查询 EVM 余额
    const address = accountId32ToH160(alice.publicKey);
    console.log(`Alice H160 address: ${address}`);
    const eth = await provider.getBalance(address);
    console.log(`EVM balance: ${ethers.formatEther(eth)} ETH`);
    
    console.log(`余额一致性: ${balance.data.free.toString() === eth.toString() ? '✅ 一致' : '❌ 不一致'}`);
}

/**
 * 测试2：从 EVM 私钥生成地址并验证转换
 * 
 * 流程：
 * 1. 使用已知的 EVM 私钥创建钱包
 * 2. 通过 EVM RPC 查询 H160 地址的余额
 * 3. 将 H160 地址转换为 AccountId32
 * 4. 将 AccountId32 转换为 SS58 地址
 * 5. 通过 Substrate API 查询余额
 * 6. 验证反向转换后的余额是否一致
 */
async function getBalance_alithe() {
    console.log("\n=== 测试 EVM 钱包账户 ===");
    
    const api = getApi(true);
    const provider = getProvider(true);
    
    // 使用 Alith 账户的私钥（开发链预定义的 EVM 账户）
    const privateKey = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // 查询 EVM 余额
    const eth = await provider.getBalance(wallet.address);
    console.log(`EVM address: ${wallet.address}`);
    console.log(`EVM balance: ${ethers.formatEther(eth)} ETH`);

    // 转换为 SS58 地址并查询 Substrate 余额
    const publicKey = h160ToAccountId32(wallet.address);
    const ss58Address = convertPublicKeyToSs58(publicKey);
    console.log(`SS58 address: ${ss58Address}`);

    const balance = await api.query.System.Account.getValue(ss58Address);
    console.log(`Substrate balance: ${balance.data.free}`);
    
    console.log(`余额一致性: ${balance.data.free.toString() === eth.toString() ? '✅ 一致' : '❌ 不一致'}`);
}

/**
 * 测试3：生成随机账户并设置余额
 * 
 * 流程：
 * 1. 随机生成一个新的 Substrate 密钥对
 * 2. 转换为 SS58 地址并查询初始余额
 * 3. 使用 Sudo 权限设置账户余额（需要 Alice 的签名）
 * 4. 等待交易确认
 * 5. 查询设置后的余额
 * 6. 转换为 H160 地址并通过 EVM RPC 验证余额
 * 
 * 注意：此功能需要 setBalance 函数的实现，且仅在开发链中可用
 */
async function getBalance3() {
    console.log("\n=== 测试随机生成账户 ===");
    
    const api = getApi(true);
    const provider = getProvider(true);
    
    // 生成随机密钥对
    const keypair = getRandomSubstrateKeypair();
    const publicKey = keypair.publicKey;
    const ss58Address = convertPublicKeyToSs58(publicKey);
    console.log(`生成的 SS58 address: ${ss58Address}`);

    // 查询初始余额
    const balance = await api.query.System.Account.getValue(ss58Address);
    console.log(`初始 Substrate balance: ${balance.data.free}`);

    // 设置余额（需要 Sudo 权限）
    // 注意：此操作需要 setBalance 函数的完整实现
    await setBalance(ss58Address, BigInt(10 ** 14)); // 设置为 0.0001 ETH (10^14 / 10^18)
    
    // 等待区块确认
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 查询设置后的余额
    const balance2 = await api.query.System.Account.getValue(ss58Address);
    console.log(`设置后的 Substrate balance: ${balance2.data.free}`);

    // 转换为 H160 地址并验证
    const address = accountId32ToH160(publicKey);
    console.log(`对应的 H160 address: ${address}`);
    const eth = await provider.getBalance(address);
    console.log(`EVM balance: ${ethers.formatEther(eth)} ETH`);
}

/**
 * 主函数：执行所有测试
 * 可以注释/取消注释不同的测试函数来运行特定测试
 */
async function main() {
    try {
        // 测试1：Alice 账户（原生 Substrate 账户）
        await getBalance_alice();
        
        // 测试2：EVM 钱包账户
        await getBalance_alithe();
        
        // 测试3：随机生成的账户（需要 Sudo 权限）
        // await getBalance3();
        
        console.log("\n✅ 所有测试完成！");
    } catch (error) {
        console.error("\n❌ 测试过程中发生错误:", error);
    }
}

// 运行主函数
main();

// ============= 其他示例代码（已注释） =============

// 示例：直接查询指定地址的余额
// async function queryBalance() {
//     const provider = getProvider();
//     const address = "0x7072056494a815425895c743e50c37a1b232a00a"; // 替换为你的地址
//     const balance = await provider.getBalance(address);
//     console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);

//     // 设置余额示例
//     await setBalance(address, BigInt(10 ** 12));
//     const balance2 = await provider.getBalance(address);
//     console.log(`Balance of ${address}: ${ethers.formatEther(balance2)} ETH`);
// }

// 示例：创建和查询 ERC20 资产
// async function testERC20() {
//     const api = getApi(true);
//     const provider = getProvider(true);
//     await createERC20Asset(api);
//     const alice = getAlice();
//     const address = accountId32ToH160(alice.publicKey);
//     await getERC20Balance(provider, address);
// }