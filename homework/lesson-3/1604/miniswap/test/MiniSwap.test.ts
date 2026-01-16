import { expect } from "chai";
import { ethers } from "hardhat";
import { MiniSwap, MockERC20 } from "../typechain-types";

describe("MiniSwap", function () {
  let miniSwap: MiniSwap;
  let tokenA: MockERC20;
  let tokenB: MockERC20;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    // Get signers - ensure we have enough accounts
    const signers = await ethers.getSigners();
    owner = signers[0];
    addr1 = signers[1] || signers[0];  // Fallback to first signer if second doesn't exist
    addr2 = signers[2] || signers[0];  // Fallback to first signer if third doesn't exist

    // Deploy the MiniSwap contract
    const MiniSwap = await ethers.getContractFactory("MiniSwap");
    miniSwap = await MiniSwap.deploy();
    await miniSwap.waitForDeployment();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKNA", ethers.parseEther("1000000"));
    tokenB = await MockERC20.deploy("Token B", "TKNB", ethers.parseEther("1000000"));
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();

    // Transfer tokens to test accounts (only if the accounts are different)
    if (addr1.address !== owner.address) {
      await tokenA.transfer(addr1.address, ethers.parseEther("1000"));
      await tokenB.transfer(addr1.address, ethers.parseEther("1000"));
    } else {
      // If addr1 is the same as owner, we'll use owner's allowance for tests using addr1
      await tokenA.transfer(owner.address, ethers.parseEther("2000"));
      await tokenB.transfer(owner.address, ethers.parseEther("2000"));
    }

    if (addr2.address !== owner.address && addr2.address !== addr1.address) {
      await tokenA.transfer(addr2.address, ethers.parseEther("1000"));
      await tokenB.transfer(addr2.address, ethers.parseEther("1000"));
    }

    // Approve tokens for spending by MiniSwap contract
    await tokenA.approve(await miniSwap.getAddress(), ethers.MaxUint256);
    await tokenB.approve(await miniSwap.getAddress(), ethers.MaxUint256);

    if (addr1.address !== owner.address) {
      await tokenA.connect(addr1).approve(await miniSwap.getAddress(), ethers.MaxUint256);
      await tokenB.connect(addr1).approve(await miniSwap.getAddress(), ethers.MaxUint256);
    }

    if (addr2.address !== owner.address && addr2.address !== addr1.address) {
      await tokenA.connect(addr2).approve(await miniSwap.getAddress(), ethers.MaxUint256);
      await tokenB.connect(addr2).approve(await miniSwap.getAddress(), ethers.MaxUint256);
    }
  });

  describe("Add Liquidity", function () {
    it("should add liquidity correctly", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();
      let poolKey: string;
      // Replicate the exact logic from the contract: if tokenA < tokenB, use [tokenA, tokenB], else use [tokenB, tokenA]
      if (BigInt(tokenAAddr) < BigInt(tokenBAddr)) {
        poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddr, tokenBAddr]));
      } else {
        poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenBAddr, tokenAAddr]));
      }

      // Add initial liquidity
      await miniSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("100")
      );

      // Check pool amount and user shares
      const poolAmount = await miniSwap.liquidityPools(poolKey);
      const userShares = await miniSwap.userLiquidity(poolKey, owner.address);
      const totalShares = await miniSwap.totalLiquidityShares(poolKey);

      expect(poolAmount).to.equal(ethers.parseEther("100"));
      expect(userShares).to.equal(ethers.parseEther("100")); // First liquidity provider gets 1:1 ratio
      expect(totalShares).to.equal(ethers.parseEther("100"));
    });

    it("should handle multiple liquidity providers", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();
      let poolKey: string;
      // Replicate the exact logic from the contract: if tokenA < tokenB, use [tokenA, tokenB], else use [tokenB, tokenA]
      if (BigInt(tokenAAddr) < BigInt(tokenBAddr)) {
        poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddr, tokenBAddr]));
      } else {
        poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenBAddr, tokenAAddr]));
      }

      // First provider adds liquidity
      await miniSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("100")
      );

      // Second provider adds liquidity (only if different from owner)
      if (addr1.address !== owner.address) {
        await miniSwap.connect(addr1).addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          ethers.parseEther("50")
        );
      } else {
        // If same account, test that adding to same pool works correctly
        // This creates a scenario where the same user has multiple deposits
        await miniSwap.addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          ethers.parseEther("50")
        );
      }

      // Check state
      const poolAmount = await miniSwap.liquidityPools(poolKey);
      const user1Shares = await miniSwap.userLiquidity(poolKey, owner.address);
      const user2Shares = await miniSwap.userLiquidity(poolKey, addr1.address);
      const totalShares = await miniSwap.totalLiquidityShares(poolKey);

      expect(poolAmount).to.equal(ethers.parseEther("150"));
      if (addr1.address === owner.address) {
        // If both are same account, shares should be combined (150)
        expect(user1Shares).to.equal(ethers.parseEther("150"));
        expect(user2Shares).to.equal(ethers.parseEther("150"));
      } else {
        expect(user1Shares).to.equal(ethers.parseEther("100"));
        expect(user2Shares).to.equal(ethers.parseEther("50"));
      }
      expect(totalShares).to.equal(ethers.parseEther("150"));
    });

    it("should fail to add liquidity with different tokens", async function () {
      await expect(
        miniSwap.addLiquidity(
          await tokenA.getAddress(),
          await tokenA.getAddress(), // Same token
          ethers.parseEther("100")
        )
      ).to.be.revertedWith("Tokens must be different");
    });

    it("should fail to add liquidity with zero amount", async function () {
      await expect(
        miniSwap.addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          0
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Remove Liquidity", function () {
    it("should remove liquidity correctly", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();
      let poolKey: string;
      // Replicate the exact logic from the contract: if tokenA < tokenB, use [tokenA, tokenB], else use [tokenB, tokenA]
      if (BigInt(tokenAAddr) < BigInt(tokenBAddr)) {
        poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddr, tokenBAddr]));
      } else {
        poolKey = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenBAddr, tokenAAddr]));
      };

      // Add liquidity first
      await miniSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("100")
      );

      // Store initial balances
      const initialTokenABalance = await tokenA.balanceOf(owner.address);
      const initialTokenBBalance = await tokenB.balanceOf(owner.address);

      // Remove liquidity
      await miniSwap.removeLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("50") // Remove half of the shares
      );

      // Check final balances
      const finalTokenABalance = await tokenA.balanceOf(owner.address);
      const finalTokenBBalance = await tokenB.balanceOf(owner.address);

      // Should have received half of the liquidity back
      expect(finalTokenABalance).to.equal(initialTokenABalance + ethers.parseEther("50"));
      expect(finalTokenBBalance).to.equal(initialTokenBBalance + ethers.parseEther("50"));

      // Check state after removing liquidity
      const poolAmount = await miniSwap.liquidityPools(poolKey);
      const userShares = await miniSwap.userLiquidity(poolKey, owner.address);
      const totalShares = await miniSwap.totalLiquidityShares(poolKey);

      expect(poolAmount).to.equal(ethers.parseEther("50"));
      expect(userShares).to.equal(ethers.parseEther("50"));
      expect(totalShares).to.equal(ethers.parseEther("50"));
    });

    it("should fail to remove liquidity with insufficient shares", async function () {
      // Add liquidity first
      await miniSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("100")
      );

      // Try to remove more than available
      await expect(
        miniSwap.removeLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          ethers.parseEther("150") // More than available
        )
      ).to.be.revertedWith("Insufficient liquidity shares");
    });

    it("should fail to remove liquidity with different tokens", async function () {
      await expect(
        miniSwap.removeLiquidity(
          await tokenA.getAddress(),
          await tokenA.getAddress(), // Same token
          ethers.parseEther("100")
        )
      ).to.be.revertedWith("Tokens must be different");
    });
  });

  describe("Swap", function () {
    it("should swap tokens correctly", async function () {
      // Add initial liquidity
      await miniSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("100")
      );

      // Store initial balances
      const initialTokenABalance = await tokenA.balanceOf(addr1.address);
      const initialTokenBBalance = await tokenB.balanceOf(addr1.address);

      // Perform swap
      await miniSwap.connect(addr1).swap(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("10")
      );

      // Check final balances
      const finalTokenABalance = await tokenA.balanceOf(addr1.address);
      const finalTokenBBalance = await tokenB.balanceOf(addr1.address);

      // Should have sent 10 units of tokenA and received 10 units of tokenB
      expect(finalTokenABalance).to.equal(initialTokenABalance - ethers.parseEther("10"));
      expect(finalTokenBBalance).to.equal(initialTokenBBalance + ethers.parseEther("10"));
    });

    it("should fail to swap with same tokens", async function () {
      await expect(
        miniSwap.swap(
          await tokenA.getAddress(),
          await tokenA.getAddress(), // Same token
          ethers.parseEther("10")
        )
      ).to.be.revertedWith("Tokens must be different");
    });

    it("should fail to swap with zero amount", async function () {
      await expect(
        miniSwap.swap(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          0
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("should fail to swap with no liquidity", async function () {
      await expect(
        miniSwap.swap(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          ethers.parseEther("10")
        )
      ).to.be.revertedWith("Pool does not exist or has no liquidity");
    });
  });
});