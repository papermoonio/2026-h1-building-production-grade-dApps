
import { ethers } from "ethers";
import { getWsProvider } from 'polkadot-api/ws-provider';
import { createClient } from 'polkadot-api';
import { devnet } from '@polkadot-api/descriptors';
import { accountId32ToH160, convertPublicKeyToSs58, getAlice, getRandomSubstrateKeypair, h160ToAccountId32 } from './accounts';
import { getApi, getProvider, setBalance } from './utils';
import { createERC20Asset, getERC20Balance } from './erc20';

async function getBalance_alice() {
    const api = getApi(true);
    const provider = getProvider(true);
    const alice = getAlice();
    const aliceSs58 = convertPublicKeyToSs58(alice.publicKey);
    console.log(`Alice SS58 address: ${aliceSs58}`);
    const balance = await api.query.System.Account.getValue(aliceSs58);
    console.log(`Substrate balance: ${balance.data.free}`);

    const address = accountId32ToH160(alice.publicKey);
    console.log(`Alice address: ${address}`);
    const eth = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(eth)} ETH`);
}

async function getBalance_alithe() {
    const api = getApi(true);
    const provider = getProvider(true);
    const privateKey = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133";
    const wallet = new ethers.Wallet(privateKey, provider);
    const eth = await provider.getBalance(wallet.address);
    console.log("eth is ", eth);
    console.log(`Balance of ${wallet.address}: ${ethers.formatEther(eth)} ETH`);

    const publicKey = h160ToAccountId32(wallet.address);
    const ss58Address = convertPublicKeyToSs58(publicKey);
    console.log(`SS58 address: ${ss58Address}`);

    const balance = await api.query.System.Account.getValue(ss58Address);
    console.log(`Substrate balance: ${balance.data.free}`);
}

async function getBalance3() {
    const api = getApi(true);
    const provider = getProvider(true);
    const keypair = getRandomSubstrateKeypair();
    const publicKey = keypair.publicKey;
    const ss58Address = convertPublicKeyToSs58(publicKey);
    console.log(`SS58 address: ${ss58Address}`);

    const balance = await api.query.System.Account.getValue(ss58Address);
    console.log(`Substrate balance:  ${balance.data.free}`);

    await setBalance(ss58Address, BigInt(10 ** 14)); // 100 ETH in raw units (10^20 / 10^18 = 100)
    await new Promise(resolve => setTimeout(resolve, 6000));

    const balance2 = await api.query.System.Account.getValue(ss58Address);
    console.log(` ${balance2.data.free}`);

    const address = accountId32ToH160(publicKey);
    console.log(`Address: ${address}`);
    const eth = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(eth)} ETH`);
}

// async function main() {
//     const provider = getProvider();
//     const address = "0x7072056494a815425895c743e50c37a1b232a00a"; // put your address here
//     const balance = await provider.getBalance(address);
//     console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);

//     await setBalance(address, BigInt(10 ** 12));
//     const balance2 = await provider.getBalance(address);
//     console.log(`Balance of ${address}: ${ethers.formatEther(balance2)} ETH`);
// }

// async function main() {
//     const api = getApi(true);
//     const provider = getProvider(true);
//     await createERC20Asset(api);
//     const alice = getAlice();
//     const address = accountId32ToH160(alice.publicKey);
//     await getERC20Balance(provider, address);
// }

async function testAddressConversionAndBalanceConsistency() {
    console.log("=== 测试地址转换和余额一致性 ===");
    
    // 1. 使用Alice账户
    const api = getApi(false); // 使用远程测试网络
    const provider = getProvider(false); // 使用远程测试网络
    const keypair = getAlice(); // 使用Alice账号
    const publicKey = keypair.publicKey;
    
    // 2. 转换地址格式
    const ss58Address = convertPublicKeyToSs58(publicKey);
    const ethAddress = accountId32ToH160(publicKey);
    const accountId32FromEth = h160ToAccountId32(ethAddress);
    const ss58FromEth = convertPublicKeyToSs58(accountId32FromEth);
    
    console.log(`SS58地址: ${ss58Address}`);
    console.log(`以太坊地址: ${ethAddress}`);
    console.log(`从以太坊地址转换回的SS58地址: ${ss58FromEth}`);
    
    // 3. 创建一个以太坊派生的AccountId32用于测试无损转换
    const ethDerivedAccountId32 = h160ToAccountId32(ethAddress);
    const ethDerivedSs58Address = convertPublicKeyToSs58(ethDerivedAccountId32);
    const ethAddressFromDerived = accountId32ToH160(ethDerivedAccountId32);
    
    console.log(`\n以太坊派生AccountId32测试:`);
    console.log(`以太坊派生SS58地址: ${ethDerivedSs58Address}`);
    console.log(`从以太坊派生SS58地址转换回的以太坊地址: ${ethAddressFromDerived}`);
    
    // 4. 检查地址转换是否一致
    console.log(`\n=== 地址转换一致性检查结果 ===`);
    
    // 对于非以太坊派生的随机账户，转换是单向的，无法无损转换
    if (ss58Address !== ss58FromEth) {
        console.log("\n非以太坊派生账户的SS58 ↔ H160转换是单向的（由于哈希操作），这是正常现象");
    }
    
    // 对于以太坊派生的账户，应该能进行无损转换
    if (ethAddress === ethAddressFromDerived) {
        console.log("\n以太坊派生账户的H160 ↔ SS58转换一致性检查通过");
    } else {
        console.log("\n以太坊派生账户的地址转换一致性检查失败");
        return;
    }
    
    // 4. 检查Substrate余额
    try {
        const substrateBalance = await api.query.System.Account.getValue(ss58Address);
        console.log(`\nSubstrate余额 (free): ${substrateBalance.data.free}`);
    } catch (error) {
        console.log("\n无法获取Substrate余额: ${error.message}");
    }
    
    // 5. 检查Ethereum余额
    try {
        const ethBalance = await provider.getBalance(ethAddress);
        console.log(`\n以太坊余额: ${ethers.formatEther(ethBalance)} ETH`);
    } catch (error) {
        console.log("\n无法获取以太坊余额: ${error.message}");
    }
    
    console.log("\n=== 测试完成 ===");
}

// 运行测试
testAddressConversionAndBalanceConsistency();

// getBalance_alice()

