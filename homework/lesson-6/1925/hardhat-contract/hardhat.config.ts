import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

import { configVariable, defineConfig } from "hardhat/config";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.URL || "https://rpc.sepolia.org", // 给个默认 URL 避免校验失败
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    polkadotTestNet: {
      type: "http",
      chainType: "l1",
      url: "https://services.polkadothub-rpc.com/testnet",
      // 如果 PRIVATE_KEY 为空，则传递空数组，这样 Hardhat 不会报错，只会在部署时提醒
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000,
    },
  },
  chainDescriptors: {
    // 这里的 420420417 是波卡测试网的 Chain ID
    420420417: {
      name: "PolkadotTestNet",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://polkadot.testnet.routescan.io",
          // 核心点：将你提供的完整 URL 简化为基础 API 地址
          apiUrl: "https://api.routescan.io/v2/network/testnet/evm/420420417/etherscan/api",
        },
      },
    },
  },
  verify: {
    blockscout: {
      enabled: false, // 禁用 Blockscout 验证以消除 HHE80027 报错
    },
    etherscan: {
      apiKey: "YOUR_ETHERSCAN_API_KEY",
    },
  },
});
