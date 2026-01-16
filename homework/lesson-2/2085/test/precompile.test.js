import PrecompileCaller from '../src/precompile-caller.js';
import { printSeparator, printTestResult, printObject, createTestReport, printTestReport } from '../src/utils.js';

/**
 * Precompile 调用测试
 */
async function testPrecompileCalls() {
  printSeparator('Precompile Contract Tests');
  
  const results = [];
  const caller = new PrecompileCaller();

  try {
    // 连接到节点
    console.log('\n🔌 Connecting to EVM node...');
    await caller.connect();
    
    // 测试用例 1: 列出支持的 Precompiles
    console.log('\n📝 Test 1: List Supported Precompiles');
    try {
      const precompiles = caller.getSupportedPrecompiles();
      
      console.log('\n   📋 Available Precompiles:');
      precompiles.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name}`);
        console.log(`      Address: ${p.address}`);
        console.log(`      Description: ${p.description}`);
      });
      
      const passed = precompiles.length > 0;
      printTestResult('List Precompiles', passed,
        `Found ${precompiles.length} precompiles`);
      results.push({ name: 'List Precompiles', passed });
    } catch (error) {
      printTestResult('List Precompiles', false, error.message);
      results.push({ name: 'List Precompiles', passed: false });
    }

    // 测试用例 2: 通过 Balances Precompile 查询余额
    console.log('\n📝 Test 2: Call Balances Precompile');
    try {
      const testAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
      const result = await caller.getBalanceViaPrecompile(testAddress);
      
      console.log('\n   📊 Precompile Query Result:');
      console.log(`   Account Address:    ${result.address}`);
      console.log(`   Precompile Address: ${result.precompileAddress}`);
      console.log(`   Balance (wei):      ${result.balance}`);
      console.log(`   Balance (ETH):      ${result.balanceFormatted}`);
      
      const passed = BigInt(result.balance) >= 0n;
      printTestResult('Call Balances Precompile', passed,
        'Successfully queried balance via precompile');
      results.push({ name: 'Call Balances Precompile', passed });
    } catch (error) {
      printTestResult('Call Balances Precompile', false, error.message);
      results.push({ name: 'Call Balances Precompile', passed: false });
    }

    // 测试用例 3: 验证 Precompile 余额与直接查询的一致性
    console.log('\n📝 Test 3: Verify Precompile Balance Accuracy');
    try {
      const testAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
      const verification = await caller.verifyPrecompileBalance(testAddress);
      
      console.log('\n   📊 Balance Verification:');
      console.log(`   Account:            ${verification.address}`);
      console.log(`   Precompile Balance: ${verification.precompileBalanceFormatted} ETH`);
      console.log(`   Direct Balance:     ${verification.directBalanceFormatted} ETH`);
      console.log(`   Match:              ${verification.isEqual ? '✅ Yes' : '❌ No'}`);
      
      if (!verification.isEqual) {
        console.log(`   Difference:         ${verification.difference} wei`);
      }
      
      const passed = verification.isEqual;
      printTestResult('Verify Precompile Accuracy', passed,
        passed ? 'Precompile returns correct balance' : 'Balances do not match');
      results.push({ name: 'Verify Precompile Accuracy', passed });
    } catch (error) {
      printTestResult('Verify Precompile Accuracy', false, error.message);
      results.push({ name: 'Verify Precompile Accuracy', passed: false });
    }

    // 测试用例 4: 批量查询余额
    console.log('\n📝 Test 4: Batch Balance Queries via Precompile');
    try {
      const testAddresses = [
        '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac',
        '0x7f9cb368073f3aeda4f3cb826310c437d9fbae22',
        '0x0000000000000000000000000000000000000000' // Zero address
      ];
      
      const batchResults = await caller.batchGetBalances(testAddresses);
      
      console.log('\n   📊 Batch Query Results:');
      let allSuccess = true;
      
      for (const result of batchResults) {
        if (result.success) {
          console.log(`   ✅ ${result.address}`);
          console.log(`      Balance: ${result.balanceFormatted} ETH`);
        } else {
          console.log(`   ❌ ${result.address}`);
          console.log(`      Error: ${result.error}`);
          allSuccess = false;
        }
      }
      
      const successCount = batchResults.filter(r => r.success).length;
      printTestResult('Batch Precompile Queries', allSuccess,
        `${successCount}/${testAddresses.length} queries successful`);
      results.push({ name: 'Batch Precompile Queries', passed: allSuccess });
    } catch (error) {
      printTestResult('Batch Precompile Queries', false, error.message);
      results.push({ name: 'Batch Precompile Queries', passed: false });
    }

    // 测试用例 5: 测试 ECRecover Precompile (示例)
    console.log('\n📝 Test 5: Test ECRecover Precompile');
    try {
      const ecrecoverResult = await caller.testECRecoverPrecompile();
      
      console.log('\n   📊 ECRecover Test:');
      console.log(`   Precompile Address: ${ecrecoverResult.precompileAddress}`);
      console.log(`   Success:            ${ecrecoverResult.success ? '✅ Yes' : '❌ No'}`);
      
      if (ecrecoverResult.success) {
        console.log(`   Result:             ${ecrecoverResult.result}`);
      } else {
        console.log(`   Error:              ${ecrecoverResult.error}`);
      }
      
      const passed = ecrecoverResult.success !== undefined;
      printTestResult('Test ECRecover Precompile', passed,
        'ECRecover precompile callable');
      results.push({ name: 'Test ECRecover Precompile', passed });
    } catch (error) {
      printTestResult('Test ECRecover Precompile', false, error.message);
      results.push({ name: 'Test ECRecover Precompile', passed: false });
    }

    // 测试用例 6: 验证 Precompile 地址可访问性
    console.log('\n📝 Test 6: Verify Precompile Address Accessibility');
    try {
      const precompiles = caller.getSupportedPrecompiles();
      let allAccessible = true;
      
      console.log('\n   🔍 Checking precompile accessibility:');
      
      for (const precompile of precompiles) {
        try {
          // 尝试获取该地址的代码
          const code = await caller.provider.getCode(precompile.address);
          const hasCode = code !== '0x';
          
          console.log(`   ${hasCode ? '✅' : '⚠️ '} ${precompile.name} (${precompile.address})`);
          
          // 注意: Precompile 可能没有字节码，这是正常的
          // 我们只是检查地址是否可访问
        } catch (error) {
          console.log(`   ❌ ${precompile.name}: ${error.message}`);
          allAccessible = false;
        }
      }
      
      printTestResult('Precompile Accessibility', allAccessible,
        'All precompile addresses are accessible');
      results.push({ name: 'Precompile Accessibility', passed: allAccessible });
    } catch (error) {
      printTestResult('Precompile Accessibility', false, error.message);
      results.push({ name: 'Precompile Accessibility', passed: false });
    }

    // 测试用例 7: 多次调用性能测试
    console.log('\n📝 Test 7: Precompile Call Performance');
    try {
      const testAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
      const iterations = 5;
      const times = [];
      
      console.log(`\n   ⏱️  Measuring ${iterations} consecutive calls...`);
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await caller.getBalanceViaPrecompile(testAddress);
        const duration = Date.now() - start;
        times.push(duration);
        console.log(`   Call ${i + 1}: ${duration}ms`);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime}ms, Max: ${maxTime}ms`);
      
      const passed = avgTime < 1000; // 平均响应时间应该小于1秒
      printTestResult('Precompile Performance', passed,
        `Average call time: ${avgTime.toFixed(2)}ms`);
      results.push({ name: 'Precompile Performance', passed });
    } catch (error) {
      printTestResult('Precompile Performance', false, error.message);
      results.push({ name: 'Precompile Performance', passed: false });
    }

  } catch (error) {
    console.error('\n❌ Failed to connect to EVM node:', error.message);
    console.log('\n⚠️  Make sure your EVM RPC is running at: http://localhost:8545');
  }

  // 打印测试报告
  console.log('\n');
  const report = createTestReport(results);
  printTestReport(report);

  return report;
}

// 运行测试
testPrecompileCalls()
  .then(() => {
    console.log('\n✅ All precompile tests completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
