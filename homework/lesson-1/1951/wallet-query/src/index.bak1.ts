import { ethers, getAddress } from "ethers";
import { ApiPromise, WsProvider } from "@polkadot/api";

// --- CONFIGURATION ---
// Asset Hub Revive (EVM layer)
const ETH_RPC_URL = "https://testnet-passet-hub-eth-rpc.polkadot.io";
// Asset Hub Substrate (Native layer)
const SUBSTRATE_RPC_URL = "wss://paseo-asset-hub-rpc.polkadot.io";

async function queryBalances(addresses: string[]) {
    console.log("🚀 Initializing Multi-Wallet Balance Check...");

    // 1. Setup Providers
    // We cast the provider to 'any' to bypass the TS2375 exactOptionalPropertyTypes error
    const ethProvider = new ethers.JsonRpcProvider(ETH_RPC_URL);
    const wsProvider = new WsProvider(SUBSTRATE_RPC_URL);
    
    // Create the Polkadot API instance
    const polkadotApi = await ApiPromise.create({ 
        provider: wsProvider as any 
    });

    console.log("--------------------------------------------------");

    for (const rawAddr of addresses) {
        const addr = rawAddr.trim();

        // --- CASE 1: METAMASK / EVM ADDRESS (0x...) ---
        if (addr.startsWith("0x") && addr.length === 42) {
            try {
                // Normalizing prevents the "network does not support ENS" crash
                const cleanAddress = getAddress(addr);
                const balance = await ethProvider.getBalance(cleanAddress);
                
                console.log(`[MetaMask]  ${cleanAddress}`);
                console.log(`            Balance: ${ethers.formatEther(balance)} PAS (18 decimals)`);
            } catch (e: any) {
                console.error(`❌ EVM Error for ${addr}:`, e.message);
            }
        } 
        
        // --- CASE 2: SUBWALLET / TALISMAN / NATIVE (5...) ---
        else if (addr.length >= 47) {
            try {
                // Use optional chaining and type casting to avoid TS18048 / TS2722
                const systemPallet = (polkadotApi.query.system as any);
                
                if (systemPallet && typeof systemPallet.account === 'function') {
                    const { data: balance }: any = await systemPallet.account(addr);
                    
                    // Native Asset Hub tokens (PAS/WND) use 12 decimals
                    const freeBalance = BigInt(balance.free.toString());
                    const formatted = Number(freeBalance) / 10 ** 12;

                    console.log(`[Substrate] ${addr}`);
                    console.log(`            Balance: ${formatted.toFixed(4)} PAS (12 decimals)`);
                }
            } catch (e: any) {
                console.error(`❌ Substrate Error for ${addr}:`, e.message);
            }
        } 
        
        else {
            console.warn(`⚠️ Skipping Unknown Format: ${addr}`);
        }
        console.log("--------------------------------------------------");
    }

    // Clean up connections
    await polkadotApi.disconnect();
}

// --- INPUT YOUR WALLETS HERE ---
const myWallets = [
    "0xDAA5A34D500799935C065282D24853e467D0497c", // Replace with your MetaMask address
    "5DTestUPts3kjeXSTMyerHihn1uwMfLj8vU8sqF7qYrFabHE"  // Replace with your Substrate address
];

queryBalances(myWallets).catch((err) => {
    console.error("Fatal Execution Error:", err);
});
