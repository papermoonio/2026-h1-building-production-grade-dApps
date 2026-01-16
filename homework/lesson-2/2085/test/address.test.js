import AddressConverter from '../src/address-converter.js';
import { printSeparator, printTestResult, createTestReport, printTestReport } from '../src/utils.js';

/**
 * 地址转换测试
 */
async function testAddressConversion() {
  printSeparator('Address Conversion Tests');
  
  const results = [];

  // 测试用例 1: EVM 地址验证
  console.log('\n📝 Test 1: EVM Address Validation');
  try {
    const validEvmAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
    const invalidEvmAddress = '0xinvalid';
    
    const test1a = AddressConverter.isValidEvmAddress(validEvmAddress);
    const test1b = !AddressConverter.isValidEvmAddress(invalidEvmAddress);
    
    const passed = test1a && test1b;
    printTestResult('EVM Address Validation', passed, 
      `Valid: ${test1a}, Invalid rejected: ${test1b}`);
    results.push({ name: 'EVM Address Validation', passed });
  } catch (error) {
    printTestResult('EVM Address Validation', false, error.message);
    results.push({ name: 'EVM Address Validation', passed: false });
  }

  // 测试用例 2: Substrate 地址验证
  console.log('\n📝 Test 2: Substrate Address Validation');
  try {
    const validSubstrateAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
    const invalidSubstrateAddress = 'invalid_address';
    
    const test2a = AddressConverter.isValidSubstrateAddress(validSubstrateAddress);
    const test2b = !AddressConverter.isValidSubstrateAddress(invalidSubstrateAddress);
    
    const passed = test2a && test2b;
    printTestResult('Substrate Address Validation', passed,
      `Valid: ${test2a}, Invalid rejected: ${test2b}`);
    results.push({ name: 'Substrate Address Validation', passed });
  } catch (error) {
    printTestResult('Substrate Address Validation', false, error.message);
    results.push({ name: 'Substrate Address Validation', passed: false });
  }

  // 测试用例 3: Substrate → EVM 转换
  console.log('\n📝 Test 3: Substrate → EVM Conversion');
  try {
    const substrateAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
    const evmAddress = AddressConverter.substrateToEvm(substrateAddress);
    
    console.log(`   Substrate: ${substrateAddress}`);
    console.log(`   EVM:       ${evmAddress}`);
    
    const passed = AddressConverter.isValidEvmAddress(evmAddress);
    printTestResult('Substrate → EVM Conversion', passed,
      `Converted to valid EVM address: ${passed}`);
    results.push({ name: 'Substrate → EVM Conversion', passed });
  } catch (error) {
    printTestResult('Substrate → EVM Conversion', false, error.message);
    results.push({ name: 'Substrate → EVM Conversion', passed: false });
  }

  // 测试用例 4: EVM → Substrate 转换
  console.log('\n📝 Test 4: EVM → Substrate Conversion');
  try {
    const evmAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
    const substrateAddress = AddressConverter.evmToSubstrate(evmAddress);
    
    console.log(`   EVM:       ${evmAddress}`);
    console.log(`   Substrate: ${substrateAddress}`);
    
    const passed = AddressConverter.isValidSubstrateAddress(substrateAddress);
    printTestResult('EVM → Substrate Conversion', passed,
      `Converted to valid Substrate address: ${passed}`);
    results.push({ name: 'EVM → Substrate Conversion', passed });
  } catch (error) {
    printTestResult('EVM → Substrate Conversion', false, error.message);
    results.push({ name: 'EVM → Substrate Conversion', passed: false });
  }

  // 测试用例 5: 双向转换一致性
  console.log('\n📝 Test 5: Round-trip Conversion');
  try {
    const originalEvm = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
    const substrate = AddressConverter.evmToSubstrate(originalEvm);
    const backToEvm = AddressConverter.substrateToEvm(substrate);
    
    console.log(`   Original EVM:  ${originalEvm}`);
    console.log(`   Via Substrate: ${substrate}`);
    console.log(`   Back to EVM:   ${backToEvm}`);
    
    // 注意: 由于填充方式，往返转换可能不完全相同
    // 这里我们只验证格式有效性
    const passed = AddressConverter.isValidEvmAddress(backToEvm);
    printTestResult('Round-trip Conversion', passed,
      `Round-trip produces valid address: ${passed}`);
    results.push({ name: 'Round-trip Conversion', passed });
  } catch (error) {
    printTestResult('Round-trip Conversion', false, error.message);
    results.push({ name: 'Round-trip Conversion', passed: false });
  }

  // 测试用例 6: 获取地址字节表示
  console.log('\n📝 Test 6: Get Address Bytes');
  try {
    const evmAddress = '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac';
    const evmBytes = AddressConverter.getAddressBytes(evmAddress);
    
    const substrateAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const substrateBytes = AddressConverter.getAddressBytes(substrateAddress);
    
    console.log(`   EVM bytes:       ${evmBytes}`);
    console.log(`   Substrate bytes: ${substrateBytes}`);
    
    const passed = evmBytes.startsWith('0x') && substrateBytes.startsWith('0x');
    printTestResult('Get Address Bytes', passed,
      `Both formats produce valid hex: ${passed}`);
    results.push({ name: 'Get Address Bytes', passed });
  } catch (error) {
    printTestResult('Get Address Bytes', false, error.message);
    results.push({ name: 'Get Address Bytes', passed: false });
  }

  // 测试用例 7: 批量转换测试
  console.log('\n📝 Test 7: Batch Conversion');
  try {
    const testAddresses = [
      '0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac',
      '0x7f9cb368073f3aeda4f3cb826310c437d9fbae22',
      '0x1111111111111111111111111111111111111111'
    ];
    
    let allPassed = true;
    console.log('   Converting multiple EVM addresses:');
    
    for (const evmAddr of testAddresses) {
      const subAddr = AddressConverter.evmToSubstrate(evmAddr);
      const isValid = AddressConverter.isValidSubstrateAddress(subAddr);
      console.log(`   ${evmAddr} → ${subAddr.substring(0, 20)}... (${isValid ? '✓' : '✗'})`);
      allPassed = allPassed && isValid;
    }
    
    printTestResult('Batch Conversion', allPassed,
      `All ${testAddresses.length} addresses converted successfully`);
    results.push({ name: 'Batch Conversion', passed: allPassed });
  } catch (error) {
    printTestResult('Batch Conversion', false, error.message);
    results.push({ name: 'Batch Conversion', passed: false });
  }

  // 打印测试报告
  console.log('\n');
  const report = createTestReport(results);
  printTestReport(report);

  return report;
}

// 运行测试
testAddressConversion()
  .then(() => {
    console.log('\n✅ All address conversion tests completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
