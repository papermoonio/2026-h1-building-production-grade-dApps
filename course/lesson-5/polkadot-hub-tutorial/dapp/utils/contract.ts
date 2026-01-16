import { getContract } from 'viem';
import { publicClient, getWalletClient } from './viem';
import StorageABI from '../abis/Storage.json';

export const CONTRACT_ADDRESS = '0x2dE8e53a1a4a49ADf7a4057488aE518Bd4C442e7'; // TODO: change when the paseo asset hub RPC URL is available, and the contract is redeployed
export const CONTRACT_ABI = StorageABI.abi;

// Create a function to get a contract instance for reading
export const getContractInstance = () => {
    return getContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        client: publicClient,
    });
};

// Create a function to get a contract instance with a signer for writing
export const getSignedContract = async () => {
    const walletClient = await getWalletClient();
    return getContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        client: walletClient,
    });
};