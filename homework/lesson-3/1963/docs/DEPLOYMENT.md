# Deployment Guide

This guide covers deploying the MiniSwap AMM to different environments: local development, and Polkadot Test Hub.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Deployment](#local-deployment)
- [Polkadot Test Hub Deployment](#polkadot-test-hub-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **Hardhat** (installed via npm)
- **MetaMask** browser extension
- **Polkadot node** (for local deployment) OR **Test Hub access** (for testnet deployment)

### Required Accounts

- **Deployment account** with sufficient balance for gas fees
- **Private key or mnemonic** for the deployment account

### Environment Setup

```bash
# Install dependencies
npm install

# Navigate to frontend directory
cd miniswap-frontend
npm install
cd ..
```

---

## Local Deployment

### Step 1: Start Local Node

Start a local Polkadot node in a separate terminal:

```bash
# Navigate to your Polkadot SDK directory
cd /path/to/polkadot-sdk
cargo run --bin polkadot -- --dev
```

Wait for the node to fully start (you'll see "Imported" messages for blocks).

### Step 2: Configure Hardhat

The `hardhat.config.js` is already configured for localhost:

```javascript
localhost: {
  url: "http://127.0.0.1:8545",
  chainId: 420420420,
}
```

### Step 3: Set Up Deployment Account

**Option A: Using Mnemonic**

```bash
export MNEMONIC="your twelve word mnemonic phrase here"
```

**Option B: Using Private Key**

```bash
export PRIVATE_KEY="your_private_key_here"
```

**Generate a new mnemonic (optional):**

```bash
node scripts/generate-mnemonic.js
```

### Step 4: Fund Account (if needed)

If your account has no balance, fund it using the local node's default accounts or use the funding script:

```bash
node scripts/fund-account.js
```

### Step 5: Deploy Contracts

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**

```
Deploying contracts with account: 0x...
Account balance: ...
Token0 deployed to: 0x...
Token1 deployed to: 0x...
MiniSwap deployed to: 0x...

=== Deployment Summary ===
Token0: 0x...
Token1: 0x...
MiniSwap: 0x...
```

### Step 6: Update Frontend Configuration

Update `miniswap-frontend/app/config.ts` with the deployed contract addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  TOKEN0: "0x...", // Replace with actual Token0 address
  TOKEN1: "0x...", // Replace with actual Token1 address
  MINISWAP: "0x...", // Replace with actual MiniSwap address
};

export const NETWORK_CONFIG = {
  chainId: 420420420,
  rpcUrl: "http://127.0.0.1:8545",
  networkName: "Local Development",
};
```

### Step 7: Configure MetaMask

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter:
   - **Network Name:** Local Development
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 420420420
   - **Currency Symbol:** ETH (or any symbol)
4. Save and switch to the network

### Step 8: Start Frontend

```bash
cd miniswap-frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Polkadot Test Hub Deployment

### Step 1: Get Test Tokens

1. Visit [Polkadot Faucet](https://faucet.polkadot.io/)
2. Select:
   - **Network:** `Paseo`
   - **Chain:** `AssetHub`
3. Enter your wallet address
4. Request test tokens (PAS)
5. Wait for tokens to arrive (check MetaMask or block explorer)

**See detailed instructions:** `docs/POLKADOT_TEST_HUB_SETUP.md`

### Step 2: Configure Hardhat

The `hardhat.config.js` is already configured for Test Hub:

```javascript
testhub: {
  url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
  chainId: 420420422,
  accounts: process.env.PRIVATE_KEY ? [...] : process.env.MNEMONIC ? {...} : [],
}
```

### Step 3: Set Up Deployment Account

**Option A: Using Private Key (Recommended)**

```bash
export PRIVATE_KEY="your_private_key_here"
```

**Option B: Using Mnemonic**

```bash
export MNEMONIC="your twelve word mnemonic phrase here"
```

**Verify your account:**

```bash
node scripts/verify-private-key.js
```

### Step 4: Check Account Balance

```bash
node scripts/fund-account.js --network testhub
```

Ensure you have enough PAS tokens for gas fees (recommended: at least 0.1 PAS).

### Step 5: Deploy Contracts

```bash
npm run deploy:testhub
```

Or manually:

```bash
NO_PROXY=testnet-passet-hub-eth-rpc.polkadot.io,*.polkadot.io \
  npx hardhat run scripts/deploy.js --network testhub
```

**Expected Output:**

```
Deploying contracts with account: 0x...
Account balance: ...
Token0 deployed to: 0x...
Token1 deployed to: 0x...
MiniSwap deployed to: 0x...

=== Deployment Summary ===
Token0: 0x...
Token1: 0x...
MiniSwap: 0x...
```

**Note:** The `NO_PROXY` environment variable is required to bypass proxy issues with the Test Hub RPC endpoint.

### Step 6: Verify Deployment

Check contracts on the block explorer:

- **Block Explorer:** https://blockscout-passet-hub.parity-testnet.parity.io/
- Search for your contract addresses
- Verify transaction hashes

### Step 7: Update Frontend Configuration

Update `miniswap-frontend/app/config.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  TOKEN0: "0x...", // Replace with Test Hub Token0 address
  TOKEN1: "0x...", // Replace with Test Hub Token1 address
  MINISWAP: "0x...", // Replace with Test Hub MiniSwap address
};

export const NETWORK_CONFIG = {
  chainId: 420420422, // Test Hub Chain ID
  rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io",
  networkName: "Polkadot Hub TestNet",
};
```

### Step 8: Configure MetaMask for Test Hub

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter:
   - **Network Name:** Polkadot Hub TestNet
   - **RPC URL:** https://testnet-passet-hub-eth-rpc.polkadot.io
   - **Chain ID:** 420420422
   - **Currency Symbol:** PAS
   - **Block Explorer URL:** https://blockscout-passet-hub.parity-testnet.parity.io/
4. Save and switch to the network

### Step 9: Test Deployment

```bash
node scripts/test-interactions.js --network testhub
```

This script will:
- Check contract addresses
- Verify token balances
- Test basic contract interactions

---

## Frontend Deployment

### Development Mode

```bash
cd miniswap-frontend
npm run dev
```

Access at `http://localhost:3000`

### Production Build

```bash
cd miniswap-frontend
npm run build
npm run start
```

The production build will be available at `http://localhost:3000` (or the port specified by your hosting provider).

### Deploy to Hosting Services

#### Vercel

```bash
cd miniswap-frontend
vercel
```

#### Netlify

```bash
cd miniswap-frontend
npm run build
# Deploy the .next folder to Netlify
```

#### Custom Server

1. Build the frontend: `npm run build`
2. Start the server: `npm run start`
3. Configure your reverse proxy (nginx, Apache, etc.) to point to port 3000

**Important:** Ensure the frontend `config.ts` is updated with the correct contract addresses for your deployment environment.

---

## Post-Deployment Configuration

### 1. Update Contract Addresses

After deployment, always update:
- `miniswap-frontend/app/config.ts` - Frontend contract addresses
- `docs/HOMEWORK_STATUS.md` - Documentation (optional)
- Any environment-specific configuration files

### 2. Verify Network Configuration

Ensure the frontend `NETWORK_CONFIG` matches your deployment:
- **Local:** Chain ID `420420420`, RPC `http://127.0.0.1:8545`
- **Test Hub:** Chain ID `420420422`, RPC `https://testnet-passet-hub-eth-rpc.polkadot.io`

### 3. Test All Features

After deployment, verify:
- ✅ Wallet connection
- ✅ Token balances display
- ✅ Add liquidity
- ✅ Swap tokens
- ✅ Remove liquidity
- ✅ Pool information display

---

## Verification

### Verify Contracts on Block Explorer

**Local:**
- Use Hardhat's built-in explorer or check transaction hashes in terminal

**Test Hub:**
- Visit: https://blockscout-passet-hub.parity-testnet.parity.io/
- Search for contract addresses
- Verify contract code and transactions

### Verify Contract Interactions

```bash
# Test contract interactions
node scripts/test-interactions.js --network <network>

# Transfer tokens (optional)
node scripts/transfer-tokens.js --network <network>
```

### Verify Frontend

1. Open the frontend in browser
2. Connect MetaMask wallet
3. Verify network matches deployment
4. Check that contract addresses are correct
5. Test all UI features

---

## Troubleshooting

### Common Issues

#### 1. "No accounts available" Error

**Problem:** Hardhat can't find accounts for deployment.

**Solution:**
- Ensure `PRIVATE_KEY` or `MNEMONIC` environment variable is set
- Verify the format (private key should start with `0x` or be without it)
- Check `hardhat.config.js` account configuration

#### 2. "Insufficient balance" Error

**Problem:** Account doesn't have enough tokens for gas fees.

**Solution:**
- Request test tokens from faucet (Test Hub)
- Fund account using local node's default accounts (local)
- Check balance: `node scripts/fund-account.js --network <network>`

#### 3. "Network connection failed" Error

**Problem:** Can't connect to RPC endpoint.

**Solution:**
- Verify RPC URL is correct
- Check network connectivity
- For Test Hub, ensure `NO_PROXY` is set correctly
- Test RPC endpoint: `curl -X POST <RPC_URL> -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

#### 4. Frontend Shows Wrong Network

**Problem:** Frontend is configured for different network than MetaMask.

**Solution:**
- Update `miniswap-frontend/app/config.ts` with correct `chainId` and `rpcUrl`
- Ensure MetaMask is connected to the correct network
- Restart frontend dev server

#### 5. Contract Addresses Not Found

**Problem:** Frontend can't find contracts at specified addresses.

**Solution:**
- Verify contract addresses in `config.ts` match deployment output
- Ensure contracts were deployed to the same network
- Check that MetaMask is on the correct network

#### 6. Proxy Issues (Test Hub)

**Problem:** Deployment fails with proxy-related errors.

**Solution:**
- Use the `NO_PROXY` environment variable:
  ```bash
  NO_PROXY=testnet-passet-hub-eth-rpc.polkadot.io,*.polkadot.io npm run deploy:testhub
  ```
- Or use the npm script which includes this: `npm run deploy:testhub`

#### 7. MetaMask Network Not Found

**Problem:** Can't add network to MetaMask.

**Solution:**
- Verify all network details are correct (RPC URL, Chain ID, etc.)
- Try adding network manually (not via automatic detection)
- Clear MetaMask cache and try again

### Getting Help

- Check `docs/POLKADOT_TEST_HUB_SETUP.md` for Test Hub-specific issues
- Review `docs/HOMEWORK_STATUS.md` for project status
- Check Hardhat console logs for detailed error messages
- Verify all prerequisites are installed and configured

---

## Deployment Checklist

### Pre-Deployment

- [ ] All dependencies installed (`npm install`)
- [ ] Node is running (for local deployment)
- [ ] Test tokens obtained (for Test Hub)
- [ ] Deployment account configured (PRIVATE_KEY or MNEMONIC)
- [ ] Account has sufficient balance for gas fees
- [ ] Hardhat configuration verified

### Deployment

- [ ] Contracts deployed successfully
- [ ] Contract addresses saved
- [ ] Deployment transaction confirmed on block explorer
- [ ] Contracts verified (optional)

### Post-Deployment

- [ ] Frontend `config.ts` updated with contract addresses
- [ ] Frontend `NETWORK_CONFIG` matches deployment network
- [ ] MetaMask network configured and connected
- [ ] All features tested (wallet, add liquidity, swap, remove liquidity)
- [ ] Contract interactions verified
- [ ] Documentation updated (optional)

---

## Additional Resources

- **Polkadot Test Hub Setup:** `docs/POLKADOT_TEST_HUB_SETUP.md`
- **Test Report:** `docs/test-report.md`
- **Homework Status:** `docs/HOMEWORK_STATUS.md`
- **Polkadot Documentation:** https://docs.polkadot.com/
- **Polkadot Faucet:** https://faucet.polkadot.io/
- **Test Hub Block Explorer:** https://blockscout-passet-hub.parity-testnet.parity.io/

---

## Security Notes

⚠️ **Important Security Reminders:**

- **Never commit private keys or mnemonics** to version control
- **Use environment variables** for sensitive data
- **Test on testnets first** before mainnet deployment
- **Verify contract addresses** before using in production
- **Keep deployment accounts secure** and use separate accounts for testing
- **Review all transactions** before confirming in MetaMask

---

## Quick Reference

### Local Deployment

```bash
# Start node (separate terminal)
cargo run --bin polkadot -- --dev

# Deploy contracts
export MNEMONIC="your mnemonic"
npx hardhat run scripts/deploy.js --network localhost

# Start frontend
cd miniswap-frontend && npm run dev
```

### Test Hub Deployment

```bash
# Deploy contracts
export PRIVATE_KEY="your_private_key"
npm run deploy:testhub

# Update frontend config.ts with addresses
# Start frontend
cd miniswap-frontend && npm run dev
```

---

**Last Updated:** Based on homework completion status (Phase 4: Testing & Deployment - 98% Complete)
