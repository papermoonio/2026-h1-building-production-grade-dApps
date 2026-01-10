// Adapted from Uniswap V2 Core test utilities
// Helper functions for testing MiniSwap

const { ethers } = require("hardhat");

/**
 * Expand a number to 18 decimals (e.g., 1 becomes 1e18)
 * This matches Uniswap V2's expandTo18Decimals function
 */
function expandTo18Decimals(n) {
  return ethers.parseUnits(n.toString(), 18);
}

/**
 * Calculate expected output amount for a swap
 * Formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
 * This matches MiniSwap's swap formula with 0.3% fee
 */
function getAmountOut(amountIn, reserveIn, reserveOut) {
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

/**
 * Calculate expected input amount for a swap (reverse calculation)
 */
function getAmountIn(amountOut, reserveIn, reserveOut) {
  if (amountOut >= reserveOut) {
    throw new Error("Insufficient reserve");
  }
  const numerator = reserveIn * amountOut * 1000n;
  const denominator = (reserveOut - amountOut) * 997n;
  return (numerator / denominator) + 1n; // Add 1 for rounding
}

/**
 * Calculate expected liquidity shares for adding liquidity
 * For first liquidity: shares = sqrt(amount0 * amount1)
 * For subsequent: shares = min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1)
 */
function calculateLiquidityShares(amount0, amount1, reserve0, reserve1, totalSupply) {
  if (totalSupply === 0n) {
    // First liquidity provision
    return sqrt(amount0 * amount1);
  } else {
    const shares0 = (amount0 * totalSupply) / reserve0;
    const shares1 = (amount1 * totalSupply) / reserve1;
    return shares0 < shares1 ? shares0 : shares1;
  }
}

/**
 * Simple square root function (for initial liquidity calculation)
 */
function sqrt(y) {
  if (y > 3n) {
    let z = y;
    let x = y / 2n + 1n;
    while (x < z) {
      z = x;
      x = (y / x + x) / 2n;
    }
    return z;
  } else if (y !== 0n) {
    return 1n;
  }
  return 0n;
}

module.exports = {
  expandTo18Decimals,
  getAmountOut,
  getAmountIn,
  calculateLiquidityShares,
  sqrt
};
