import {
  substrateToEvmAddress,
  evmToSubstrateAddress,
  validateEvmAddress,
  validateSubstrateAddress,
  getEvmAddressBytes,
  getSubstrateAddressBytes,
  batchConvertToEvm,
  batchConvertToSubstrate
} from '../src/address-converter.js';

const TEST_ADDRESSES = {
  substrate: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  evm: '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac'
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

async function runAddressTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  地址转换测试套件 (Address Conversion Tests)');
  console.log('  使用 keccak256 + 0xEE 填充逻辑');
  console.log('='.repeat(60));
  
  const results = [];
  
  printSection('EVM 地址格式验证');
  const validEvm1 = validateEvmAddress(TEST_ADDRESSES.evm);
  results.push(printTestResult('Valid EVM Address', validEvm1, validEvm1 ? '格式正确' : '格式错误'));
  
  const invalidEvm = validateEvmAddress('0x123');
  results.push(printTestResult('Invalid EVM Address', !invalidEvm, !invalidEvm ? '正确拒绝短地址' : '错误: 应拒绝短地址'));
  
  printSection('Substrate 地址格式验证');
  const validSubstrate1 = validateSubstrateAddress(TEST_ADDRESSES.substrate);
  results.push(printTestResult('Valid Substrate Address', validSubstrate1, validSubstrate1 ? '格式正确' : '格式错误'));
  
  const invalidSubstrate = validateSubstrateAddress('invalid');
  results.push(printTestResult('Invalid Substrate Address', !invalidSubstrate, !invalidSubstrate ? '正确拒绝无效地址' : '错误: 应拒绝无效地址'));
  
  printSection('Substrate → EVM 转换');
  try {
    const evmResult = substrateToEvmAddress(TEST_ADDRESSES.substrate);
    const isValid = validateEvmAddress(evmResult);
    results.push(printTestResult('Substrate → EVM', isValid, isValid
      ? `✓ ${TEST_ADDRESSES.substrate} → ${evmResult} (有效 EVM 地址)`
      : `✗ 转换结果无效: ${evmResult}`));
  } catch (error) {
    results.push(printTestResult('Substrate → EVM', false, `错误: ${error.message}`));
  }
  
  printSection('EVM → Substrate 转换');
  try {
    const substrateResult = evmToSubstrateAddress(TEST_ADDRESSES.evm);
    const isValid = validateSubstrateAddress(substrateResult);
    results.push(printTestResult('EVM → Substrate', isValid, isValid
      ? `✓ ${TEST_ADDRESSES.evm} → ${substrateResult} (有效 Substrate 地址)`
      : `✗ 转换结果无效: ${substrateResult}`));
  } catch (error) {
    results.push(printTestResult('EVM → Substrate', false, `错误: ${error.message}`));
  }
  
  printSection('往返转换测试');
  try {
    const roundTrip1 = substrateToEvmAddress(TEST_ADDRESSES.substrate);
    const roundTrip2 = evmToSubstrateAddress(roundTrip1);
    const roundTripEvm = substrateToEvmAddress(roundTrip2);
    const isValidEvm = validateEvmAddress(roundTripEvm);
    results.push(printTestResult('Round Trip (Sub→EVM→Sub→EVM)', isValidEvm, isValidEvm
      ? `✓ 往返转换产生有效地址: ${roundTripEvm}`
      : `✗ 往返转换结果无效: ${roundTripEvm}`));
  } catch (error) {
    results.push(printTestResult('Round Trip', false, `错误: ${error.message}`));
  }
  
  printSection('地址字节表示');
  try {
    const evmBytes = getEvmAddressBytes(TEST_ADDRESSES.evm);
    const substrateBytes = getSubstrateAddressBytes(TEST_ADDRESSES.substrate);
    const evmBytesValid = evmBytes.length === 20;
    const substrateBytesValid = substrateBytes.length === 32;
    results.push(printTestResult('EVM bytes length', evmBytesValid, `${evmBytes.length} 字节 (应为20)`));
    results.push(printTestResult('Substrate bytes length', substrateBytesValid, `${substrateBytes.length} 字节 (应为32)`));
  } catch (error) {
    results.push(printTestResult('Bytes extraction', false, `错误: ${error.message}`));
  }
  
  printSection('批量转换');
  try {
    const substrateList = [
      TEST_ADDRESSES.substrate,
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    ];
    const evmResults = batchConvertToEvm(substrateList);
    const allValid = evmResults.every(r => r.isValidSubstrate && r.evm.startsWith('0x'));
    results.push(printTestResult('Batch Sub→EVM', allValid, `成功转换 ${evmResults.length} 个地址`));
    
    const evmList = [
      TEST_ADDRESSES.evm,
      '0x7f9cb368073f3aeda4f3cb826310c437d9fbae22'
    ];
    const substrateResults = batchConvertToSubstrate(evmList);
    const allSubstrateValid = substrateResults.every(r => r.isValidEvm && r.substrate.startsWith('5'));
    results.push(printTestResult('Batch EVM→Substrate', allSubstrateValid, `成功转换 ${substrateResults.length} 个地址`));
  } catch (error) {
    results.push(printTestResult('Batch conversion', false, `错误: ${error.message}`));
  }
  
  printSection('测试结果汇总');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\n  总测试: ${total}, 通过: ${passed}, 失败: ${total - passed}`);
  console.log(`  通过率: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  return passed === total;
}

runAddressTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
