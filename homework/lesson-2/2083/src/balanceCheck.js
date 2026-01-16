/**
 * Balance查询模块
 * 通过Substrate RPC和EVM RPC分别查询同一账户的余额，验证一致性
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';
import { evmToSubstrate, substrateToEvm } from './addressConverter.js';

// Moonbase Alpha测试网配置
const MOONBASE_CONFIG = {
    name: 'Moonbase Alpha',
    wsEndpoint: 'wss://wss.api.moonbase.moonbeam.network',
    httpEndpoint: 'https://rpc.api.moonbase.moonbeam.network',
    ss58Format: 1287,
    decimals: 18,
    symbol: 'DEV'
};

/**
 * 通过Substrate API查询余额
 * @param {string} ss58Address - SS58格式地址
 * @param {string} wsEndpoint - WebSocket端点
 * @returns {Promise<{free: bigint, reserved: bigint, total: bigint}>}
 */
export async function getSubstrateBalance(ss58Address, wsEndpoint = MOONBASE_CONFIG.wsEndpoint) {
    const provider = new WsProvider(wsEndpoint);
    const api = await ApiPromise.create({ provider });
    
    try {
        // 查询账户信息
        const accountInfo = await api.query.system.account(ss58Address);
        
        const free = BigInt(accountInfo.data.free.toString());
        const reserved = BigInt(accountInfo.data.reserved.toString());
        
        return {
            free,
            reserved,
            total: free + reserved,
            formatted: {
                free: ethers.formatEther(free),
                reserved: ethers.formatEther(reserved),
                total: ethers.formatEther(free + reserved)
            }
        };
    } finally {
        await api.disconnect();
    }
}

/**
 * 通过EVM RPC查询余额
 * @param {string} evmAddress - EVM H160地址
 * @param {string} httpEndpoint - HTTP RPC端点
 * @returns {Promise<{balance: bigint, formatted: string}>}
 */
export async function getEvmBalance(evmAddress, httpEndpoint = MOONBASE_CONFIG.httpEndpoint) {
    const provider = new ethers.JsonRpcProvider(httpEndpoint);
    
    const balance = await provider.getBalance(evmAddress);
    
    return {
        balance: BigInt(balance.toString()),
        formatted: ethers.formatEther(balance)
    };
}

/**
 * 比较同一账户的Substrate余额和EVM余额
 * @param {string} evmAddress - EVM地址
 */
export async function compareBalances(evmAddress) {
    console.log('='.repeat(60));
    console.log('Balance一致性检查');
    console.log('='.repeat(60));
    
    // 转换地址
    const ss58Address = evmToSubstrate(evmAddress, MOONBASE_CONFIG.ss58Format);
    
    console.log(`\n账户信息:`);
    console.log(`  EVM地址:       ${evmAddress}`);
    console.log(`  SS58地址:      ${ss58Address}`);
    console.log(`  网络:          ${MOONBASE_CONFIG.name}`);
    
    try {
        // 并行查询两种余额
        console.log(`\n正在查询余额...`);
        
        const [substrateResult, evmResult] = await Promise.all([
            getSubstrateBalance(ss58Address),
            getEvmBalance(evmAddress)
        ]);
        
        console.log(`\n余额查询结果:`);
        console.log(`  Substrate余额 (free):     ${substrateResult.formatted.free} ${MOONBASE_CONFIG.symbol}`);
        console.log(`  Substrate余额 (reserved): ${substrateResult.formatted.reserved} ${MOONBASE_CONFIG.symbol}`);
        console.log(`  EVM余额:                  ${evmResult.formatted} ${MOONBASE_CONFIG.symbol}`);
        
        // 比较余额
        // 注意：EVM余额应该等于Substrate的free余额
        const isConsistent = substrateResult.free === evmResult.balance;
        
        console.log(`\n一致性检查:`);
        console.log(`  Substrate free余额 (wei): ${substrateResult.free}`);
        console.log(`  EVM余额 (wei):            ${evmResult.balance}`);
        console.log(`  是否一致:                 ${isConsistent ? '✅ 是' : '❌ 否'}`);
        
        if (!isConsistent) {
            const diff = substrateResult.free > evmResult.balance 
                ? substrateResult.free - evmResult.balance 
                : evmResult.balance - substrateResult.free;
            console.log(`  差异:                     ${ethers.formatEther(diff)} ${MOONBASE_CONFIG.symbol}`);
        }
        
        return {
            evmAddress,
            ss58Address,
            substrateBalance: substrateResult,
            evmBalance: evmResult,
            isConsistent
        };
    } catch (error) {
        console.error(`\n查询失败: ${error.message}`);
        throw error;
    }
}

// 示例运行
export async function demonstrateBalanceCheck() {
    // 使用一个Moonbase Alpha上的测试地址
    // 这是一个已知有余额的测试地址
    const testAddress = '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0';
    
    try {
        await compareBalances(testAddress);
    } catch (error) {
        console.log('\n提示: 如果查询失败，请确保网络连接正常');
        console.log('或者使用您自己在Moonbase Alpha上有余额的地址');
    }
    
    console.log('\n' + '='.repeat(60));
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('balanceCheck')) {
    demonstrateBalanceCheck().catch(console.error);
}
