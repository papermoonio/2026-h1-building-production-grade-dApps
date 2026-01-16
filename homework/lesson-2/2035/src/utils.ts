import { ethers } from "ethers";
import { getWsProvider } from 'polkadot-api/ws-provider';
import { createClient, TypedApi } from 'polkadot-api';
import { hub } from '@polkadot-api/descriptors';

// Passet Hub testnet configuration (smart contracts testing chain)
export const HUB_URL = "https://testnet-passet-hub-eth-rpc.polkadot.io";
export const HUB_WS_URL = "wss://passet-hub-paseo.ibp.network";

/**
 * Get ethers JSON-RPC provider for EVM queries
 */
export function getProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(HUB_URL);
}

/**
 * Get Polkadot API client for Substrate queries
 */
export function getApi(): TypedApi<typeof hub> {
    return createClient(getWsProvider(HUB_WS_URL)).getTypedApi(hub);
}
