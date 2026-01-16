/**
 * 综合测试脚本
 * 测试地址转换和余额一致性
 */

import { 
    evmToSubstrate, 
    substrateToEvm, 
    computeSubstrateAccountFromH160,
    demonstrateConversion 
} from './addressConverter.js';
import { compareBalances } from './balanceCheck.js';
import { callNativeErc20Precompile, compareBalanceQueries } from './precompileCall.js';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

// 测试用例
const TEST_CASES = {
    // 常见的测试EVM地址
    evmAddresses: [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat默认账户1
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat默认账户2
        '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0', // Moonbase测试账户
        '0x0000000000000000000000000000000000000000', // 零地址
    ],
    // 常见的SS58地址（Polkadot格式）
    ss58Addresses: [
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Alice
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', // Bob
        '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', // Charlie
    ]
};

/**
 * 测试地址转换功能
 */
function testAddressConversion() {
    console.log('\n' + '='.repeat(70));
    console.log('测试1: 地址转换功能');
    console.log('='.repeat(70));
    
    let passed = 0;
    let failed = 0;
    
    // 测试 EVM -> Substrate 转换
    console.log('\n[EVM -> Substrate SS58 转换]');
    TEST_CASES.evmAddresses.forEach((evmAddr, i) => {
        try {
            const moonbeamSS58 = evmToSubstrate(evmAddr, 1284);
            const moonbaseSS58 = evmToSubstrate(evmAddr, 1287);
            
            console.log(`\n  ${i + 1}. EVM: ${evmAddr}`);
            console.log(`     -> Moonbeam:     ${moonbeamSS58}`);
            console.log(`     -> Moonbase:     ${moonbaseSS58}`);
            
            // 验证转换后的地址可以被解码
            const decoded = decodeAddress(moonbeamSS58);
            if (decoded.length === 32) {
                console.log(`     ✅ 验证通过`);
                passed++;
            } else {
                console.log(`     ❌ 验证失败: 公钥长度不正确`);
                failed++;
            }
        } catch (error) {
            console.log(`     ❌ 错误: ${error.message}`);
            failed++;
        }
    });
    
    // 测试 Substrate -> EVM 转换
    console.log('\n[Substrate SS58 -> EVM 转换]');
    TEST_CASES.ss58Addresses.forEach((ss58Addr, i) => {
        try {
            const evmAddr = substrateToEvm(ss58Addr);
            
            console.log(`\n  ${i + 1}. SS58: ${ss58Addr}`);
            console.log(`     -> EVM:  ${evmAddr}`);
            
            // 验证EVM地址格式
            if (evmAddr.startsWith('0x') && evmAddr.length === 42) {
                console.log(`     ✅ 验证通过`);
                passed++;
            } else {
                console.log(`     ❌ 验证失败: EVM地址格式不正确`);
                failed++;
            }
        } catch (error) {
            console.log(`     ❌ 错误: ${error.message}`);
            failed++;
        }
    });
    
    // 测试转换一致性
    console.log('\n[转换一致性测试]');
    const testEvmAddr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const ss58Addr = evmToSubstrate(testEvmAddr, 1287);
    const accountId = computeSubstrateAccountFromH160(testEvmAddr);
    const ss58FromAccountId = encodeAddress(accountId, 1287);
    
    console.log(`  原始EVM地址:           ${testEvmAddr}`);
    console.log(`  evmToSubstrate结果:    ${ss58Addr}`);
    console.log(`  compute + encode结果:  ${ss58FromAccountId}`);
    
    if (ss58Addr === ss58FromAccountId) {
        console.log(`  ✅ 两种方法结果一致`);
        passed++;
    } else {
        console.log(`  ❌ 两种方法结果不一致`);
        failed++;
    }
    
    console.log(`\n[地址转换测试结果] 通过: ${passed}, 失败: ${failed}`);
    return { passed, failed };
}

/**
 * 测试余额一致性（需要网络连接）
 */
async function testBalanceConsistency() {
    console.log('\n' + '='.repeat(70));
    console.log('测试2: 余额一致性检查 (需要网络连接)');
    console.log('='.repeat(70));
    
    const testAddress = '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0';
    
    try {
        // 使用Precompile和直接RPC对比余额
        const result = await compareBalanceQueries(testAddress);
        
        if (result.isEqual) {
            console.log('\n✅ 余额一致性测试通过');
            return { passed: 1, failed: 0 };
        } else {
            console.log('\n❌ 余额一致性测试失败');
            return { passed: 0, failed: 1 };
        }
    } catch (error) {
        console.log(`\n⚠️ 网络测试跳过: ${error.message}`);
        return { passed: 0, failed: 0, skipped: 1 };
    }
}

/**
 * 测试Precompile调用
 */
async function testPrecompileCall() {
    console.log('\n' + '='.repeat(70));
    console.log('测试3: Precompile调用 (需要网络连接)');
    console.log('='.repeat(70));
    
    try {
        const result = await callNativeErc20Precompile();
        
        if (result.name && result.symbol && result.decimals !== undefined) {
            console.log('\n✅ Precompile调用测试通过');
            return { passed: 1, failed: 0 };
        } else {
            console.log('\n❌ Precompile调用测试失败');
            return { passed: 0, failed: 1 };
        }
    } catch (error) {
        console.log(`\n⚠️ 网络测试跳过: ${error.message}`);
        return { passed: 0, failed: 0, skipped: 1 };
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('\n');
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║' + '         Moonbeam 地址转换与余额一致性测试套件              '.padEnd(68) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');
    
    const results = {
        passed: 0,
        failed: 0,
        skipped: 0
    };
    
    // 1. 地址转换测试（离线）
    const conversionResult = testAddressConversion();
    results.passed += conversionResult.passed;
    results.failed += conversionResult.failed;
    
    // 2. 余额一致性测试（需要网络）
    console.log('\n正在进行网络测试...');
    const balanceResult = await testBalanceConsistency();
    results.passed += balanceResult.passed;
    results.failed += balanceResult.failed;
    results.skipped += balanceResult.skipped || 0;
    
    // 3. Precompile调用测试（需要网络）
    const precompileResult = await testPrecompileCall();
    results.passed += precompileResult.passed;
    results.failed += precompileResult.failed;
    results.skipped += precompileResult.skipped || 0;
    
    // 总结
    console.log('\n' + '='.repeat(70));
    console.log('测试总结');
    console.log('='.repeat(70));
    console.log(`  ✅ 通过: ${results.passed}`);
    console.log(`  ❌ 失败: ${results.failed}`);
    console.log(`  ⏭️  跳过: ${results.skipped}`);
    console.log('='.repeat(70));
    
    if (results.failed === 0) {
        console.log('\n🎉 所有测试通过!');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查错误信息');
    }
    
    return results;
}

// 运行测试
runAllTests().catch(console.error);
