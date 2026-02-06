import { expect } from "chai";
import { ethers } from "hardhat";

describe("MiniSwap", function () {
    let miniSwap: any;
    let tokenA: any;
    let tokenB: any;
    let owner: any;
    let addr1: any;
    let addr2: any;

    const INITIAL_MINT = ethers.parseEther("1000");
    const INIT_LIQUIDITY = ethers.parseEther("100");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy MiniSwap
        const MiniSwapFactory = await ethers.getContractFactory("MiniSwap");
        miniSwap = await MiniSwapFactory.deploy();

        // Deploy tokens
        const TestTokenFactory = await ethers.getContractFactory("TestToken");
        tokenA = await TestTokenFactory.deploy("Token A", "TKA", 18);
        tokenB = await TestTokenFactory.deploy("Token B", "TKB", 18);

        // Mint tokens to owner
        await tokenA.mint(owner.address, INITIAL_MINT);
        await tokenB.mint(owner.address, INITIAL_MINT);

        // Mint tokens to addr1
        await tokenA.mint(addr1.address, INITIAL_MINT);
        await tokenB.mint(addr1.address, INITIAL_MINT);

        // Approve MiniSwap to spend tokens
        await tokenA.approve(miniSwap.getAddress(), ethers.MaxUint256);
        await tokenB.approve(miniSwap.getAddress(), ethers.MaxUint256);

        await tokenA.connect(addr1).approve(miniSwap.getAddress(), ethers.MaxUint256);
        await tokenB.connect(addr1).approve(miniSwap.getAddress(), ethers.MaxUint256);
    });

    describe("Liquidity Management", function () {
        it("Should add liquidity successfully", async function () {
            const tx = await miniSwap.addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY,
                INIT_LIQUIDITY
            );

            const receipt = await tx.wait();
            expect(receipt?.status).to.equal(1);

            // Check pool info
            const [reserve0, reserve1, totalLiquidity] = 
                await miniSwap.getPoolInfo(tokenA.getAddress(), tokenB.getAddress());
            
            expect(reserve0).to.equal(INIT_LIQUIDITY);
            expect(reserve1).to.equal(INIT_LIQUIDITY);
            expect(totalLiquidity).to.equal(INIT_LIQUIDITY);
        });

        it("Should fail with zero amount", async function () {
            await expect(
                miniSwap.addLiquidity(
                    tokenA.getAddress(),
                    tokenB.getAddress(),
                    0,
                    INIT_LIQUIDITY
                )
            ).to.be.revertedWith("Amount must be > 0");
        });

        it("Should fail with unproportional amounts", async function () {
            // First add liquidity
            await miniSwap.addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY,
                INIT_LIQUIDITY
            );

            // Try to add unproportional amounts
            await expect(
                miniSwap.connect(addr1).addLiquidity(
                    tokenA.getAddress(),
                    tokenB.getAddress(),
                    ethers.parseEther("50"),
                    ethers.parseEther("100")
                )
            ).to.be.revertedWith("Unproportional amounts");
        });

        it("Should remove liquidity successfully", async function () {
            // Add liquidity first
            await miniSwap.addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY,
                INIT_LIQUIDITY
            );

            // Remove liquidity
            const tx = await miniSwap.removeLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY
            );

            const receipt = await tx.wait();
            expect(receipt?.status).to.equal(1);

            // Check pool is empty
            const [reserve0, reserve1, totalLiquidity] = 
                await miniSwap.getPoolInfo(tokenA.getAddress(), tokenB.getAddress());
            
            expect(reserve0).to.equal(0);
            expect(reserve1).to.equal(0);
            expect(totalLiquidity).to.equal(0);
        });

        it("Should track LP token balances correctly", async function () {
            await miniSwap.addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY,
                INIT_LIQUIDITY
            );

            const lpBalance = await miniSwap.getLpTokenBalance(
                tokenA.getAddress(),
                tokenB.getAddress(),
                owner.address
            );

            expect(lpBalance).to.equal(INIT_LIQUIDITY);
        });
    });

    describe("Swapping", function () {
        beforeEach(async function () {
            // Add initial liquidity
            await miniSwap.addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY,
                INIT_LIQUIDITY
            );
        });

        it("Should swap tokens successfully (1:1 ratio)", async function () {
            const swapAmount = ethers.parseEther("10");

            const balanceBefore = await tokenB.balanceOf(addr1.address);

            const tx = await miniSwap.connect(addr1).swap(
                tokenA.getAddress(),
                tokenB.getAddress(),
                swapAmount
            );

            const receipt = await tx.wait();
            expect(receipt?.status).to.equal(1);

            const balanceAfter = await tokenB.balanceOf(addr1.address);
            expect(balanceAfter).to.equal(balanceBefore + swapAmount);
        });

        it("Should fail swap with same token", async function () {
            await expect(
                miniSwap.swap(
                    tokenA.getAddress(),
                    tokenA.getAddress(),
                    ethers.parseEther("10")
                )
            ).to.be.revertedWith("Same token");
        });

        it("Should fail swap with zero amount", async function () {
            await expect(
                miniSwap.swap(
                    tokenA.getAddress(),
                    tokenB.getAddress(),
                    0
                )
            ).to.be.revertedWith("Amount must be > 0");
        });

        it("Should fail swap with insufficient liquidity", async function () {
            const excessiveAmount = ethers.parseEther("10000");

            await expect(
                miniSwap.swap(
                    tokenA.getAddress(),
                    tokenB.getAddress(),
                    excessiveAmount
                )
            ).to.be.revertedWith("Insufficient liquidity");
        });

        it("Should handle bidirectional swaps", async function () {
            const swapAmount = ethers.parseEther("5");

            // Swap A -> B
            await miniSwap.connect(addr1).swap(
                tokenA.getAddress(),
                tokenB.getAddress(),
                swapAmount
            );

            // Swap B -> A
            const balanceABefore = await tokenA.balanceOf(addr1.address);

            await miniSwap.connect(addr1).swap(
                tokenB.getAddress(),
                tokenA.getAddress(),
                swapAmount
            );

            const balanceAAfter = await tokenA.balanceOf(addr1.address);
            expect(balanceAAfter).to.equal(balanceABefore + swapAmount);
        });
    });

    describe("Multiple Liquidity Providers", function () {
        it("Should handle multiple liquidity providers", async function () {
            // Owner adds liquidity
            await miniSwap.addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY,
                INIT_LIQUIDITY
            );

            // addr1 adds liquidity
            await miniSwap.connect(addr1).addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                INIT_LIQUIDITY,
                INIT_LIQUIDITY
            );

            const [reserve0, reserve1, totalLiquidity] = 
                await miniSwap.getPoolInfo(tokenA.getAddress(), tokenB.getAddress());

            expect(reserve0).to.equal(INIT_LIQUIDITY + INIT_LIQUIDITY);
            expect(reserve1).to.equal(INIT_LIQUIDITY + INIT_LIQUIDITY);
            expect(totalLiquidity).to.be.greaterThan(0);
        });
    });

    describe("Pool Initialization", function () {
        it("Should initialize pool with first liquidity", async function () {
            const amount = ethers.parseEther("50");

            await miniSwap.addLiquidity(
                tokenA.getAddress(),
                tokenB.getAddress(),
                amount,
                amount
            );

            const lpBalance = await miniSwap.getLpTokenBalance(
                tokenA.getAddress(),
                tokenB.getAddress(),
                owner.address
            );

            // Initial LP tokens = first amount
            expect(lpBalance).to.equal(amount);
        });
    });
});
