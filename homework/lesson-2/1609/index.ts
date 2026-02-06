import { ethers } from "ethers";
import { 
    accountId32ToH160, 
    convertPublicKeyToSs58, 
    getAlice, 
    getRandomSubstrateKeypair, 
    h160ToAccountId32 
} from './accounts';
import { getApi, getProvider, setBalance } from './utils';
import { testAllPrecompiles } from './precompile';

/**
 * Test 1: Alice account - address conversion and balance consistency
 * 测试1：Alice账户 - 地址转换和同一账户不同格式地址的余额一致性
 */
async function testAliceAddressConversion() {
    console.log("\n========== Test 1: Alice Address Conversion ==========\n");
    
    const api = getApi(true);
    const provider = getProvider(true);
    const alice = getAlice();
    
    // Convert to SS58 address
    const aliceSs58 = convertPublicKeyToSs58(alice.publicKey);
    console.log(`Alice SS58 address: ${aliceSs58}`);
    
    // Get balance in Substrate format
    const substrateBalance = await api.query.System.Account.getValue(aliceSs58);
    console.log(`Substrate balance: ${substrateBalance.data.free}`);
    
    // Convert to H160 address
    const aliceH160 = accountId32ToH160(alice.publicKey);
    console.log(`Alice H160 address: ${aliceH160}`);
    
    // Get balance in EVM format
    const evmBalance = await provider.getBalance(aliceH160);
    console.log(`EVM balance: ${ethers.formatEther(evmBalance)} ETH`);
    
    // Convert back from H160 to AccountId32
    const convertedAccountId = h160ToAccountId32(aliceH160);
    const convertedSs58 = convertPublicKeyToSs58(convertedAccountId);
    console.log(`\nAddress conversion verification:`);
    console.log(`Original SS58: ${aliceSs58}`);
    console.log(`Converted back SS58: ${convertedSs58}`);
    console.log(`Match: ${aliceSs58 === convertedSs58 ? "✓ YES" : "✗ NO"}`);
}

/**
 * Test 2: Random account - create, set balance, and verify consistency
 * 测试2：随机账户 - 创建、设置余额并验证一致性
 */
async function testRandomAccountBalanceConsistency() {
    console.log("\n========== Test 2: Random Account Balance Consistency ==========\n");
    
    const api = getApi(true);
    const provider = getProvider(true);
    
    // Generate random Substrate keypair
    const keypair = getRandomSubstrateKeypair();
    const ss58Address = convertPublicKeyToSs58(keypair.publicKey);
    console.log(`Generated SS58 address: ${ss58Address}`);
    
    // Convert to H160 address
    const h160Address = accountId32ToH160(keypair.publicKey);
    console.log(`Corresponding H160 address: ${h160Address}`);
    
    // Set balance (100 ETH = 10^20 in raw units, since 1 ETH = 10^18)
    const balanceToSet = BigInt(10) ** BigInt(20); // 100 ETH
    console.log(`\nSetting balance to ${ethers.formatEther(balanceToSet)} ETH...`);
    
    await setBalance(ss58Address, balanceToSet);
    
    // Wait for transaction to be confirmed
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Check balance via Substrate API
    const substrateBalance = await api.query.System.Account.getValue(ss58Address);
    console.log(`Substrate balance: ${substrateBalance.data.free}`);
    
    // Check balance via EVM provider
    const evmBalance = await provider.getBalance(h160Address);
    console.log(`EVM balance: ${ethers.formatEther(evmBalance)} ETH`);
    
    // Verify they match
    console.log(`\nBalance consistency check:`);
    console.log(`Substrate: ${substrateBalance.data.free}`);
    console.log(`EVM: ${evmBalance}`);
    console.log(`Match: ${substrateBalance.data.free === evmBalance ? "✓ YES" : "✗ NO"}`);
}

/**
 * Test 3: EVM-derived address (from private key)
 * 测试3：EVM派生地址（从私钥创建）
 */
async function testEVMDerivedAddress() {
    console.log("\n========== Test 3: EVM-Derived Address ==========\n");
    
    const api = getApi(true);
    const provider = getProvider(true);
    
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom(provider);
    console.log(`Created EVM wallet: ${wallet.address}`);
    console.log(`Private key: ${wallet.privateKey}`);
    
    // Convert H160 to AccountId32
    const accountId32 = h160ToAccountId32(wallet.address);
    const ss58Address = convertPublicKeyToSs58(accountId32);
    console.log(`Corresponding SS58 address: ${ss58Address}`);
    
    // Get balance
    const evmBalance = await provider.getBalance(wallet.address);
    console.log(`EVM balance: ${ethers.formatEther(evmBalance)} ETH`);
    
    const substrateBalance = await api.query.System.Account.getValue(ss58Address);
    console.log(`Substrate balance: ${substrateBalance.data.free}`);
    
    console.log(`\nBalance consistency: ${evmBalance === substrateBalance.data.free ? "✓ YES" : "✗ NO"}`);
}

/**
 * Main test suite
 */
async function main() {
    try {
        // Test address conversion and balance consistency
        await testAliceAddressConversion();
        await testRandomAccountBalanceConsistency();
        await testEVMDerivedAddress();
        
        // Test precompile calls
        await testAllPrecompiles(true);
        
        console.log("\n========== All Tests Completed ==========\n");
    } catch (error) {
        console.error("Error in main test suite:", error);
    }
}

main();
