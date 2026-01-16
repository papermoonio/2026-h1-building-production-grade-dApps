# MiniSwap - Uniswap V2 Clone with PolkaVM Support

## Overview
MiniSwap is a simplified version of Uniswap V2, providing automated liquidity protocol functionality. The contract enables users to add liquidity, remove liquidity, and swap tokens in a decentralized manner.

## Features
- Add liquidity to token pairs
- Remove liquidity from token pairs
- Swap tokens with 1:1 ratio
- Secure and decentralized operation

## Setup and Configuration

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Install dependencies:
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```
LOCAL_PRIVATE_KEY=your_private_key_here
POLKADOT_PRIVATE_KEY=your_polkadot_private_key_here
```

### Running Tests
#### Standard Tests
To run tests on the default Hardhat network:
```bash
npx hardhat test
```

#### Running Tests with PolkaVM
To run tests on the PolkaVM network:
1. Start the substrate node:
```bash
./bin/substrate-node --dev --rpc-cors=all --unsafe-rpc-external --rpc-methods=unsafe &
```

2. Start the eth-rpc adapter:
```bash
./bin/eth-rpc --node-rpc-url ws://127.0.0.1:9944 --rpc-port 8545 --unsafe-rpc-external --rpc-methods unsafe &
```

3. Run tests:
```bash
POLKA_NODE=true npx hardhat test --network localNode
```

## Architecture

### Smart Contracts
- `miniSwap.sol`: Main contract implementing liquidity provision and swapping functionality
- `MockERC20.sol`: Mock ERC20 token contract for testing purposes

### Test Files
- `test/MiniSwap.test.ts`: Comprehensive test suite covering all contract functionalities

### PolkaVM Integration
The project has been configured to support PolkaVM (Polkadot Virtual Machine) with the following changes:
- Updated hardhat.config.ts with PolkaVM-specific settings
- Added support for PolkaVM compatible accounts and chain ID (420420420)
- Included required PolkaVM plugins in the configuration
- Enhanced test compatibility with PolkaVM environment

## Key Changes Made

1. **PolkaVM Support**:
   - Integrated @parity/hardhat-polkadot plugin
   - Added PolkaVM-specific network configuration
   - Included substrate-node and eth-rpc binaries for local testing

2. **Configuration Updates**:
   - Modified hardhat.config.ts to support both standard and PolkaVM environments
   - Added proper chain ID (420420420) for PolkaVM
   - Improved account management for cross-chain compatibility

3. **Test Improvements**:
   - Updated key calculation in tests to use solidityPacked instead of AbiCoder.encode for consistency
   - Enhanced test stability across different environments

## Deployments
To deploy the contracts:
```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

Supported networks:
- localNode (PolkaVM)
- passetHub (Polkadot Test Hub)
- hardhat (default in-memory network)

## Notes
- The contract operates with a 1:1 ratio for all token swaps
- Pool identifiers are created using consistent ordering of token addresses to prevent duplicate pools
- Tests require multiple funded accounts which are automatically provided in standard Hardhat network but need to be configured for PolkaVM