require("@nomicfoundation/hardhat-toolbox");
require("@parity/hardhat-polkadot");
require("dotenv").config(); // Load environment variables
require("./tasks/polkavm-evm"); // Load custom EVM mode tasks

const usePolkaNode = process.env.POLKA_NODE === "true";
const useREVM = process.env.REVM === "true";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london", // Use London as the EVM version which should match PolkaVM
      // Some PolkaVM implementations might need specific settings
      viaIR: false, // Disable compilation via IR which might cause issues with some EVM compat layers
    },
  },
  // Conditionally configure resolc for PolkaVM
  ...(!useREVM && usePolkaNode ? {
    resolc: {
      compilerSource: "binary",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "london",
        compilerPath: "./bin/resolc",
        standardJson: true,
      },
    }
  } : {}),
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 100000000,
  },
  networks: {
    hardhat: usePolkaNode && !useREVM
      ? {
          polkavm: true,
          nodeConfig: {
            nodeBinaryPath: "./bin/substrate-node",
            rpcPort: 8000,
            dev: true,
          },
          adapterConfig: {
            adapterBinaryPath: "./bin/eth-rpc",
            dev: true,
          },
        }
      : {}, // Standard hardhat network when not using PolkaVM
    // EVM mode: connect to PVM node via ETH RPC
    pvmevm: {
      url: "http://127.0.0.1:8545",
      accounts: [
        process.env.LOCAL_PRIVATE_KEY ||
        "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
      ],
      timeout: 60000,
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 2,
      hardfork: "london",
    },
    localNode: {
      // When REVM is enabled, don't use polkavm flag to compile with solc instead of resolc
      ...(useREVM && usePolkaNode ? {} : { polkavm: true }),
      url: `http://127.0.0.1:8545`,
      chainId: 420420420, // The actual chain ID from the PolkaVM node
      accounts: [
        process.env.LOCAL_PRIVATE_KEY ||
        "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"
      ],
      timeout: 60000,
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 2,
      hardfork: "london", // Ensure compatible EVM hardfork
    },
    passetHub: {
      // For passetHub, conditionally use polkavm depending on REVM setting
      ...(useREVM ? {} : { polkavm: true }),
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io", // Polkadot Test Hub RPC
      chainId: 420420422, // Explicit chain ID from the testnet RPC
      accounts: process.env.POLKADOT_PRIVATE_KEY ? [process.env.POLKADOT_PRIVATE_KEY] : [],
      timeout: 60000,
      gas: 6000000,
      gasPrice: 1000000000, // 1 gwei - legacy tx pricing to avoid EIP-1559 incompatibilities
      hardfork: "london",
    },
  },
};