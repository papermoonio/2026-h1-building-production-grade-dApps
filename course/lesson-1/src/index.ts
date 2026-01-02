import { ethers } from "ethers";

async function main() {
    // faucet https://faucet.polkadot.io/ Paseo AssetHub
    const URL = "https://services.polkadothub-rpc.com/testnet";
    const provider = new ethers.JsonRpcProvider(URL);
    const address = "0x"; // put your address here
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);
}

main();