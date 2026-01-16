# MiniSwap - Lesson 3 Homework

A minimal Uniswap V2-like AMM (Automated Market Maker) implementation for Polkadot, featuring a constant product formula (x * y = k) with 0.3% swap fees.

## Features

### Core AMM Functionality
- ✅ **Swap Tokens** - Exchange tokens using the constant product formula with automatic price calculation
- ✅ **Add Liquidity** - Provide liquidity to the pool and receive LP shares proportional to your contribution
- ✅ **Remove Liquidity** - Withdraw your liquidity and receive tokens back based on current pool ratios
- ✅ **Pool Information** - Real-time display of pool reserves, token balances, and exchange rates

### Frontend Features
- ✅ **Modern Web UI** - Beautiful, responsive Next.js interface with glassmorphism design
- ✅ **MetaMask Integration** - Seamless wallet connection and transaction signing
- ✅ **Price Impact Calculation** - Visual warnings for large swaps that may affect price
- ✅ **Real-time Updates** - Automatic refresh of balances and pool information
- ✅ **Transaction Status** - Clear feedback for pending, successful, and failed transactions

### Technical Features
- ✅ **Constant Product Formula** - Maintains x * y = k invariant for accurate pricing
- ✅ **0.3% Swap Fee** - Standard Uniswap V2 fee structure
- ✅ **Gas Optimized** - Efficient smart contract design
- ✅ **Test Coverage** - Comprehensive test suite adapted from Uniswap V2 patterns

## Project Structure

```
.
├── contracts/              # Smart contracts (Solidity)
│   ├── ERC20.sol          # ERC20 token implementation
│   ├── MiniSwap.sol       # Main AMM contract
│   └── tests/             # Contract unit tests
├── miniswap-frontend/     # Next.js frontend application
│   ├── app/               # Next.js app directory
│   │   ├── components/    # React components (Swap, AddLiquidity, etc.)
│   │   ├── hooks/         # Custom React hooks (useWallet, useContracts)
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── scripts/               # Deployment and utility scripts
│   ├── deploy.js          # Contract deployment script
│   └── ...                # Other utility scripts
├── test/                  # Test suites
│   └── uniswap-v2-tests/  # Uniswap V2 adapted test patterns
├── docs/                  # Documentation
│   ├── DEPLOYMENT.md      # Deployment instructions
│   ├── METAMASK_SETUP.md  # MetaMask configuration guide
│   └── POLKADOT_TEST_HUB_SETUP.md  # Test Hub setup guide
└── hardhat.config.js      # Hardhat configuration
```

## Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** browser extension installed
- **Polkadot Test Hub** access or local Polkadot node running
- Basic understanding of DeFi and AMM concepts

## Installation

### 1. Install Dependencies

```bash
# Install root dependencies (Hardhat, etc.)
npm install

# Install frontend dependencies
cd miniswap-frontend
npm install
cd ..
```

### 2. Configure MetaMask

Follow the instructions in `docs/METAMASK_SETUP.md` to:
- Add Polkadot Test Hub network to MetaMask
- Import or create a test account
- Fund your account with test tokens

### 3. Deploy Contracts

Deploy to Polkadot Test Hub:

```bash
# Set your mnemonic or private key
export MNEMONIC="your twelve word mnemonic phrase here"

# Deploy contracts
npm run deploy:testhub
```

Or deploy to local node:

```bash
# Start local Hardhat node (Terminal 1)
npx hardhat node

# Deploy to local network (Terminal 2)
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Update Contract Addresses

After deployment, update the contract addresses in `miniswap-frontend/app/config.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  token0: "0x...",      // Your Token0 address
  token1: "0x...",      // Your Token1 address
  miniswap: "0x...",   // Your MiniSwap address
};
```

### 5. Start Frontend

```bash
cd miniswap-frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the top right
2. Select MetaMask from the wallet options
3. Approve the connection request
4. Your wallet address will be displayed when connected

### Adding Liquidity

1. Navigate to the **Liquidity** tab
2. Enter the amount of Token0 you want to add
3. The interface will automatically calculate the required Token1 amount (or vice versa)
4. Click "Add Liquidity"
5. Approve token transfers if this is your first time
6. Confirm the transaction in MetaMask

### Swapping Tokens

1. Navigate to the **Swap** tab
2. Select the token you want to swap from (Token0 or Token1)
3. Enter the amount you want to swap
4. The interface will show:
   - Output amount you'll receive
   - Price impact percentage
   - Current exchange rate
5. Click "Swap"
6. Approve token transfer if needed
7. Confirm the transaction in MetaMask

### Removing Liquidity

1. Navigate to the **Liquidity** tab
2. Scroll to the "Remove Liquidity" section
3. Enter the amount of LP shares you want to burn
4. The interface will show how many tokens you'll receive
5. Click "Remove Liquidity"
6. Confirm the transaction in MetaMask

## Testing

### Run Contract Tests

```bash
# Run all contract tests
npx hardhat test

# Run specific test file
npx hardhat test contracts/tests/MiniSwap.test.js
```

### Run Uniswap V2 Adapted Tests

```bash
# Run Uniswap V2 pattern tests
npx hardhat test test/uniswap-v2-tests/
```

These tests verify:
- Swap functionality with various scenarios
- Liquidity addition and removal
- Constant product formula accuracy
- Edge cases and error handling
- Fee calculations (0.3%)

## Deployment

For detailed deployment instructions, see:
- **`docs/DEPLOYMENT.md`** - Complete deployment guide
- **`docs/POLKADOT_TEST_HUB_SETUP.md`** - Test Hub configuration
- **`docs/METAMASK_SETUP.md`** - MetaMask setup guide

## How It Works

### Constant Product Formula

MiniSwap uses the constant product formula: `x * y = k`

- `x` = reserve of Token0
- `y` = reserve of Token1  
- `k` = constant product (must remain constant)

When swapping, the formula ensures:
- Larger swaps have higher price impact
- Pool always maintains liquidity
- Prices adjust automatically based on supply and demand

### Swap Calculation

For a swap of `amountIn` tokens:
```
amountInWithFee = amountIn * 997  (0.3% fee)
amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee)
```

### Liquidity Shares

When adding liquidity:
- First provider: `shares = sqrt(amount0 * amount1)`
- Subsequent providers: `shares = min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1)`

## Security Considerations

⚠️ **This is a learning project for educational purposes. Do not use in production without comprehensive security audits.**

- Always verify contract addresses before interacting
- Start with small amounts when testing
- Be aware of price impact on large swaps
- Understand impermanent loss when providing liquidity

## License

MIT
