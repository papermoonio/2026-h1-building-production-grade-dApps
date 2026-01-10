import { ethers } from "ethers";

const privateKey = process.env.PRIVATE_KEY || "7f60f585fa3cce8d6f98ae87657f3361ecf46f96092b7c79859069c196a42409";

// Ensure private key has 0x prefix
const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

try {
  const wallet = new ethers.Wallet(formattedKey);
  console.log("=".repeat(60));
  console.log("PRIVATE KEY VERIFICATION");
  console.log("=".repeat(60));
  console.log("\n✅ Private key is valid!");
  console.log("\nAccount Address:", wallet.address);
  console.log("\nTo use this private key for deployment:");
  console.log(`export PRIVATE_KEY="${privateKey}"`);
  console.log("\nThen run:");
  console.log("npm run deploy:testhub");
  console.log("\n" + "=".repeat(60));
  console.log("\n⚠️  SECURITY WARNING:");
  console.log("⚠️  Never commit your private key to version control!");
  console.log("⚠️  Never share your private key with anyone!");
  console.log("⚠️  Keep it in environment variables only!");
  console.log("=".repeat(60));
} catch (error) {
  console.error("❌ Invalid private key:", error.message);
  process.exit(1);
}
