import { ethers } from "ethers";
import { h160ToAccountId32, convertPublicKeyToSs58 } from './accounts';
import { getApi, getProvider, HUB_URL, HUB_WS_URL } from './utils';

/**
 * Main function: Test address conversion and balance consistency
 * This demonstrates the mapping between EVM (H160) and Substrate (AccountId32) addresses
 */
async function main() {
    console.log("=== Lesson 2: Address Conversion & Balance Test ===");
    console.log(`EVM RPC: ${HUB_URL}`);
    console.log(`Substrate WS: ${HUB_WS_URL}`);
    console.log("");

    const api = getApi();
    const provider = getProvider();

    // Your EVM address
    const evmAddress = "0xa31F103CE4b7e0cDf820f3d3f3a5A7A5fC60833f";
    // const evmAddress = "0x8e40E4038F481680fC3D2E858002e4E0559e2c5e";

    console.log(`1. [EVM] Target address: ${evmAddress}`);

    // Query EVM balance
    const ethBalance = await provider.getBalance(evmAddress);
    console.log(`   [EVM] Balance: ${ethers.formatEther(ethBalance)} ETH (${ethBalance} wei)`);

    // Convert H160 to AccountId32
    const accountId = h160ToAccountId32(evmAddress);
    console.log(`\n2. [Convert] AccountId32 bytes: ${Buffer.from(accountId).toString('hex')}`);

    // Convert to SS58 format
    const ss58Address = convertPublicKeyToSs58(accountId);
    console.log(`   [Convert] SS58 address: ${ss58Address}`);

    // Query Substrate balance
    try {
        console.log(`\n3. [Substrate] Querying balance...`);
        const accountInfo = await api.query.System.Account.getValue(ss58Address);
        const substrateFreeBalance = accountInfo.data.free;

        console.log(`   [Substrate] Free Balance: ${substrateFreeBalance}`);

        // Compare balances
        console.log(`\n4. [Verify] Result comparison:`);
        if (ethBalance.toString() === substrateFreeBalance.toString()) {
            console.log("   [OK] EVM balance equals Substrate balance!");
        } else {
            console.log(`   [INFO] EVM balance:       ${ethBalance}`);
            console.log(`   [INFO] Substrate balance: ${substrateFreeBalance}`);
            console.log("   (Difference may be due to gas fees, reserved balance, or address mapping)");
        }
    } catch (e) {
        console.error("   [ERROR] Failed to query Substrate account:", e);
    }
}

/**
 * Precompile test: Call the SHA256 precompile (0x02)
 *
 * EVM 预编译合约是部署在固定地址的特殊合约，用原生代码实现，执行效率更高。
 *
 * 常用 Precompile 地址:
 * - 0x01: ecRecover - ECDSA 签名恢复，用于验证签名
 * - 0x02: SHA256   - SHA-256 哈希算法
 * - 0x03: RIPEMD160 - RIPEMD-160 哈希算法
 * - 0x04: Identity - 数据复制（输入=输出）
 * - 0x05: ModExp   - 大数模幂运算，用于 RSA 等密码学
 * - 0x06: ecAdd    - 椭圆曲线点加法
 * - 0x07: ecMul    - 椭圆曲线点乘法
 * - 0x08: ecPairing - 椭圆曲线配对检查
 * - 0x09: Blake2F  - Blake2 压缩函数
 *
 * 为什么要用 Precompile?
 * 1. 性能: 用 Rust/C++ 原生实现，比 Solidity 快几个数量级
 * 2. Gas 费: 固定且低廉，不按操作码计费
 * 3. 安全性: 经过严格审计的标准实现
 */
async function precompile() {
    console.log("=== Lesson 2: Precompile Call Test (SHA256) ===\n");

    const provider = getProvider();

    // SHA256 precompile 地址
    const sha256Precompile = "0x0000000000000000000000000000000000000002";

    // 要哈希的原始数据
    const message = "Hello Polkadot!";

    // 将字符串转换为字节数组，再转为十六进制
    const inputBytes = ethers.toUtf8Bytes(message);
    const inputHex = ethers.hexlify(inputBytes);

    console.log(`1. Precompile: SHA256 (${sha256Precompile})`);
    console.log(`2. Input message: "${message}"`);
    console.log(`3. Input bytes (hex): ${inputHex}`);

    try {
        // 调用 SHA256 precompile
        const hash = await provider.call({
            to: sha256Precompile,
            data: inputHex
        });

        console.log(`4. SHA256 hash: ${hash}`);

        // 使用 ethers.js 本地计算 SHA256 验证结果
        const localHash = ethers.sha256(inputBytes);
        console.log(`5. Local SHA256: ${localHash}`);

        // 验证结果是否一致
        if (hash.toLowerCase() === localHash.toLowerCase()) {
            console.log("\n[OK] Precompile hash matches local");
        } else {
            console.log("\n[WARN] Hash mismatch");
        }

    } catch (error) {
        console.error("\n[ERROR] Call failed:", error);
    }
}

// Run both tests
async function runAll() {
    await main();
    await precompile();
    process.exit(0);
}

runAll().catch(console.error);
