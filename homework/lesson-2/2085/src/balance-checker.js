import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';
import AddressConverter from './address-converter.js';

/**
 * 余额检查器类
 * 验证同一账户在 EVM 和 Substrate 系统中的余额一致性
 */
class BalanceChecker {
  constructor(substrateRpc = 'ws://localhost:9944', evmRpc = 'http://localhost:8545') {
    this.substrateRpc = substrateRpc;
    this.evmRpc = evmRpc;
    this.substrateApi = null;
    this.evmProvider = null;
  }

  /**
   * 连接到 Substrate 和 EVM 节点
   */
  async connect() {
    try {
      // 连接 Substrate
      const wsProvider = new WsProvider(this.substrateRpc);
      this.substrateApi = await ApiPromise.create({ provider: wsProvider });
      console.log('✅ Connected to Substrate node');

      // 连接 EVM
      this.evmProvider = new ethers.JsonRpcProvider(this.evmRpc);
      await this.evmProvider.getNetwork();
      console.log('✅ Connected to EVM node');
    } catch (error) {
      throw new Error(`Failed to connect to nodes: ${error.message}`);
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.substrateApi) {
      await this.substrateApi.disconnect();
    }
  }

  /**
   * 获取 Substrate 账户余额
   * @param {string} substrateAddress - Substrate SS58 地址
   * @returns {bigint} 余额 (最小单位)
   */
  async getSubstrateBalance(substrateAddress) {
    try {
      const { data: balance } = await this.substrateApi.query.system.account(substrateAddress);
      return BigInt(balance.free.toString());
    } catch (error) {
      throw new Error(`Failed to get Substrate balance: ${error.message}`);
    }
  }

  /**
   * 获取 EVM 账户余额
   * @param {string} evmAddress - EVM 地址
   * @returns {bigint} 余额 (wei)
   */
  async getEvmBalance(evmAddress) {
    try {
      const balance = await this.evmProvider.getBalance(evmAddress);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get EVM balance: ${error.message}`);
    }
  }

  /**
   * 比较同一账户在两个系统中的余额
   * @param {string} address - EVM 或 Substrate 地址
   * @returns {Object} 包含两个系统余额和比较结果的对象
   */
  async compareBalances(address) {
    let evmAddress, substrateAddress;

    // 判断输入地址类型并进行转换
    if (AddressConverter.isValidEvmAddress(address)) {
      evmAddress = address;
      substrateAddress = AddressConverter.evmToSubstrate(address);
    } else if (AddressConverter.isValidSubstrateAddress(address)) {
      substrateAddress = address;
      evmAddress = AddressConverter.substrateToEvm(address);
    } else {
      throw new Error('Invalid address format');
    }

    // 获取两个系统的余额
    const evmBalance = await this.getEvmBalance(evmAddress);
    const substrateBalance = await this.getSubstrateBalance(substrateAddress);

    // 比较余额
    const isEqual = evmBalance === substrateBalance;
    const difference = evmBalance - substrateBalance;

    return {
      evmAddress,
      substrateAddress,
      evmBalance: evmBalance.toString(),
      substrateBalance: substrateBalance.toString(),
      evmBalanceFormatted: ethers.formatEther(evmBalance),
      substrateBalanceFormatted: this.formatSubstrateBalance(substrateBalance),
      isEqual,
      difference: difference.toString(),
      differenceFormatted: ethers.formatEther(difference)
    };
  }

  /**
   * 格式化 Substrate 余额
   * @param {bigint} balance - 原始余额
   * @returns {string} 格式化后的余额
   */
  formatSubstrateBalance(balance) {
    // Polkadot/Substrate 通常使用 10^18 作为单位
    return ethers.formatEther(balance);
  }

  /**
   * 批量检查多个地址的余额
   * @param {string[]} addresses - 地址数组
   * @returns {Array} 每个地址的余额比较结果
   */
  async batchCompareBalances(addresses) {
    const results = [];
    
    for (const address of addresses) {
      try {
        const result = await this.compareBalances(address);
        results.push({
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          success: false,
          address,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default BalanceChecker;
