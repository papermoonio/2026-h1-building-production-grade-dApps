import { ethers } from "ethers";
import { accountId32ToH160, convertPublicKeyToSs58, h160ToAccountId32 } from './accounts';
import { getApi, getProvider, HUB_URL, HUB_WS_URL } from './utils';

async function main() {
    console.log(HUB_URL);
    console.log(HUB_WS_URL);
    console.log("start 2119 lesson-2");
    const api = getApi(false);
    const provider = getProvider(false);
    const address = "0x8e40E4038F481680fC3D2E858002e4E0559e2c5e"; // put your address here
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);

    const publicKey = h160ToAccountId32(address);
    console.log(`publicKey: ${publicKey}`);
    const ss58Address = convertPublicKeyToSs58(publicKey);
    console.log(`SS58 address: ${ss58Address}`);

    const balance3 = await api.query.System.Account.getValue(ss58Address);
    console.log(`Substrate balance:  ${balance3.data.free}`);
    console.log("end");
}

async function precompile() {
    console.log("start 2119 lesson-2");
    const provider = getProvider(false);
    const result = await provider.call({ to: "0x0000000000000000000000000000000000000004", data: "0x12312388" });
    console.log("data: ", result);
}

 main();
//precompile();
