import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Local testnet running on port 8545
      accounts: [process.env.LOCAL_PRIVATE_KEY || ""], // Private key for local testnet
    },
    passetHub: {
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io", // Polkadot Test Hub RPC
      accounts: [process.env.POLKADOT_PRIVATE_KEY || ""], // Private key for Polkadot Test Hub
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;