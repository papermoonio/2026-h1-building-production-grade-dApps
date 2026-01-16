import { createPublicClient, defineChain, http, hexToBigInt, createWalletClient } from "viem"
import { ABI, BYTECODE } from "./erc20"
import { privateKeyToAccount } from "viem/accounts"

import dotenv from "dotenv"
dotenv.config()
export const localChain = (url: string) => defineChain({
    id: 420420417,
    name: 'Polkadot Hub TestNet',
    network: 'Polkadot Hub TestNet',
    nativeCurrency: {
        name: 'PAS',
        symbol: 'PAS',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [url],
        },
    },
    testnet: true,
})
async function main() {
    const url = "https://services.polkadothub-rpc.com/testnet"
    const publicClient = createPublicClient({ chain: localChain(url), transport: http() })
    const privateKey = dotenv.config().parsed?.PRIVATE_KEY
    if (!privateKey) {
        throw new Error("PRIVATE_KEY is not set")
    }
    const wallet = privateKeyToAccount(privateKey as `0x${string}`)

    const balance = await publicClient.getBalance({ address: wallet.address })
    console.log(`balance is ${balance}`)

    publicClient.watchBlockNumber({
        onBlockNumber: (blockNumber) => {
            console.log(`blockNumber is ${blockNumber}`)
        },
        onError: (error) => {
            console.error(`error is ${error}`)
        }
    })
}
main().catch((error) => {
    console.error(error)
})
