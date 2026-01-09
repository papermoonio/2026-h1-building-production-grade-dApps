import {
  getBalanceEvm,
  getBalanceSubstrate,
  verifyBalanceConsistency,
  batchVerifyBalances,
  closeConnections
} from '../src/balance-checker.js';
import { evmToSubstrateAddress, substrateToEvmAddress } from '../src/address-converter.js';

const TEST_ADDRESSES = {
  evm: '0x9621dde636de098b43efb0fa9b61facfe328f99d',
  substrate: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
};

function printTestResult(testName, passed, message) {
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} ${testName}: ${message}`);
  return passed;
}

function printSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

async function runBalanceTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  余额一致性验证测试 (Balance Verification Tests)');
  console.log('  使用 polkadot-api + ethers');
  console.log('='.repeat(60));
  
  const results = [];
  
  printSection('EVM 余额查询');
  try {
    const evmBalance = await getBalanceEvm(TEST_ADDRESSES.evm);
    const hasBalance = BigInt(evmBalance.balance) >= 0n;
    results.push(printTestResult('EVM Balance Query', hasBalance, 
      `余额: ${evmBalance.balanceFormatted} ${evmBalance.unit}`));
  } catch (error) {
    results.push(printTestResult('EVM Balance Query', false, `错误: ${error.message}`));
  }
  
  printSection('Substrate 余额查询');
  try {
    const substrateBalance = await getBalanceSubstrate(TEST_ADDRESSES.substrate);
    const hasBalance = BigInt(substrateBalance.balance) >= 0n;
    results.push(printTestResult('Substrate Balance Query', hasBalance,
      `余额: ${substrateBalance.balanceFormatted} ${substrateBalance.unit}`));
  } catch (error) {
    results.push(printTestResult('Substrate Balance Query', false, `错误: ${error.message}`));
  }
  
  printSection('余额一致性验证');
  try {
    const verification = await verifyBalanceConsistency(TEST_ADDRESSES.evm);
    console.log(`\n  📊 验证结果:`);
    console.log(`     地址: ${verification.address}`);
    console.log(`     EVM 余额:      ${verification.evmBalance.balanceFormatted} ${verification.evmBalance.unit}`);
    console.log(`     Substrate 余额: ${verification.substrateBalance.balanceFormatted} ${verification.substrateBalance.unit}`);
    console.log(`     一致性:        ${verification.isEqual ? '✅ 一致' : '❌ 不一致'}`);
    
    if (!verification.isEqual) {
      console.log(`     差异:         ${verification.difference} wei`);
    }
    
    results.push(printTestResult('Balance Consistency', verification.isEqual,
      verification.isEqual ? '两个系统的余额完全一致' : `存在差异: ${verification.difference}`));
  } catch (error) {
    results.push(printTestResult('Balance Consistency', false, `错误: ${error.message}`));
  }
  
  printSection('批量余额验证');
  try {
    const testAddresses = [
      TEST_ADDRESSES.evm,
      substrateToEvmAddress(TEST_ADDRESSES.substrate),
      '0x7f9cb368073f3aeda4f3cb826310c437d9fbae22'
    ];
    
    const batchResults = await batchVerifyBalances(testAddresses);
    
    console.log(`\n  📊 批量查询结果:`);
    let successCount = 0;
    
    for (const result of batchResults) {
      if (result.success) {
        console.log(`  ✅ ${result.address}`);
        console.log(`     EVM:      ${result.evmBalance.balanceFormatted}`);
        console.log(`     Substrate: ${result.substrateBalance.balanceFormatted}`);
        console.log(`     一致:      ${result.isEqual ? '是' : '否'}`);
        if (result.isEqual) successCount++;
      } else {
        console.log(`  ❌ ${result.address}`);
        console.log(`     错误: ${result.error}`);
      }
    }
    
    const allSuccessful = batchResults.every(r => r.success);
    const allConsistent = batchResults.filter(r => r.success).every(r => r.isEqual);
    results.push(printTestResult('Batch Verification', allSuccessful && allConsistent,
      `${successCount}/${testAddresses.length} 个地址余额一致`));
  } catch (error) {
    results.push(printTestResult('Batch Verification', false, `错误: ${error.message}`));
  }
  
  printSection('测试结果汇总');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\n  总测试: ${total}, 通过: ${passed}, 失败: ${total - passed}`);
  console.log(`  通过率: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  await closeConnections();
  
  return passed === total;
}

runBalanceTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(async error => {
    console.error('测试执行失败:', error);
    await closeConnections();
    process.exit(1);
  });
