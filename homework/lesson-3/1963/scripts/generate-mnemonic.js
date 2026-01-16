import { ethers } from "ethers";

// Generate a new random mnemonic
const wallet = ethers.Wallet.createRandom();
const mnemonic = wallet.mnemonic.phrase;

console.log("=".repeat(60));
console.log("NEW MNEMONIC GENERATED");
console.log("=".repeat(60));
console.log("\n⚠️  KEEP THIS SECRET AND SAFE!");
console.log("⚠️  Anyone with this mnemonic can control your account!");
console.log("\nMnemonic:");
console.log(mnemonic);
console.log("\nFirst account address:", wallet.address);
console.log("\nTo use this mnemonic:");
console.log(`export MNEMONIC="${mnemonic}"`);
console.log("\n" + "=".repeat(60));
