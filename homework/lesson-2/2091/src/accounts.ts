/**
 * 账户管理和地址转换模块
 * 实现 Substrate (SS58) 和 EVM (H160) 地址格式之间的相互转换
 */

import { DEV_PHRASE, entropyToMiniSecret, mnemonicToEntropy, KeyPair, ss58Address } from "@polkadot-labs/hdkd-helpers"
import { sr25519CreateDerive } from "@polkadot-labs/hdkd"
import { keccak256, getBytes, getAddress } from "ethers"
import { randomBytes } from 'crypto'
import { ethers } from "ethers";

// SS58 地址前缀，42 是通用的 Substrate 地址格式
const SS58_PREFIX = 42;

/**
 * 从助记词派生路径获取密钥对
 * 使用开发环境的标准助记词（DEV_PHRASE）和指定的派生路径生成密钥对
 * 
 * @param path - 派生路径，例如 "//Alice", "//Bob" 等
 * @returns Sr25519 密钥对
 */
export function getKeypairFromPath(path: string): KeyPair {
    // 将助记词转换为熵值
    const entropy = mnemonicToEntropy(DEV_PHRASE)
    
    // 从熵值生成 mini secret
    const miniSecret = entropyToMiniSecret(entropy)
    
    // 创建 Sr25519 派生函数
    const derive = sr25519CreateDerive(miniSecret)
    
    // 使用派生路径生成密钥对
    const hdkdKeyPair = derive(path)
    return hdkdKeyPair
}

/**
 * 获取 Alice 账户的密钥对
 * Alice 是开发链中的预定义账户，拥有初始资金和 Sudo 权限
 * 
 * @returns Alice 的密钥对
 */
export const getAlice = () => getKeypairFromPath("//Alice")

/**
 * 生成随机的 Substrate 密钥对
 * 使用加密安全的随机数生成新的账户密钥对
 * 
 * @returns 随机生成的密钥对
 */
export function getRandomSubstrateKeypair(): KeyPair {
    // 生成 32 字节的随机种子
    const seed = randomBytes(32);
    
    // 从种子生成 mini secret
    const miniSecret = entropyToMiniSecret(seed)
    
    // 创建派生函数并生成密钥对
    const derive = sr25519CreateDerive(miniSecret)
    const hdkdKeyPair = derive("")

    return hdkdKeyPair
}

/**
 * 将公钥转换为 SS58 格式的地址
 * SS58 是 Substrate 生态系统使用的地址编码格式
 * 
 * @param publickey - 32 字节的公钥
 * @returns SS58 格式的地址字符串
 */
export function convertPublicKeyToSs58(publickey: Uint8Array) {
    return ss58Address(publickey, SS58_PREFIX);
}

/**
 * Substrate 账户 ID 类型定义
 * AccountId32 是 32 字节的账户标识符
 */
export type AccountId32 = Uint8Array;

/**
 * 检查账户 ID 是否由 EVM 地址派生而来
 * EVM 派生的账户 ID 的后 12 字节全部为 0xEE
 * 
 * @param accountId - 32 字节的账户 ID
 * @returns 如果是 EVM 派生的账户返回 true，否则返回 false
 */
function isEthDerived(accountId: AccountId32): boolean {
    if (accountId.length !== 32) {
        return false;
    }
    // 检查后 12 字节是否全部为 0xEE
    for (let i = 20; i < 32; i++) {
        if (accountId[i] !== 0xEE) {
            return false;
        }
    }
    return true;
}

/**
 * 将 EVM H160 地址转换为 Substrate AccountId32
 * 转换规则：H160 地址（20字节）+ 填充 0xEE（12字节）= AccountId32（32字节）
 * 
 * @param address - EVM H160 地址（0x 开头的 40 位十六进制字符串）
 * @returns 32 字节的 Substrate 账户 ID
 * @throws 如果地址长度不是 20 字节则抛出错误
 */
export function h160ToAccountId32(address: string): AccountId32 {
    // 规范化地址格式（校验和格式）
    const normalizedAddress = getAddress(address);
    const addressBytes = getBytes(normalizedAddress);

    if (addressBytes.length !== 20) {
        throw new Error(`H160 address must be 20 bytes, got ${addressBytes.length}`);
    }
    
    // 创建 32 字节数组并填充 0xEE
    const accountId = new Uint8Array(32);
    accountId.fill(0xEE);
    
    // 将 H160 地址的 20 字节放在前面
    accountId.set(addressBytes, 0);

    return accountId;
}

/**
 * 将 Substrate AccountId32 转换为 EVM H160 地址
 * 
 * 转换规则取决于账户类型：
 * 1. 如果是 EVM 派生的账户（后12字节为0xEE）：直接取前 20 字节
 * 2. 如果是原生 Substrate 账户：对 32 字节进行 Keccak256 哈希，取哈希结果的后 20 字节
 * 
 * @param accountId - 32 字节的 Substrate 账户 ID
 * @returns EVM H160 地址（0x 开头的校验和格式）
 * @throws 如果账户 ID 长度不是 32 字节则抛出错误
 */
export function accountId32ToH160(accountId: AccountId32): string {
    if (accountId.length !== 32) {
        throw new Error(`AccountId32 must be 32 bytes, got ${accountId.length}`);
    }
    
    if (isEthDerived(accountId)) {
        // 情况1：EVM 派生的账户，直接取前 20 字节
        const h160Bytes = accountId.slice(0, 20);
        const addressHex = '0x' + Buffer.from(h160Bytes).toString('hex');
        return getAddress(addressHex);
    } else {
        // 情况2：原生 Substrate 账户，使用 Keccak256 哈希
        const hash = keccak256(accountId);
        const hashBytes = getBytes(hash);
        // 取哈希结果的后 20 字节（从第 12 字节到第 32 字节）
        const h160Bytes = hashBytes.slice(12, 32);
        const addressHex = '0x' + Buffer.from(h160Bytes).toString('hex');
        return getAddress(addressHex);
    }
}

/**
 * 生成随机的 EVM 钱包地址
 * 使用 ethers.js 生成新的随机钱包
 * 
 * @returns EVM 地址字符串
 */
export function generateRandomEthersWallet(): string {
    const account = ethers.Wallet.createRandom();
    console.log("new account private key is ", account.privateKey);
    return account.address;
}

// 测试代码：打印 Alice 的 SS58 地址
// async function main() {
//     const alice = getAlice();
//     console.log("Alice ss58 address is ", convertPublicKeyToSs58(alice.publicKey));
// }

// main()