import { ethers, Provider, Wallet } from 'ethers';
import dotenv from 'dotenv';
import { ASSET_HUB, LOCAL_PROVIDER } from './config';

import { PublicClient, createPublicClient, createWalletClient, defineChain, http, } from "viem";
import { privateKeyToAccount } from "viem/accounts";
// Load environment variables from .env file
dotenv.config();

export const assetHubChain = defineChain({
    id: 420420421,
    name: 'Asset-Hub Westend Testnet',
    network: 'Asset-Hub Westend Testnet',
    nativeCurrency: {
        name: 'WND',
        symbol: 'WND',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [ASSET_HUB],
        },
    },
    testnet: true,
})

export const localChain = defineChain({
    id: 31337,
    name: 'Asset-Hub Westend Testnet',
    network: 'Asset-Hub Westend Testnet',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [LOCAL_PROVIDER],
        },
    },
    testnet: true,
})

export function getEtherWallet(provider: Provider) {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("Private key is not defined in the environment variables.");
    }

    // Create a wallet from the private key
    const wallet = new Wallet(privateKey, provider);

    // Log the wallet address
    console.log("Wallet Address:", wallet.address);

    return wallet;
}

export function getEtherClient() {
    // Create a provider using the provider URL
    const provider = new ethers.JsonRpcProvider(LOCAL_PROVIDER);
    return provider;
}

// public for read
export async function getViemClient() {
    const client = await createPublicClient({ chain: localChain, transport: http(), })
    return client

}

// client with wallet for transaction
export async function getViemWalletClient() {
    const privateKey = process.env.PRIVATE_KEY
    if (privateKey === undefined) {
        throw new Error("private key not defined in env")
    }

    const privateKeyNoPrefix = privateKey.replace('0x', '');
    const account = privateKeyToAccount(`0x${privateKeyNoPrefix}`);
    const client = await createWalletClient({ account, chain: localChain, transport: http(), })
    return client
}