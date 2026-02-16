import { ethers } from "ethers";

async function main() {
    // faucet https://faucet.polkadot.io/ Paseo AssetHub
    const URL = "https://testnet-passet-hub-eth-rpc.polkadot.io";
    const provider = new ethers.JsonRpcProvider(URL);
    const address = "0xB9E24207CE8e801dfb168FC4Aa7C62a7a6796f6D"; // put your address here
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(balance)} pas`);
}

main();