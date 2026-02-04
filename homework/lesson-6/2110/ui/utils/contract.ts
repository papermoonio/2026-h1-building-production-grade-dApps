import { getContract } from 'viem';
import { publicClient, getWalletClient } from './viem';
import ERC1604FT from '../abis/ERC1604FT.json';

export const CONTRACT_ADDRESS = '0xd14ABE99C51c84919b519BA6826a032755B9782C'; 
export const CONTRACT_ABI = ERC1604FT.abi;

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