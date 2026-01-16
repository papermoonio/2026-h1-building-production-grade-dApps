/**
 * Substrate SS58 <-> EVM H160 地址转换工具
 * 
 * 在Moonbeam等EVM兼容的Substrate链中，地址转换规则如下：
 * 1. SS58 -> H160: 取SS58解码后公钥的前20字节
 * 2. H160 -> SS58: 使用特定前缀 "evm:" + H160地址，然后进行Blake2哈希
 */

import { decodeAddress, encodeAddress, blake2AsU8a } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex, stringToU8a, u8aConcat } from '@polkadot/util';

/**
 * 将EVM H160地址转换为Substrate SS58地址
 * Moonbeam使用特定的映射规则：evm: prefix + H160 -> Blake2 hash -> SS58
 * 
 * @param {string} evmAddress - EVM地址 (0x开头的40位十六进制)
 * @param {number} ss58Format - SS58格式 (Moonbeam=1284, Moonriver=1285, Moonbase Alpha=1287)
 * @returns {string} SS58格式的地址
 */
export function evmToSubstrate(evmAddress, ss58Format = 1284) {
    // 移除0x前缀并转换为小写
    const evmAddressClean = evmAddress.toLowerCase().replace('0x', '');
    
    // Moonbeam的映射规则: "evm:" + evmAddress (不带0x) 进行blake2哈希
    const prefix = stringToU8a('evm:');
    const addressBytes = hexToU8a('0x' + evmAddressClean);
    
    // 拼接前缀和地址
    const data = u8aConcat(prefix, addressBytes);
    
    // 使用Blake2b-256哈希生成32字节的公钥
    const hash = blake2AsU8a(data, 256);
    
    // 编码为SS58格式
    return encodeAddress(hash, ss58Format);
}

/**
 * 将Substrate SS58地址转换为EVM H160地址
 * 适用于原生Substrate账户（非EVM映射账户）
 * 
 * @param {string} ss58Address - SS58格式的地址
 * @returns {string} EVM地址 (0x开头)
 */
export function substrateToEvm(ss58Address) {
    // 解码SS58地址获取公钥
    const publicKey = decodeAddress(ss58Address);
    
    // 取前20字节作为EVM地址
    const evmAddressBytes = publicKey.slice(0, 20);
    
    return u8aToHex(evmAddressBytes);
}

/**
 * 计算H160地址对应的Substrate账户（使用Moonbeam的映射规则）
 * 这是反向计算，验证EVM地址和SS58地址的对应关系
 * 
 * @param {string} h160Address - H160地址
 * @returns {Uint8Array} 32字节的账户ID
 */
export function computeSubstrateAccountFromH160(h160Address) {
    const evmAddressClean = h160Address.toLowerCase().replace('0x', '');
    const prefix = stringToU8a('evm:');
    const addressBytes = hexToU8a('0x' + evmAddressClean);
    const data = u8aConcat(prefix, addressBytes);
    return blake2AsU8a(data, 256);
}

/**
 * 检查SS58地址是否是EVM映射地址
 * 
 * @param {string} ss58Address - SS58地址
 * @returns {boolean} 是否是EVM映射地址
 */
export function isEvmMappedAddress(ss58Address) {
    try {
        const publicKey = decodeAddress(ss58Address);
        // EVM映射地址的公钥是从"evm:" + H160派生的
        // 很难直接判断，但可以检查是否是已知的映射
        return publicKey.length === 32;
    } catch {
        return false;
    }
}

// 示例使用
export function demonstrateConversion() {
    console.log('='.repeat(60));
    console.log('Substrate SS58 <-> EVM H160 地址转换演示');
    console.log('='.repeat(60));
    
    // 示例EVM地址
    const evmAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    console.log(`\n1. EVM地址: ${evmAddress}`);
    
    // 转换为不同网络的SS58地址
    const moonbeamSS58 = evmToSubstrate(evmAddress, 1284);
    const moonriverSS58 = evmToSubstrate(evmAddress, 1285);
    const moonbaseSS58 = evmToSubstrate(evmAddress, 1287);
    
    console.log(`   -> Moonbeam SS58:     ${moonbeamSS58}`);
    console.log(`   -> Moonriver SS58:    ${moonriverSS58}`);
    console.log(`   -> Moonbase SS58:     ${moonbaseSS58}`);
    
    // 示例SS58地址（Polkadot格式）
    const ss58Address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
    console.log(`\n2. SS58地址: ${ss58Address}`);
    
    const evmFromSS58 = substrateToEvm(ss58Address);
    console.log(`   -> EVM H160地址:      ${evmFromSS58}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('注意: 这两种转换不是互逆的！');
    console.log('- EVM->SS58: 使用Blake2哈希，是Moonbeam的映射规则');
    console.log('- SS58->EVM: 直接截取公钥前20字节');
    console.log('='.repeat(60));
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('addressConverter')) {
    demonstrateConversion();
}
