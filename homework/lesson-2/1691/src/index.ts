import { ethers } from "ethers";
import { getWsProvider } from 'polkadot-api/ws-provider';
import { createClient } from 'polkadot-api';
import { devnet } from '@polkadot-api/descriptors';
import { accountId32ToH160, convertPublicKeyToSs58, getAlice, getRandomSubstrateKeypair, h160ToAccountId32 } from './accounts';
import { getApi, getProvider, setBalance } from './utils';
import { createERC20Asset, getERC20Balance } from './erc20';

async function getBalance_alice() {
    console.log("\n// getBalance_alice() //")
    const api = getApi(false);
    const provider = getProvider(false);
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
    console.log("\n// getBalance_alithe() //")
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
    console.log("\n// getBalance3() //")
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

async function main() {
    await getBalance_alice()
    await getBalance_alithe()
    await getBalance3()
}

main()