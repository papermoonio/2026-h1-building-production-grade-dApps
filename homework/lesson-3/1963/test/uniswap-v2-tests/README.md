# Uniswap V2 Test Patterns - Adapted for MiniSwap

This directory contains test cases adapted from Uniswap V2 Core test suite, modified to work with the MiniSwap contract.

## What Was Adapted

### 1. **Test Framework Conversion**
- **Original**: TypeScript with `ethereum-waffle` and `ethers` v4
- **Adapted**: JavaScript with Hardhat and `ethers` v6

### 2. **Contract Interface Differences**
- **Uniswap V2**: Uses Factory pattern, Pair contracts, Router
- **MiniSwap**: Simpler single-contract design with direct functions

### 3. **Key Test Patterns Adapted**

#### Swap Test Cases
- Multiple swap scenarios with different amounts and reserve ratios
- Tests both directions (token0→token1 and token1→token0)
- Verifies constant product formula (K = reserve0 * reserve1)

#### Liquidity Management
- Add liquidity tests
- Remove liquidity tests
- Multiple liquidity provider scenarios

#### Edge Cases
- Zero amount swaps
- Insufficient output
- Invalid token addresses

#### Mathematical Accuracy
- Output amount calculations
- Fee calculations (0.3%)
- Constant product maintenance

## Files

- `utilities.js` - Helper functions adapted from Uniswap V2 test utilities
- `MiniSwap.uniswap-patterns.test.js` - Main test file with adapted patterns
- `README.md` - This file

## Running the Tests

```bash
# Run all adapted Uniswap V2 tests
npx hardhat test tests/uniswap-v2-tests/

# Run specific test file
npx hardhat test tests/uniswap-v2-tests/MiniSwap.uniswap-patterns.test.js
```

## Differences from Original Uniswap V2 Tests

1. **No Factory Pattern**: MiniSwap doesn't use a factory, so factory-related tests are omitted
2. **Simpler Interface**: Direct function calls instead of router pattern
3. **No Price Oracle**: MiniSwap doesn't implement cumulative price tracking
4. **No FeeTo**: MiniSwap doesn't have protocol fee collection

## Test Coverage

These adapted tests cover:
- ✅ Swap functionality with various scenarios
- ✅ Liquidity addition and removal
- ✅ Constant product formula verification
- ✅ Edge cases and error handling
- ✅ Multiple user scenarios
