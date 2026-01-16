# Interaction Guide - MiniSwap DApp

## Overview
This document provides instructions for interacting with the deployed MiniSwap decentralized exchange using the frontend application.

## Deployed Contracts
The following contracts are deployed on the local Hardhat node:

- **MiniSwap Contract**: `0x3DAFAe4d0C4909Fc8551442FB4320102289CB505`
- **Token A (TKNA)**: `0x71805a443a9ecF3dda744B2B548657fd4F3302F3`
- **Token B (TKNB)**: `0xA97Bf07F0a3655EcB63B17AC64d7f816557f69f3`

## Prerequisites
1. **MetaMask Wallet** installed in your browser
2. **Access to the frontend application** at: https://<your-proxy-url>.dsw-gateway-cn-hangzhou.data.aliyun.com/
3. **Local Hardhat node running** (on port 8545)

## Network Setup for MetaMask
Before connecting to the DApp, you need to configure MetaMask to connect to the local Hardhat network:

1. Open MetaMask and click the network selector (top-left corner)
2. Click "Add Network" or "+ Add Network"
3. Enter the following details:
   - **Network Name**: Local Hardhat Node
   - **New RPC URL**: `http://127.0.0.1:8545` (or the exposed HTTPS URL if using a proxy)
   - **Chain ID**: `420420420` (from hardhat.config.ts)
   - **Currency Symbol**: ETH
   - **Block Explorer URL**: (leave blank)

## Frontend Application Usage
### 1. Connecting Your Wallet
1. Navigate to the frontend application
2. Click the "Connect Wallet" button
3. Select MetaMask when prompted
4. Approve the connection in MetaMask
5. You should see your account address appear in the header

### 2. Adding Liquidity
1. On the Liquidity section, enter the following:
   - **Token A Address**: `0x71805a443a9ecF3dda744B2B548657fd4F3302F3`
   - **Token B Address**: `0xA97Bf07F0a3655EcB63B17AC64d7f816557f69f3`
   - **Amount**: Enter desired liquidity amount (e.g., `100`)
2. Click "Approve" for each token (if not already approved)
3. Click "Add Liquidity"
4. Confirm the transaction in MetaMask
5. You'll receive liquidity shares proportional to the pool size

### 3. Swapping Tokens
1. On the Swap section, enter the following:
   - **Token In Address**: Either Token A or Token B address
   - **Token Out Address**: The other token address
   - **Amount**: Enter amount to swap (e.g., `10`)
2. Click "Approve" for the input token (if not already approved)
3. Click "Swap"
4. Confirm the transaction in MetaMask
5. Your tokens will be swapped at a 1:1 ratio

### 4. Removing Liquidity
1. On the Liquidity section, enter the following:
   - **Token A Address**: `0x71805a443a9ecF3dda744B2B548657fd4F3302F3`
   - **Token B Address**: `0xA97Bf07F0a3655EcB63B17AC64d7f816557f69f3`
   - **Amount**: Enter liquidity shares to remove (max is your current share)
2. Click "Remove Liquidity"
3. Confirm the transaction in MetaMask
4. You'll receive your proportional share of both tokens back

## Troubleshooting
### Connection Issues
- Ensure the local Hardhat node is running: `npx hardhat node`
- Verify MetaMask is connected to the correct network
- Check that the RPC URL is accessible

### Transaction Failures
- Ensure you have sufficient ETH for gas fees
- Check that token approvals are set properly
- Verify token addresses match the deployed contracts

### Frontend Not Updating
- Refresh the page after transactions confirm
- Check browser console for any error messages
- Ensure you're using a modern browser with JavaScript enabled

## Contract Information
### MiniSwap Features
- 1:1 token swaps for supported pairs
- Liquidity provision with share-based tracking
- No liquidity fees for this implementation

### Pool Key Calculation
The contract uses consistent token ordering to create unique pool identifiers:
- If TokenA address < TokenB address: pool key uses [TokenA, TokenB]
- Otherwise: pool key uses [TokenB, TokenA]

## Development Notes
- The frontend uses the same contract ABI as defined in `ui/src/constants.ts`
- All token transfers follow ERC20 standards
- Transactions require user confirmation in MetaMask