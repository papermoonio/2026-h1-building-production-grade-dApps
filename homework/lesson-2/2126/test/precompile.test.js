import {
  getProvider,
  closeConnections
} from '../src/precompile-caller.js';

const TEST_ADDRESS = '0x9621dde636de098b43efb0fa9b61facfe328f99d';

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

async function runPrecompileTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  Precompile 调用测试 (Precompile Call Tests)');
  console.log('  使用 ethers + JSON-RPC');
  console.log('='.repeat(60));
  
  const results = [];
  const provider = getProvider();
  
  printSection('验证 EVM RPC 连接');
  try {
    const chainId = await provider.send('eth_chainId', []);
    const chainIdNum = parseInt(chainId);
    results.push(printTestResult('EVM RPC Connection', chainIdNum > 0,
      `成功连接, Chain ID: ${chainIdNum} (0x${chainIdNum.toString(16)})`));
  } catch (error) {
    results.push(printTestResult('EVM RPC Connection', false, `错误: ${error.message}`));
  }
  
  printSection('获取最新区块');
  try {
    const blockNumber = await provider.send('eth_blockNumber', []);
    const blockNum = parseInt(blockNumber);
    results.push(printTestResult('Get Latest Block', blockNum >= 0,
      `最新区块: ${blockNum} (0x${blockNumber})`));
  } catch (error) {
    results.push(printTestResult('Get Latest Block', false, `错误: ${error.message}`));
  }
  
  printSection('查询账户余额 (eth_getBalance)');
  try {
    const balance = await provider.send('eth_getBalance', [TEST_ADDRESS, 'latest']);
    const balanceBigInt = BigInt(balance);
    const balanceEth = Number(balanceBigInt) / 1e18;
    results.push(printTestResult('Query Account Balance', balanceBigInt >= 0n,
      `账户 ${TEST_ADDRESS} 余额: ${balanceEth.toFixed(6)} ETH`));
  } catch (error) {
    results.push(printTestResult('Query Account Balance', false, `错误: ${error.message}`));
  }
  
  printSection('调用 eth_call (合约查询)');
  try {
    const data = '0x70a08231' + TEST_ADDRESS.slice(2).padStart(64, '0');
    const result = await provider.send('eth_call', [{
      to: '0x0000000000000000000000000000000000000402',
      data: data
    }, 'latest']);
    
    results.push(printTestResult('eth_call Contract Query', result !== undefined,
      `调用成功, 返回: ${result || '0x0'}`));
  } catch (error) {
    results.push(printTestResult('eth_call Contract Query', false, `错误: ${error.message}`));
  }
  
  printSection('使用 ethers.js 查询余额');
  try {
    const balance = await provider.getBalance(TEST_ADDRESS);
    const balanceEth = Number(balance) / 1e18;
    results.push(printTestResult('Ethers.js Balance Query', balance >= 0n,
      `余额: ${balanceEth.toFixed(6)} ETH`));
  } catch (error) {
    results.push(printTestResult('Ethers.js Balance Query', false, `错误: ${error.message}`));
  }
  
  printSection('测试结果汇总');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\n  总测试: ${total}, 通过: ${passed}, 失败: ${total - passed}`);
  console.log(`  通过率: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  await closeConnections();
  
  return passed === total;
}

runPrecompileTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(async error => {
    console.error('测试执行失败:', error);
    await closeConnections();
    process.exit(1);
  });
