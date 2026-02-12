import { ethers } from "ethers";

async function main() {
    // faucet https://faucet.polkadot.io/ Paseo AssetHub
    // const URL = "https://services.polkadothub-rpc.com/testnet";

    const URL = "https://testnet-passet-hub-eth-rpc.polkadot.io";

    const provider = new ethers.JsonRpcProvider(URL);
    const address = "0xa4eC57E1f6EE1b6a20482877B92c41ee03944cF3"; // put your address here
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(balance)} PAS`);
}

main();