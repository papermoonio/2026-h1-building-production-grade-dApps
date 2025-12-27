import { ethers } from "ethers";

async function main() {
    // faucet https://faucet.polkadot.io/ Paseo AssetHub
    const URL = "https://testnet-passet-hub-eth-rpc.polkadot.io";
    // const URL = "https://westend-asset-hub-eth-rpc.polkadot.io/";
    const provider = new ethers.JsonRpcProvider(URL);
    const address = "0x8185caddfb857a4c0c0f7af6c7d518ce41209370"; // put your address here
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(balance)} PAS`);
}

main();
