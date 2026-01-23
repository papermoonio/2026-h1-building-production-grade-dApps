import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@parity/hardhat-polkadot";
import * as dotenv from "dotenv";
dotenv.config();

const usePolkaVM = process.env.USE_POLKAVM === "true";

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  resolc: {
    compilerSource: "binary",
    settings: {
      compilerPath: "./bin/resolc-universal-apple-darwin",
    },
  },
  mocha: {
    timeout: 100000
  },
  networks: {
    hardhat: usePolkaVM
      ? {
          polkavm: true,
          nodeConfig: {
            nodeBinaryPath: "../substrate-node",
            rpcPort: 8000,
            dev: true,
          },
          adapterConfig: {
            adapterBinaryPath: "../eth-rpc",
            dev: true,
          },
        }
      : {},
    local: {
      url: 'http://127.0.0.1:8545',
      accounts: [
          "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
          '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702100',
      ],
    },
    ah: {
      polkavm: true,
      url: "https://westend-asset-hub-eth-rpc.polkadot.io",
      accounts: [
        process.env.LOCAL_PRIV_KEY ??
          "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
        process.env.AH_PRIV_KEY ?? '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702100',
      ],
    },
  }
};

export default config;
