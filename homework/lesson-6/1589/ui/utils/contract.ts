import { getContract } from 'viem';
import { publicClient, getWalletClient } from './viem';
import ERC1589 from '../abis/ERC1589.json';

export const CONTRACT_ADDRESS = '0x7eF2e8Aca705BAB3d245384cdD023e7B62A60f1C'; 
export const CONTRACT_ABI = ERC1589.abi;

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