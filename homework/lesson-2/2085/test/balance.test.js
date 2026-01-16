import BalanceChecker from '../src/balance-checker.js';
import { printSeparator, printTestResult, printObject, createTestReport, printTestReport } from '../src/utils.js';

/**
 * 余额检查测试
 */
async function testBalanceCheck() {
  printSeparator('Balance Verification Tests');
  
  const results = [];
  const checker = new BalanceChecker();

  try {
    // 连接到节点
    console.log('\n🔌 Connecting to nodes...');
    await checker.connect();
    
    // 测试用例 1: 查询 EVM 余额
    console.log('\n📝 Test 1: Get EVM Balance');
    try {
      const testEvmAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
      const evmBalance = await checker.getEvmBalance(testEvmAddress);
      
      console.log(`   Address: ${testEvmAddress}`);
      console.log(`   Balance: ${evmBalance.toString()} wei`);
      console.log(`   Formatted: ${checker.formatSubstrateBalance(evmBalance)} ETH`);
      
      const passed = evmBalance >= 0n;
      printTestResult('Get EVM Balance', passed, `Successfully retrieved balance`);
      results.push({ name: 'Get EVM Balance', passed });
    } catch (error) {
      printTestResult('Get EVM Balance', false, error.message);
      results.push({ name: 'Get EVM Balance', passed: false });
    }

    // 测试用例 2: 查询 Substrate 余额
    console.log('\n📝 Test 2: Get Substrate Balance');
    try {
      // 使用 Alice 的地址
      const testSubstrateAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const substrateBalance = await checker.getSubstrateBalance(testSubstrateAddress);
      
      console.log(`   Address: ${testSubstrateAddress}`);
      console.log(`   Balance: ${substrateBalance.toString()} (smallest unit)`);
      console.log(`   Formatted: ${checker.formatSubstrateBalance(substrateBalance)} tokens`);
      
      const passed = substrateBalance >= 0n;
      printTestResult('Get Substrate Balance', passed, `Successfully retrieved balance`);
      results.push({ name: 'Get Substrate Balance', passed });
    } catch (error) {
      printTestResult('Get Substrate Balance', false, error.message);
      results.push({ name: 'Get Substrate Balance', passed: false });
    }

    // 测试用例 3: 比较同一账户在两个系统中的余额
    console.log('\n📝 Test 3: Compare Balances (EVM and Substrate)');
    try {
      const testAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
      const comparison = await checker.compareBalances(testAddress);
      
      console.log('\n   📊 Balance Comparison Result:');
      console.log(`   EVM Address:       ${comparison.evmAddress}`);
      console.log(`   Substrate Address: ${comparison.substrateAddress}`);
      console.log(`   EVM Balance:       ${comparison.evmBalanceFormatted} ETH`);
      console.log(`   Substrate Balance: ${comparison.substrateBalanceFormatted} tokens`);
      console.log(`   Balances Equal:    ${comparison.isEqual ? '✅ Yes' : '❌ No'}`);
      
      if (!comparison.isEqual) {
        console.log(`   Difference:        ${comparison.differenceFormatted} ETH`);
      }
      
      const passed = comparison.isEqual;
      printTestResult('Compare Balances', passed, 
        passed ? 'Balances match between EVM and Substrate' : 'Balances do not match');
      results.push({ name: 'Compare Balances', passed });
    } catch (error) {
      printTestResult('Compare Balances', false, error.message);
      results.push({ name: 'Compare Balances', passed: false });
    }

    // 测试用例 4: 从 Substrate 地址开始比较
    console.log('\n📝 Test 4: Compare Balances (Starting from Substrate Address)');
    try {
      const testSubstrateAddr = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const comparison = await checker.compareBalances(testSubstrateAddr);
      
      console.log('\n   📊 Balance Comparison Result:');
      console.log(`   Substrate Address: ${comparison.substrateAddress}`);
      console.log(`   EVM Address:       ${comparison.evmAddress}`);
      console.log(`   Substrate Balance: ${comparison.substrateBalanceFormatted} tokens`);
      console.log(`   EVM Balance:       ${comparison.evmBalanceFormatted} ETH`);
      console.log(`   Balances Equal:    ${comparison.isEqual ? '✅ Yes' : '❌ No'}`);
      
      const passed = comparison.isEqual;
      printTestResult('Compare Balances from Substrate', passed,
        passed ? 'Balances match' : 'Balances do not match');
      results.push({ name: 'Compare Balances from Substrate', passed });
    } catch (error) {
      printTestResult('Compare Balances from Substrate', false, error.message);
      results.push({ name: 'Compare Balances from Substrate', passed: false });
    }

    // 测试用例 5: 批量余额检查
    console.log('\n📝 Test 5: Batch Balance Check');
    try {
      const testAddresses = [
        '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac',
        '0x7f9cb368073f3aeda4f3cb826310c437d9fbae22'
      ];
      
      const batchResults = await checker.batchCompareBalances(testAddresses);
      
      console.log('\n   📊 Batch Results:');
      let allSuccess = true;
      
      for (const result of batchResults) {
        if (result.success) {
          console.log(`   ✅ ${result.evmAddress}`);
          console.log(`      EVM: ${result.evmBalanceFormatted} | Substrate: ${result.substrateBalanceFormatted}`);
          console.log(`      Match: ${result.isEqual ? 'Yes' : 'No'}`);
        } else {
          console.log(`   ❌ ${result.address}: ${result.error}`);
          allSuccess = false;
        }
      }
      
      printTestResult('Batch Balance Check', allSuccess,
        `Checked ${testAddresses.length} addresses`);
      results.push({ name: 'Batch Balance Check', passed: allSuccess });
    } catch (error) {
      printTestResult('Batch Balance Check', false, error.message);
      results.push({ name: 'Batch Balance Check', passed: false });
    }

    // 测试用例 6: 余额一致性验证
    console.log('\n📝 Test 6: Balance Consistency Verification');
    try {
      const testAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
      
      // 多次查询验证一致性
      const query1 = await checker.compareBalances(testAddress);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      const query2 = await checker.compareBalances(testAddress);
      
      const consistent = query1.evmBalance === query2.evmBalance &&
                        query1.substrateBalance === query2.substrateBalance;
      
      console.log(`   First query:  EVM=${query1.evmBalanceFormatted}, Sub=${query1.substrateBalanceFormatted}`);
      console.log(`   Second query: EVM=${query2.evmBalanceFormatted}, Sub=${query2.substrateBalanceFormatted}`);
      console.log(`   Consistent: ${consistent ? '✅ Yes' : '❌ No'}`);
      
      printTestResult('Balance Consistency', consistent,
        consistent ? 'Balances remain consistent' : 'Balances changed between queries');
      results.push({ name: 'Balance Consistency', passed: consistent });
    } catch (error) {
      printTestResult('Balance Consistency', false, error.message);
      results.push({ name: 'Balance Consistency', passed: false });
    }

  } catch (error) {
    console.error('\n❌ Failed to connect to nodes:', error.message);
    console.log('\n⚠️  Make sure your Polkadot Revive nodes are running:');
    console.log('   - Substrate RPC: ws://localhost:9944');
    console.log('   - EVM RPC: http://localhost:8545');
  } finally {
    // 断开连接
    await checker.disconnect();
  }

  // 打印测试报告
  console.log('\n');
  const report = createTestReport(results);
  printTestReport(report);

  return report;
}

// 运行测试
testBalanceCheck()
  .then(() => {
    console.log('\n✅ All balance tests completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
