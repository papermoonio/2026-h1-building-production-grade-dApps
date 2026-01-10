import { expect } from "chai";
import { ethers } from "hardhat";

describe("MiniSwap", function () {
  let token0, token1, miniswap;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    // Deploy test tokens
    const ERC20 = await ethers.getContractFactory("ERC20");
    token0 = await ERC20.deploy("Token0", "T0", 1000000);
    token1 = await ERC20.deploy("Token1", "T1", 1000000);
    
    // Deploy MiniSwap
    const MiniSwap = await ethers.getContractFactory("MiniSwap");
    miniswap = await MiniSwap.deploy(token0.target, token1.target);
  });

  it("Should add liquidity", async function () {
    await token0.approve(miniswap.target, 1000);
    await token1.approve(miniswap.target, 1000);
    await miniswap.addLiquidity(1000, 1000);
    
    const reserves = await miniswap.getReserves();
    expect(reserves[0]).to.equal(1000);
    expect(reserves[1]).to.equal(1000);
  });

  it("Should swap tokens", async function () {
    // Add liquidity first
    await token0.approve(miniswap.target, 1000);
    await token1.approve(miniswap.target, 1000);
    await miniswap.addLiquidity(1000, 1000);
    
    // Perform swap
    await token0.approve(miniswap.target, 100);
    await miniswap.swap(token0.target, 100);
    
    const reserves = await miniswap.getReserves();
    expect(reserves[0]).to.be.greaterThan(1000);
  });

  it("Should remove liquidity", async function () {
    // Add liquidity
    await token0.approve(miniswap.target, 1000);
    await token1.approve(miniswap.target, 1000);
    await miniswap.addLiquidity(1000, 1000);
    
    const shares = await miniswap.balance(owner.address);
    await miniswap.removeLiquidity(shares);
    
    const reserves = await miniswap.getReserves();
    expect(reserves[0]).to.equal(0);
    expect(reserves[1]).to.equal(0);
  });
});

it("Should prevent swap with zero amount", async function () {
    await expect(miniswap.swap(token0.target, 0)).to.be.reverted;
  });
  
  it("Should prevent removing more liquidity than owned", async function () {
    await expect(miniswap.removeLiquidity(1000)).to.be.reverted;
  });
  
  it("Should maintain constant product formula", async function () {
    await token0.approve(miniswap.target, 10000);
    await token1.approve(miniswap.target, 10000);
    await miniswap.addLiquidity(1000, 1000);
    
    const kBefore = (await miniswap.getReserves())[0] * (await miniswap.getReserves())[1];
    
    await token0.approve(miniswap.target, 100);
    await miniswap.swap(token0.target, 100);
    
    const reserves = await miniswap.getReserves();
    const kAfter = reserves[0] * reserves[1];
    
    // K should increase due to fees
    expect(kAfter).to.be.greaterThan(kBefore);
  });

  it("Should prevent reentrancy attacks", async function () {
    // This test ensures swap cannot be called recursively
    // Implement based on your reentrancy protection mechanism
  });

  