/**
 * Precompile调用示例
 * 
 * Moonbeam提供了多个预编译合约，这里演示调用Batch Precompile
 * Batch Precompile地址: 0x0000000000000000000000000000000000000808
 * 
 * 其他常用Precompile:
 * - 0x0000000000000000000000000000000000000800: Parachain Staking
 * - 0x0000000000000000000000000000000000000801: Crowdloan Rewards
 * - 0x0000000000000000000000000000000000000802: ERC-20 Interface (native token)
 * - 0x0000000000000000000000000000000000000803: Democracy
 * - 0x0000000000000000000000000000000000000804: X-Tokens
 * - 0x0000000000000000000000000000000000000805: Relay Encoder
 * - 0x0000000000000000000000000000000000000808: Batch
 */

import { ethers } from 'ethers';

// Moonbase Alpha配置
const MOONBASE_CONFIG = {
    httpEndpoint: 'https://rpc.api.moonbase.moonbeam.network',
    chainId: 1287
};

// Batch Precompile ABI
const BATCH_PRECOMPILE_ABI = [
    // batchSome - 批量调用，部分失败不影响其他
    'function batchSome(address[] to, uint256[] value, bytes[] callData, uint64[] gasLimit)',
    // batchSomeUntilFailure - 批量调用，遇到失败停止
    'function batchSomeUntilFailure(address[] to, uint256[] value, bytes[] callData, uint64[] gasLimit)',
    // batchAll - 批量调用，任一失败则全部回滚
    'function batchAll(address[] to, uint256[] value, bytes[] callData, uint64[] gasLimit)'
];

// ERC-20 Interface Precompile ABI (用于原生代币)
const NATIVE_ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 value) returns (bool)',
    'function approve(address spender, uint256 value) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Precompile地址
const PRECOMPILE_ADDRESSES = {
    BATCH: '0x0000000000000000000000000000000000000808',
    NATIVE_ERC20: '0x0000000000000000000000000000000000000802',
    STAKING: '0x0000000000000000000000000000000000000800',
    CALL_PERMIT: '0x000000000000000000000000000000000000080a'
};

/**
 * 调用Native ERC-20 Precompile获取代币信息
 */
