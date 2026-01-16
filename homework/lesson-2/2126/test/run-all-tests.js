import { spawn } from 'child_process';

const tests = [
  { name: 'Address Tests', path: 'test/address.test.js' },
  { name: 'Balance Tests', path: 'test/balance.test.js' },
  { name: 'Precompile Tests', path: 'test/precompile.test.js' }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${'#'.repeat(70)}`);
    console.log(`#  运行测试: ${test.name}`);
    console.log('#'.repeat(70));
    
    const child = spawn('node', [test.path], { cwd: process.cwd() });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      resolve({ name: test.name, code, stdout, stderr });
    });
    
    child.on('error', (error) => {
      resolve({ name: test.name, code: 1, error: error.message });
    });
  });
}

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('  Lesson 2 作业测试套件');
  console.log('  Address Conversion & Precompile Testing');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('  测试结果汇总');
  console.log('='.repeat(70));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const result of results) {
    const status = result.code === 0 ? '✅ 通过' : '❌ 失败';
    console.log(`  ${result.name}: ${status}`);
    if (result.code === 0) {
      totalPassed++;
    } else {
      totalFailed++;
    }
  }
  
  console.log('\n' + '-'.repeat(70));
  console.log(`  总测试套件: ${tests.length}, 通过: ${totalPassed}, 失败: ${totalFailed}`);
  console.log('-'.repeat(70));
  
  const allPassed = totalFailed === 0;
  console.log(`\n  最终结果: ${allPassed ? '✅ 所有测试通过!' : '❌ 部分测试失败'}\n`);
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('测试套件执行失败:', error);
  process.exit(1);
});
