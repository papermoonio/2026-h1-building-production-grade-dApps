import { ethers } from 'ethers';

/**
 * 工具函数集合
 */

/**
 * 格式化余额显示
 * @param {bigint|string} balance - 余额
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的余额
 */
export function formatBalance(balance, decimals = 18) {
  const balanceStr = balance.toString();
  if (balanceStr === '0') return '0';
  
  const formatted = ethers.formatUnits(balanceStr, decimals);
  // 保留 6 位小数
  return parseFloat(formatted).toFixed(6);
}

/**
 * 打印分隔线
 * @param {string} title - 标题
 * @param {number} width - 宽度
 */
export function printSeparator(title = '', width = 80) {
  if (title) {
    const padding = Math.floor((width - title.length - 2) / 2);
    const line = '='.repeat(padding) + ` ${title} ` + '='.repeat(padding);
    console.log('\n' + line);
  } else {
    console.log('='.repeat(width));
  }
}

/**
 * 打印对象的键值对
 * @param {Object} obj - 要打印的对象
 * @param {number} indent - 缩进级别
 */
export function printObject(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(`${spaces}${key}:`);
      printObject(value, indent + 1);
    } else if (Array.isArray(value)) {
      console.log(`${spaces}${key}: [${value.join(', ')}]`);
    } else {
      console.log(`${spaces}${key}: ${value}`);
    }
  }
}

/**
 * 格式化时间戳
 * @param {number} timestamp - Unix 时间戳(秒)
 * @returns {string} 格式化的时间字符串
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * 等待指定毫秒数
 * @param {number} ms - 毫秒数
 * @returns {Promise} Promise 对象
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查地址格式
 * @param {string} address - 地址
 * @returns {string} 'evm' | 'substrate' | 'unknown'
 */
export function detectAddressType(address) {
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return 'evm';
  } else if (address.length >= 47 && address.length <= 49) {
    // Substrate SS58 地址通常是 47-49 个字符
    return 'substrate';
  }
  return 'unknown';
}

/**
 * 安全地转换 BigInt 为字符串
 * @param {any} value - 值
 * @returns {string} 字符串表示
 */
export function safeStringify(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'object' && value !== null) {
    const obj = {};
    for (const [key, val] of Object.entries(value)) {
      obj[key] = safeStringify(val);
    }
    return obj;
  }
  return value;
}

/**
 * 打印测试结果
 * @param {string} testName - 测试名称
 * @param {boolean} passed - 是否通过
 * @param {string} message - 消息
 */
export function printTestResult(testName, passed, message = '') {
  const status = passed ? '✅ PASSED' : '❌ FAILED';
  console.log(`\n${status}: ${testName}`);
  if (message) {
    console.log(`   ${message}`);
  }
}

/**
 * 创建测试报告
 * @param {Array} results - 测试结果数组
 * @returns {Object} 汇总信息
 */
export function createTestReport(results) {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const passRate = ((passed / total) * 100).toFixed(2);

  return {
    total,
    passed,
    failed,
    passRate: `${passRate}%`
  };
}

/**
 * 打印测试报告
 * @param {Object} report - 测试报告
 */
export function printTestReport(report) {
  printSeparator('Test Report');
  console.log(`Total tests: ${report.total}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Pass rate: ${report.passRate}`);
  printSeparator();
}