export async function callNativeErc20Precompile(providerUrl = MOONBASE_CONFIG.httpEndpoint) {
    console.log('='.repeat(60));
    console.log('调用 Native ERC-20 Precompile (0x802)');
    console.log('='.repeat(60));
    
    const provider = new ethers.JsonRpcProvider(providerUrl);
    
    // 创建合约实例
    const nativeErc20 = new ethers.Contract(
        PRECOMPILE_ADDRESSES.NATIVE_ERC20,
        NATIVE_ERC20_ABI,
        provider
    );
    
    try {
        // 调用view函数
        const [name, symbol, decimals, totalSupply] = await Promise.all([
            nativeErc20.name(),
            nativeErc20.symbol(),
            nativeErc20.decimals(),
            nativeErc20.totalSupply()
        ]);
        
        console.log(`\n代币信息 (通过Precompile获取):`);
        console.log(`  名称:     ${name}`);
        console.log(`  符号:     ${symbol}`);
        console.log(`  精度:     ${decimals}`);
        console.log(`  总供应:   ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
        
        // 查询特定地址的余额
        const testAddress = '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0';
        const balance = await nativeErc20.balanceOf(testAddress);
        
        console.log(`\n地址余额查询:`);
        console.log(`  地址:     ${testAddress}`);
        console.log(`  余额:     ${ethers.formatUnits(balance, decimals)} ${symbol}`);
        
        return { name, symbol, decimals, totalSupply, testBalance: balance };
    } catch (error) {
        console.error(`调用失败: ${error.message}`);
        throw error;
    }
}

/**
 * 演示如何编码Batch Precompile调用
 * 注意：实际执行需要签名交易
 */
export async function demonstrateBatchPrecompile() {
    console.log('\n' + '='.repeat(60));
    console.log('演示 Batch Precompile 调用编码 (0x808)');
    console.log('='.repeat(60));
    
    const provider = new ethers.JsonRpcProvider(MOONBASE_CONFIG.httpEndpoint);
    
    // 创建Batch合约接口
    const batchInterface = new ethers.Interface(BATCH_PRECOMPILE_ABI);
    
    // 示例：批量转账的参数
    const recipients = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222'
    ];
    const values = [
        ethers.parseEther('0.001'),
        ethers.parseEther('0.002')
    ];
    const callDatas = ['0x', '0x']; // 空数据表示简单转账
    const gasLimits = [21000n, 21000n];
    
    // 编码调用数据
    const encodedData = batchInterface.encodeFunctionData('batchAll', [
        recipients,
        values,
        callDatas,
        gasLimits
    ]);
    
    console.log(`\n批量转账调用编码:`);
    console.log(`  目标地址:   ${recipients.join(', ')}`);
    console.log(`  转账金额:   ${values.map(v => ethers.formatEther(v) + ' DEV').join(', ')}`);
    console.log(`  Precompile: ${PRECOMPILE_ADDRESSES.BATCH}`);
    console.log(`  编码数据:   ${encodedData.slice(0, 66)}...`);
    
    // 估算Gas
    try {
        const gasEstimate = await provider.estimateGas({
            to: PRECOMPILE_ADDRESSES.BATCH,
            data: encodedData,
            value: ethers.parseEther('0.003') // 总转账金额
        });
        console.log(`  预估Gas:    ${gasEstimate.toString()}`);
    } catch (error) {
        console.log(`  预估Gas:    需要有效账户签名`);
    }
    
    console.log('\n提示: 实际执行批量交易需要使用私钥签名');
}

/**
 * 使用Precompile查询余额并与直接RPC查询对比
 */
export async function compareBalanceQueries(address) {
    console.log('\n' + '='.repeat(60));
    console.log('Precompile余额查询 vs 直接RPC查询');
    console.log('='.repeat(60));
    
    const provider = new ethers.JsonRpcProvider(MOONBASE_CONFIG.httpEndpoint);
    
    // 创建Native ERC-20合约实例
    const nativeErc20 = new ethers.Contract(
        PRECOMPILE_ADDRESSES.NATIVE_ERC20,
        NATIVE_ERC20_ABI,
        provider
    );
    
    try {
        // 并行查询
        const [precompileBalance, rpcBalance] = await Promise.all([
            nativeErc20.balanceOf(address),
            provider.getBalance(address)
        ]);
        
        console.log(`\n查询地址: ${address}`);
        console.log(`\n结果对比:`);
        console.log(`  Precompile (ERC-20):  ${ethers.formatEther(precompileBalance)} DEV`);
        console.log(`  直接RPC (eth_getBalance): ${ethers.formatEther(rpcBalance)} DEV`);
        
        const isEqual = precompileBalance === rpcBalance;
        console.log(`  结果一致:             ${isEqual ? '✅ 是' : '❌ 否'}`);
        
        return {
            address,
            precompileBalance,
            rpcBalance,
            isEqual
        };
    } catch (error) {
        console.error(`查询失败: ${error.message}`);
        throw error;
    }
}

// 主演示函数
export async function demonstratePrecompiles() {
    try {
        // 1. 调用Native ERC-20 Precompile
        await callNativeErc20Precompile();
        
        // 2. 演示Batch Precompile编码
        await demonstrateBatchPrecompile();
        
        // 3. 比较余额查询方式
        const testAddress = '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0';
        await compareBalanceQueries(testAddress);
        
    } catch (error) {
        console.error('\n执行出错:', error.message);
        console.log('\n提示: 请确保网络连接正常');
    }
    
    console.log('\n' + '='.repeat(60));
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('precompileCall')) {
    demonstratePrecompiles().catch(console.error);
}
