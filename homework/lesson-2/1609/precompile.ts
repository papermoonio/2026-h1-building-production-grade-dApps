import { ethers } from "ethers"
import { getProvider } from "./utils";

// Precompile addresses
const IDENTITY_PRECOMPILE = "0x0000000000000000000000000000000000000004"
const HASH_PRECOMPILE = "0x0000000000000000000000000000000000000002"
const OTHER_PRECOMPILE = "0x0000000000000000000000000000000000000003"

/**
 * Call identity precompile
 * This precompile echoes back the input data
 */
export async function callIdentity(provider: ethers.JsonRpcProvider) {
    try {
        const result = await provider.call({
            to: IDENTITY_PRECOMPILE,
            data: "0x12345678"
        });
        console.log("=== Identity Precompile ===");
        console.log("Input:", "0x12345678");
        console.log("Output:", result);
        console.log("");
        return result;
    } catch (error) {
        console.error("Error calling identity precompile:", error);
    }
}

/**
 * Call hash precompile
 * This precompile computes hash of input data
 */
export async function callHash(provider: ethers.JsonRpcProvider) {
    try {
        const result = await provider.call({
            to: HASH_PRECOMPILE,
            data: "0x12345678"
        });
        console.log("=== Hash Precompile ===");
        console.log("Input:", "0x12345678");
        console.log("Output:", result);
        console.log("");
        return result;
    } catch (error) {
        console.error("Error calling hash precompile:", error);
    }
}

/**
 * Call other precompile (ECMul)
 */
export async function callECMul(provider: ethers.JsonRpcProvider) {
    try {
        const result = await provider.call({
            to: OTHER_PRECOMPILE,
            data: "0x12345678"
        });
        console.log("=== EC Multiply Precompile ===");
        console.log("Input:", "0x12345678");
        console.log("Output:", result);
        console.log("");
        return result;
    } catch (error) {
        console.error("Error calling EC multiply precompile:", error);
    }
}

/**
 * Test all precompiles
 */
export async function testAllPrecompiles(isLocal: boolean = true) {
    const provider = getProvider(isLocal);
    
    const network = isLocal ? "Local Devnet" : "Hub Testnet";
    console.log(`\n========== Testing Precompiles on ${network} ==========\n`);

    await callIdentity(provider);
    await callHash(provider);
    await callECMul(provider);
}
