import { spawn } from 'child_process';
import { printSeparator } from '../src/utils.js';

/**
 * 运行所有测试
 */
async function runAllTests() {
  printSeparator('Running All Tests');
  
  const tests = [
    { name: 'Address Conversion Tests', script: 'test/address.test.js' },
    { name: 'Balance Verification Tests', script: 'test/balance.test.js' },
    { name: 'Precompile Contract Tests', script: 'test/precompile.test.js' }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n🚀 Running: ${test.name}`);
    console.log(`   Script: ${test.script}\n`);

    try {
      const success = await runTest(test.script);
      results.push({ name: test.name, passed: success });
      
      if (success) {
        console.log(`\n✅ ${test.name} PASSED\n`);
      } else {
        console.log(`\n❌ ${test.name} FAILED\n`);
      }
    } catch (error) {
      console.error(`\n❌ ${test.name} ERROR:`, error.message, '\n');
      results.push({ name: test.name, passed: false });
    }

    // 在测试之间暂停一下
    await sleep(1000);
  }

  // 打印最终报告
  printSeparator('Final Test Report');
  
  console.log('\n📊 Test Suite Results:\n');
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`   ${index + 1}. ${result.name}: ${status}`);
  });

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(2);

  console.log('\n📈 Summary:');
  console.log(`   Total test suites: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Pass rate: ${passRate}%`);
  
  printSeparator();

  // 如果有测试失败，返回错误码
  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Please check the output above.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All test suites passed successfully!\n');
    process.exit(0);
  }
}

/**
 * 运行单个测试脚本
 * @param {string} scriptPath - 测试脚本路径
 * @returns {Promise<boolean>} 测试是否通过
 */
function runTest(scriptPath) {
  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (error) => {
      console.error('Failed to start test:', error);
      resolve(false);
    });
  });
}

/**
 * 等待函数
 * @param {number} ms - 毫秒数
 * @returns {Promise} Promise 对象
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行所有测试
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
