import { ethers } from "ethers"
import { getApi, getProvider } from "./utils";

const identity_precompile = "0x0000000000000000000000000000000000000004"
const hash_precompile = "0x0000000000000000000000000000000000000002"

const other_precompile = "0x0000000000000000000000000000000000000003"

export async function callIdentity(provider: ethers.JsonRpcProvider) {
    const result = await provider.call({
        to: identity_precompile,
        data: "0x12345678"
    });
    console.log("Identity Input:", "0x12345678");
    console.log("Identity Result:", result);
}

export async function callHash(provider: ethers.JsonRpcProvider) {
    const result = await provider.call({
        to: hash_precompile,
        data: "0x12345678"
    });

    console.log("Hash Input:", "0x12345678");
    console.log("Hash Result:", result);
}

export async function callOther(provider: ethers.JsonRpcProvider) {
    const result = await provider.call({
        to: other_precompile,
        data: "0x12345678"
    });

    console.log("Other Input:", "0x12345678");
    console.log("Other Result:", result);
}

async function main() {
    console.log("Devnet Test >>>>>>>>>>>>>>>>>>>>>>>>>>>")
    const isDevnet = false;
    const provider = getProvider(isDevnet);
    await callIdentity(provider);
    await callHash(provider);
    await callOther(provider);

    console.log("Local Test >>>>>>>>>>>>>>>>>>>>>>>>>>>")
    const localprovider = getProvider(true);
    await callIdentity(localprovider);
    await callHash(localprovider);
    await callOther(localprovider);
}

main();