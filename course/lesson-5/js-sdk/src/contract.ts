import { ethers, Wallet, Contract } from "ethers"
import { ABI, BYTECODE } from "./erc20"
import { WalletClient } from "viem";

// deploy contract in ethers
export async function deployContract(abi: any[], bytecode: string, wallet: Wallet) {
    const successful_gas_limit = 1e14.toString();
    const factory = new ethers.ContractFactory(abi, bytecode, wallet)
    const contract = await factory.deploy(1000000000000,
        {
            gasLimit: successful_gas_limit,
        }
    )
    await contract.waitForDeployment()
    const contractAddress = contract.target.toString()
    return contractAddress
}

export async function listenEvent(contract: Contract) {
    // listening
    contract.on("Event", (event) => {
        console.log(event)
    })

    // filter
    const filter = contract.filters.Transfer()

    contract.on(filter, (event) => {
        console.log(event)
    })

    // history, between blocks
    const events = await contract.queryFilter(filter, 10000, 20000)
    events.forEach(event => {
        console.log(`${event}`)
    });
}

export async function getContract(address: string, provider: ethers.Provider, wallet: Wallet) {
    // Create a contract instance with the provider
    const contract = new Contract(address, ABI, provider)
    // which one is correct
    contract.connect(provider)
    contract.connect(wallet)
    return contract
}

export async function deployViemContract(client: WalletClient) {
}