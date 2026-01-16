import { ethers } from "ethers"
import { ASSET_HUB } from "./config";

async function subscribeToBalanceChanges(provider: ethers.Provider, address: string) {
    provider.on("block", async (blockNumber) => {
        console.log(`Block Number: ${blockNumber} ETH`);

        // const balance = await provider.getBalance(address);
        // const balanceEth = ethers.formatEther(balance);
        // console.log(`Block Number: ${blockNumber}, Address: ${address}, Balance: ${balanceEth} ETH`);
    });
}

const provider = new ethers.JsonRpcProvider(ASSET_HUB);
subscribeToBalanceChanges(provider, "")