# MiniSwap DEX

A minimal decentralized exchange implementation with liquidity provision and swapping capabilities.

## Features

- **Add Liquidity**: Deposit equal amounts of two tokens to provide liquidity
- **Remove Liquidity**: Withdraw your share of liquidity from the pool
- **Swap**: Exchange one token for another at a 1:1 ratio
- **No Fees**: Zero trading fees
- **Equal Token Ratios**: All token pairs trade at 1:1 ratio
- **Wallet Integration**: Connect with MetaMask
- **Deployable**: Can deploy to Polkadot Test Hub or local network

## Architecture

### Smart Contract Interface

The core functionality is defined by the `MiniSwap` interface:

```solidity
interface MiniSwap {
    function addLiquidity(address tokenA, address tokenB, uint amount) external;
    function removeLiquidity(address tokenA, address tokenB, uint amount) external;
    function swap(address tokenIn, address tokenOut, uint amount) external;
}
```

### Requirements

- All token pairs maintain a 1:1 exchange ratio
- No transaction fees are charged
- Liquidity providers receive proportional shares
- No rewards for providing liquidity

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- MetaMask wallet installed in browser

### Frontend Setup

1. Navigate to the UI directory:
```bash
cd ui
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn start
```

The UI will be accessible at `http://localhost:5173`

### Contract Deployment

#### Local Development

1. Ensure you have Hardhat or Foundry installed
2. The local testnet is running on: `http://localhost:8545`
3. Deploy the contract to the local network at this endpoint
4. Update the frontend config with the deployed contract address

#### Polkadot Test Hub Deployment

1. Install required Polkadot development tools:
```bash
# Install Acala/EVM+ compatible tools or use Hardhat with Polkadot plugin
npm install @acala-network/chopsticks  # For local testing with Chopsticks
```

2. Configure your deployment script for Polkadot EVM:
```javascript
// hardhat.config.js or deployment script
module.exports = {
  networks: {
    polkadotTestHub: {
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io", // Official Polkadot Test Hub RPC
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 420420422, // Actual chain ID for Polkadot Test Hub
    }
  }
};
```

3. Deploy the contract:
```bash
npx hardhat run scripts/deploy.js --network polkadotTestHub
```

4. Configure the UI with the deployed contract address:
   - Update the contract address in `src/config.ts` or `vite.config.ts`
   - Ensure token addresses are properly configured

5. Verify your deployment:
   - Check the deployed contract on the Polkadot explorer
   - Test basic functionality with test tokens

### Wallet Connection

The dApp supports MetaMask wallet integration by default. Users can connect their wallets to:
- Approve token spending for liquidity provision
- Execute swap transactions
- Manage their liquidity positions

## UI Components

The interface includes:

- Wallet connection button
- Token selection dropdowns
- Amount input fields
- Action buttons for add/remove liquidity and swaps
- Token balance displays
- Transaction status indicators

## UI Operations Guide

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the top-right corner
2. Select MetaMask from the wallet options
3. Confirm the connection in your MetaMask extension
4. Verify that your account address appears in the header

### Adding Liquidity

1. Select the two tokens you wish to provide liquidity for
2. Enter the amount for each token (must be equal for 1:1 ratio)
3. Click "Approve" for each token if not already approved
4. Click "Add Liquidity" to deposit tokens to the pool
5. Confirm the transaction in MetaMask
6. View your liquidity position in the portfolio section

### Removing Liquidity

1. Navigate to your liquidity positions
2. Select the pair you want to withdraw from
3. Enter the amount of LP tokens to burn
4. Click "Remove Liquidity"
5. Confirm the transaction in MetaMask
6. Receive your proportional share of both tokens

### Swapping Tokens

1. Select the token you want to swap from and to
2. Enter the amount you wish to swap
3. Verify the output amount (1:1 ratio maintained)
4. Click "Approve" for the input token if not already approved
5. Click "Swap" to execute the transaction
6. Confirm in MetaMask and verify the transaction status

## Token Configuration

To configure new tokens in the UI:

1. Deploy your ERC20 token contracts
2. Add the token addresses and metadata to the token list configuration
3. Fund test accounts with tokens for demonstration
4. Test all operations with the new token pair

## Testing

1. Connect your MetaMask wallet
2. Select token pairs
3. Perform liquidity operations and swaps
4. Verify balances and transaction confirmations

## Security Notes

- This is a minimal implementation for educational purposes
- Thorough testing recommended before production use
- Verify all token approvals before transactions