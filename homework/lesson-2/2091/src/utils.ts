/**
 * 工具函数模块
 * 提供 EVM RPC Provider 和 Substrate API 客户端的创建和管理
 */

import { ethers } from "ethers";
import { getWsProvider } from 'polkadot-api/ws-provider/node';
import { createClient, TypedApi } from 'polkadot-api';
import { devnet } from '@polkadot-api/descriptors';
import { convertPublicKeyToSs58, getAlice } from './accounts';
import { getPolkadotSigner } from "polkadot-api/signer"

// 本地节点的 EVM RPC 端点（用于 eth_* 调用）
const LOCAL_URL = "http://localhost:8545";

// 本地节点的 WebSocket 端点（用于 Substrate API 调用）
const LOCAL_WS_URL = "ws://localhost:9944";

/**
 * 获取 EVM JSON-RPC Provider
 * 用于与 EVM 兼容层交互，执行 eth_getBalance、eth_call 等操作
 * 
 * @param isLocal - 是否使用本地节点（目前总是返回本地 provider）
 * @returns ethers.js 的 JsonRpcProvider 实例
 */
export function getProvider(isLocal: boolean): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(LOCAL_URL);
}

/**
 * 获取 Substrate API 客户端
 * 用于与 Substrate 链交互，执行查询和交易
 * 
 * @param isLocal - 是否使用本地节点（目前总是返回本地 API）
 * @returns TypedApi 实例，提供类型安全的 Substrate API
 */
export function getApi(isLocal: boolean): TypedApi<typeof devnet> {
    return createClient(getWsProvider(LOCAL_WS_URL)).getTypedApi(devnet);
}

/**
 * 设置账户余额（需要 Sudo 权限）
 * 使用 Sudo 模块的 force_set_balance 功能强制设置账户余额
 * 注意：此功能仅在开发环境中可用，生产环境无 Sudo 模块
 * 
 * @param ss58Address - 目标账户的 SS58 格式地址
 * @param balance - 要设置的余额（以 Planck 为单位，1 ETH = 10^18 Planck）
 */
export async function setBalance(ss58Address: string, balance: bigint) {
    const api = getApi(true);
    const alice = getAlice();
    
    // 创建 Polkadot 签名器（使用 Alice 账户，Alice 在开发链中拥有 Sudo 权限）
    const polkadotSigner = getPolkadotSigner(
        alice.publicKey,
        "Sr25519",
        alice.sign,
    )

    // 注意：以下代码已注释，因为 force_set_balance 调用方式可能因链的配置而异
    // 如需使用，请根据实际链的配置调整
    
    // 创建设置余额的内部调用
    // const inner_call = api.tx.Balances.force_set_balance({ who: { type: "Id", value: ss58Address }, new_free: balance });
    
    // 使用 Sudo 模块包装调用
    // const tx = api.tx.Sudo.sudo({ call: inner_call.decodedCall });
    
    // 签名并提交交易
    // const hash = await tx.signAndSubmit(polkadotSigner);
    // console.log(`Transaction hash: ${hash}`);
}