// Adapted from Uniswap V2 Core test patterns
// These tests follow the same patterns as Uniswap V2 but adapted for MiniSwap

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expandTo18Decimals, getAmountOut, getAmountIn } = require("./utilities.cjs");

describe("MiniSwap - Uniswap V2 Test Patterns", function () {
  let token0, token1, miniswap;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    // Deploy test tokens (similar to Uniswap V2 test setup)
    const ERC20 = await ethers.getContractFactory("ERC20");
    token0 = await ERC20.deploy("Token0", "T0", 1000000);
    token1 = await ERC20.deploy("Token1", "T1", 1000000);
    
    // Deploy MiniSwap
    const MiniSwap = await ethers.getContractFactory("MiniSwap");
    miniswap = await MiniSwap.deploy(token0.target, token1.target);
  });

  // Helper function to add liquidity (similar to Uniswap's addLiquidity helper)
  async function addLiquidity(amount0, amount1) {
    await token0.approve(miniswap.target, amount0);
    await token1.approve(miniswap.target, amount1);
    await miniswap.addLiquidity(amount0, amount1);
  }

  // Test Pattern 1: Swap Test Cases (adapted from Uniswap V2's swapTestCases)
  // These test various swap scenarios with different input amounts and reserves
  const swapTestCases = [
    [1, 5, 10],    // swap 1 token0, with 5 token0 and 10 token1 in pool
    [1, 10, 5],    // swap 1 token1, with 10 token0 and 5 token1 in pool
    [2, 5, 10],    // swap 2 token0, with 5 token0 and 10 token1 in pool
    [2, 10, 5],    // swap 2 token1, with 10 token0 and 5 token1 in pool
    [1, 10, 10],   // swap 1 token0, equal reserves
    [1, 100, 100], // swap 1 token0, larger equal reserves
    [1, 1000, 1000] // swap 1 token0, very large equal reserves
  ];

  swapTestCases.forEach((testCase, i) => {
    it(`Swap Test Case ${i}: should calculate correct output amount`, async function () {
      const [swapAmount, token0Amount, token1Amount] = testCase;
      const swapAmountWei = expandTo18Decimals(swapAmount);
      const token0AmountWei = expandTo18Decimals(token0Amount);
      const token1AmountWei = expandTo18Decimals(token1Amount);

      // Add liquidity
      await addLiquidity(token0AmountWei, token1AmountWei);

      // Get initial reserves
      const reserves = await miniswap.getReserves();
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];

      // Calculate expected output (swapping token0 for token1)
      const expectedOutput = getAmountOut(swapAmountWei, reserve0, reserve1);

      // Approve and perform swap
      await token0.approve(miniswap.target, swapAmountWei);
      const tx = await miniswap.swap(token0.target, swapAmountWei);
      await tx.wait();

      // Check final reserves
      const finalReserves = await miniswap.getReserves();
      expect(finalReserves[0]).to.equal(reserve0 + swapAmountWei);
      expect(finalReserves[1]).to.equal(reserve1 - expectedOutput);

      // Check user received tokens
      const userBalance = await token1.balanceOf(owner.address);
      expect(userBalance).to.be.greaterThan(0n);
    });
  });

  // Test Pattern 2: Swap in both directions (adapted from Uniswap V2's swap:token0 and swap:token1)
  it("Swap: token0 to token1 (Uniswap V2 pattern)", async function () {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const reserves = await miniswap.getReserves();
    const expectedOutput = getAmountOut(swapAmount, reserves[0], reserves[1]);

    // Get initial balances
    const initialToken1Balance = await token1.balanceOf(owner.address);

    // Perform swap
    await token0.approve(miniswap.target, swapAmount);
    await miniswap.swap(token0.target, swapAmount);

    // Verify reserves updated correctly
    const finalReserves = await miniswap.getReserves();
    expect(finalReserves[0]).to.equal(token0Amount + swapAmount);
    expect(finalReserves[1]).to.equal(token1Amount - expectedOutput);

    // Verify user received tokens
    const finalToken1Balance = await token1.balanceOf(owner.address);
    expect(finalToken1Balance - initialToken1Balance).to.equal(expectedOutput);
  });

  it("Swap: token1 to token0 (Uniswap V2 pattern)", async function () {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const reserves = await miniswap.getReserves();
    const expectedOutput = getAmountOut(swapAmount, reserves[1], reserves[0]);

    // Get initial balances
    const initialToken0Balance = await token0.balanceOf(owner.address);

    // Perform swap
    await token1.approve(miniswap.target, swapAmount);
    await miniswap.swap(token1.target, swapAmount);

    // Verify reserves updated correctly
    const finalReserves = await miniswap.getReserves();
    expect(finalReserves[1]).to.equal(token1Amount + swapAmount);
    expect(finalReserves[0]).to.equal(token0Amount - expectedOutput);

    // Verify user received tokens
    const finalToken0Balance = await token0.balanceOf(owner.address);
    expect(finalToken0Balance - initialToken0Balance).to.equal(expectedOutput);
  });

  // Test Pattern 3: Constant Product Formula (K = reserve0 * reserve1)
  // After swaps, K should increase due to fees (adapted from Uniswap V2's constant product tests)
  it("Should maintain constant product formula with fees", async function () {
    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(token0Amount, token1Amount);

    // Get initial K value
    const initialReserves = await miniswap.getReserves();
    const kBefore = initialReserves[0] * initialReserves[1];

    // Perform multiple swaps
    const swapAmount = expandTo18Decimals(1);
    await token0.approve(miniswap.target, swapAmount * 10n);
    
    for (let i = 0; i < 10; i++) {
      await miniswap.swap(token0.target, swapAmount);
    }

    // K should increase due to fees (0.3% per swap)
    const finalReserves = await miniswap.getReserves();
    const kAfter = finalReserves[0] * finalReserves[1];
    expect(kAfter).to.be.greaterThan(kBefore);
  });

  // Test Pattern 4: Remove Liquidity (adapted from Uniswap V2's burn test)
  it("Remove liquidity: should return proportional amounts", async function () {
    const token0Amount = expandTo18Decimals(3);
    const token1Amount = expandTo18Decimals(3);
    await addLiquidity(token0Amount, token1Amount);

    // Get shares
    const shares = await miniswap.balance(owner.address);
    expect(shares).to.be.greaterThan(0n);

    // Get initial user balances
    const initialToken0Balance = await token0.balanceOf(owner.address);
    const initialToken1Balance = await token1.balanceOf(owner.address);

    // Remove all liquidity
    await miniswap.removeLiquidity(shares);

    // Check reserves are back to zero (or minimum)
    const reserves = await miniswap.getReserves();
    expect(reserves[0]).to.equal(0n);
    expect(reserves[1]).to.equal(0n);

    // Check user received tokens back
    const finalToken0Balance = await token0.balanceOf(owner.address);
    const finalToken1Balance = await token1.balanceOf(owner.address);
    expect(finalToken0Balance - initialToken0Balance).to.equal(token0Amount);
    expect(finalToken1Balance - initialToken1Balance).to.equal(token1Amount);
  });

  // Test Pattern 5: Edge Cases (adapted from Uniswap V2's edge case tests)
  it("Should handle large swaps with diminishing returns", async function () {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    // Get initial reserves
    const initialReserves = await miniswap.getReserves();
    const initialReserve1 = initialReserves[1];
    
    // Try to swap a very large amount
    // Due to AMM formula, output will be less than reserve (can't drain pool in one swap)
    const excessiveAmount = expandTo18Decimals(1000);
    await token0.approve(miniswap.target, excessiveAmount);
    
    // The swap should succeed, but output will be much less than input due to AMM pricing
    const tx = await miniswap.swap(token0.target, excessiveAmount);
    await tx.wait();
    
    // Verify reserves updated
    const finalReserves = await miniswap.getReserves();
    expect(finalReserves[0]).to.equal(initialReserves[0] + excessiveAmount);
    // Output should be less than initial reserve (can't drain pool)
    expect(finalReserves[1]).to.be.lessThan(initialReserve1);
    expect(finalReserves[1]).to.be.greaterThan(0n);
  });

  it("Should revert swap with zero amount", async function () {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    await expect(miniswap.swap(token0.target, 0))
      .to.be.revertedWith("Amount must be greater than 0");
  });

  it("Should revert swap with invalid token", async function () {
    // Deploy a third token
    const ERC20 = await ethers.getContractFactory("ERC20");
    const token2 = await ERC20.deploy("Token2", "T2", 1000000);

    await expect(miniswap.swap(token2.target, expandTo18Decimals(1)))
      .to.be.revertedWith("Invalid token");
  });

  // Test Pattern 6: Multiple liquidity providers (if applicable)
  it("Should handle multiple liquidity additions", async function () {
    // First user adds liquidity
    await addLiquidity(expandTo18Decimals(1000), expandTo18Decimals(1000));
    const shares1 = await miniswap.balance(owner.address);

    // Transfer tokens to second user so they can add liquidity
    await token0.transfer(user1.address, expandTo18Decimals(500));
    await token1.transfer(user1.address, expandTo18Decimals(500));

    // Second user adds liquidity
    await token0.connect(user1).approve(miniswap.target, expandTo18Decimals(500));
    await token1.connect(user1).approve(miniswap.target, expandTo18Decimals(500));
    await miniswap.connect(user1).addLiquidity(
      expandTo18Decimals(500),
      expandTo18Decimals(500)
    );

    const shares2 = await miniswap.balance(user1.address);
    expect(shares2).to.be.greaterThan(0n);

    // Total supply should be sum of both
    const totalSupply = await miniswap.totalSupply();
    expect(totalSupply).to.equal(shares1 + shares2);
  });
});
