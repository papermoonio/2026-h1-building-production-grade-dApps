import { ethers } from 'ethers';

const EVM_RPC = 'http://localhost:8545';

const BALANCES_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000402';

const BALANCES_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export function getProvider() {
  return new ethers.JsonRpcProvider(EVM_RPC);
}

export async function getBalanceViaPrecompile(accountAddress) {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(BALANCES_PRECOMPILE_ADDRESS, BALANCES_ABI, provider);
    const balance = await contract.balanceOf(accountAddress);
    const balanceString = balance.toString();
    return {
      address: accountAddress,
      balance: balanceString,
      balanceFormatted: ethers.formatEther(balanceString),
      precompileAddress: BALANCES_PRECOMPILE_ADDRESS
    };
  } catch (error) {
    throw new Error(`Failed to call Balances precompile: ${error.message}`);
  }
}

export async function getBalanceViaDirectQuery(accountAddress) {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(accountAddress);
    const balanceString = balance.toString();
    return {
      address: accountAddress,
      balance: balanceString,
      balanceFormatted: ethers.formatEther(balanceString)
    };
  } catch (error) {
    throw new Error(`Failed to get direct balance: ${error.message}`);
  }
}

export async function verifyPrecompileBalance(accountAddress) {
  try {
    const [precompileBalance, directBalance] = await Promise.all([
      getBalanceViaPrecompile(accountAddress),
      getBalanceViaDirectQuery(accountAddress)
    ]);

    const precompileBalanceBigInt = BigInt(precompileBalance.balance);
    const directBalanceBigInt = BigInt(directBalance.balance);
    const isEqual = precompileBalanceBigInt === directBalanceBigInt;

    return {
      address: accountAddress,
      precompileBalance: precompileBalance.balance,
      precompileBalanceFormatted: precompileBalance.balanceFormatted,
      directBalance: directBalance.balance,
      directBalanceFormatted: directBalance.balanceFormatted,
      isEqual,
      difference: isEqual ? '0' : (precompileBalanceBigInt - directBalanceBigInt).toString()
    };
  } catch (error) {
    throw new Error(`Failed to verify precompile balance: ${error.message}`);
  }
}

export async function batchGetBalances(addresses) {
  const results = [];
  for (const address of addresses) {
    try {
      const result = await getBalanceViaPrecompile(address);
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

export async function transferViaPrecompile(fromPrivateKey, toAddress, amount) {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(fromPrivateKey, provider);
    const contract = new ethers.Contract(BALANCES_PRECOMPILE_ADDRESS, BALANCES_ABI, wallet);
    
    const amountInWei = ethers.parseEther(amount.toString());
    const tx = await contract.transfer(toAddress, amountInWei);
    await tx.wait();
    
    return {
      success: true,
      transactionHash: tx.hash,
      from: wallet.address,
      to: toAddress,
      amount: amount
    };
  } catch (error) {
    throw new Error(`Failed to transfer via precompile: ${error.message}`);
  }
}

export async function closeConnections() {
}
