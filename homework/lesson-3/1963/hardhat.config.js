import "@nomicfoundation/hardhat-toolbox";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 420420420,
    },
    testhub: {
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      chainId: 420420422, // Polkadot Hub TestNet (Paseo) Chain ID
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`]
        : process.env.MNEMONIC && process.env.MNEMONIC.trim().split(/\s+/).length >= 12
        ? {
            mnemonic: process.env.MNEMONIC.trim(),
          }
        : [], // Empty array if no private key or mnemonic provided
    },
  },
});