import { encodeAddress, decodeAddress, blake2AsHex } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex } from '@polkadot/util';

/**
 * 地址转换器类
 * 实现 EVM 地址和 Substrate 地址之间的相互转换
 */
class AddressConverter {
  /**
   * 将 Substrate 地址转换为 EVM 地址
   * 原理: 取 Substrate 公钥的 Blake2-256 哈希的前 20 字节
   * 
   * @param {string} substrateAddress - Substrate SS58 格式地址
   * @returns {string} EVM 地址 (0x 开头的 40 字符十六进制)
   */
  static substrateToEvm(substrateAddress) {
    try {
      // 1. 解码 SS58 地址得到公钥 (32 字节)
      const publicKey = decodeAddress(substrateAddress);
      
      // 2. 对公钥进行 Blake2-256 哈希
      const hash = blake2AsHex(publicKey, 256);
      
      // 3. 取哈希的前 20 字节作为 EVM 地址
      // Blake2 哈希返回 0x 开头的 66 字符串 (0x + 64 hex chars)
      // 我们需要前 20 字节 = 前 40 个 hex 字符
      const evmAddress = '0x' + hash.slice(2, 42);
      
      return evmAddress.toLowerCase();
    } catch (error) {
      throw new Error(`Failed to convert Substrate address to EVM: ${error.message}`);
    }
  }

  /**
   * 将 EVM 地址转换为 Substrate 地址
   * 注意: 这个转换在 Revive 中有特定的映射机制
   * 这里我们实现一个简化版本：使用 EVM 地址作为种子生成 Substrate 地址
   * 
   * @param {string} evmAddress - EVM 地址 (0x 开头)
   * @param {number} ss58Format - SS58 地址格式 (默认 42 为通用格式)
   * @returns {string} Substrate SS58 格式地址
   */
  static evmToSubstrate(evmAddress, ss58Format = 42) {
    try {
      // 移除 0x 前缀并转换为小写
      const cleanAddress = evmAddress.toLowerCase().replace('0x', '');
      
      // EVM 地址是 20 字节，我们需要扩展到 32 字节用于 Substrate
      // 方法: 在 EVM 地址后面填充 12 个字节的零
      const paddedHex = cleanAddress.padEnd(64, '0');
      
      // 转换为 Uint8Array
      const publicKey = hexToU8a('0x' + paddedHex);
      
      // 编码为 SS58 格式
      const substrateAddress = encodeAddress(publicKey, ss58Format);
      
      return substrateAddress;
    } catch (error) {
      throw new Error(`Failed to convert EVM address to Substrate: ${error.message}`);
    }
  }

  /**
   * 验证 EVM 地址格式
   * @param {string} address - 待验证的地址
   * @returns {boolean} 是否为有效的 EVM 地址
   */
  static isValidEvmAddress(address) {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  /**
   * 验证 Substrate 地址格式
   * @param {string} address - 待验证的地址
   * @returns {boolean} 是否为有效的 Substrate 地址
   */
  static isValidSubstrateAddress(address) {
    try {
      decodeAddress(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取地址的原始字节表示
   * @param {string} address - EVM 或 Substrate 地址
   * @returns {string} 十六进制字符串
   */
  static getAddressBytes(address) {
    if (this.isValidEvmAddress(address)) {
      return address;
    } else if (this.isValidSubstrateAddress(address)) {
      const publicKey = decodeAddress(address);
      return u8aToHex(publicKey);
    } else {
      throw new Error('Invalid address format');
    }
  }
}

export default AddressConverter;
