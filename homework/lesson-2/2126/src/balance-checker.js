import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';
import { evmToSubstrateAddress, substrateToEvmAddress } from './address-converter.js';

const EVM_RPC = 'http://localhost:8545';
const SUBSTRATE_RPC = 'ws://localhost:9944';

let substrateApi = null;

export function getProvider() {
  return new ethers.JsonRpcProvider(EVM_RPC);
}

export async function getApi() {
  if (!substrateApi) {
    const wsProvider = new WsProvider(SUBSTRATE_RPC);
    substrateApi = await ApiPromise.create({ provider: wsProvider });
  }
  return substrateApi;
}

export async function getBalanceEvm(address) {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  const balanceString = balance.toString();
  return {
    address,
    balance: balanceString,
    balanceFormatted: ethers.formatEther(balanceString),
    unit: 'ETH'
  };
}

export async function getBalanceSubstrate(address) {
  const api = await getApi();
  let substrateAddress = address;
  
  if (address.startsWith('0x') && address.length === 42) {
    substrateAddress = evmToSubstrateAddress(address);
  }
  
  const balance = await api.query.system.account(substrateAddress);
  const data = balance.data;
  const freeBalance = data.free;
  const balanceString = freeBalance.toString();
  return {
    address: substrateAddress,
    balance: balanceString,
    balanceFormatted: ethers.formatEther(balanceString),
    unit: 'ETH'
  };
}

export async function verifyBalanceConsistency(address) {
  try {
    let evmAddress = address;
    
    if (!address.startsWith('0x')) {
      evmAddress = substrateToEvmAddress(address);
    }
    
    const [evmBalance, substrateBalance] = await Promise.all([
      getBalanceEvm(evmAddress),
      getBalanceSubstrate(evmAddress)
    ]);

    const evmBalanceBigInt = BigInt(evmBalance.balance);
    const substrateBalanceBigInt = BigInt(substrateBalance.balance);
    const isEqual = evmBalanceBigInt === substrateBalanceBigInt;

    return {
      address: evmAddress,
      evmBalance: evmBalance,
      substrateBalance: substrateBalance,
      isEqual,
      difference: isEqual ? '0' : (evmBalanceBigInt - substrateBalanceBigInt).toString()
    };
  } catch (error) {
    throw new Error(`Failed to verify balance consistency: ${error.message}`);
  }
}

export async function batchVerifyBalances(addresses) {
  const results = [];
  
  for (const address of addresses) {
    try {
      const result = await verifyBalanceConsistency(address);
      results.push({
        success: true,
        ...result
      });
    } catch (error) {
      results.push({
        success: false,
        address,
        error: error.message
      });
    }
  }
  
  return results;
}

export async function closeConnections() {
  if (substrateApi) {
    await substrateApi.disconnect();
    substrateApi = null;
  }
}
