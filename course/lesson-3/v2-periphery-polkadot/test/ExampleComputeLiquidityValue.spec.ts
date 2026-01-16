import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expandTo18Decimals, getWallets } from "./shared/utilities";
import { v2Fixture } from "./shared/fixtures";

describe("ExampleComputeLiquidityValue", () => {
  let token0: Contract;
  let token1: Contract;
  let factory: Contract;
  let pair: Contract;
  let computeLiquidityValue: Contract;
  let router: Contract;
  let wallet: any;
  let walletForLargeContract: any;


  beforeEach(async function() {
    const [signer] = await ethers.getSigners();
    wallet = signer;
    const fixture = await v2Fixture();
    token0 = fixture.token0;
    token1 = fixture.token1;
    pair = fixture.pair;
    factory = fixture.factoryV2;
    router = fixture.router;
    [walletForLargeContract] = getWallets(1);

    const ExampleComputeLiquidityValue = await ethers.getContractFactory("ExampleComputeLiquidityValue", walletForLargeContract);
    computeLiquidityValue = await ExampleComputeLiquidityValue.deploy(await factory.getAddress()) as unknown as Contract;
    await computeLiquidityValue.waitForDeployment();
  });

  beforeEach("mint some liquidity for the pair at 1:100 (100 shares minted)", async () => {
    await token0.transfer(await pair.getAddress(), expandTo18Decimals(10));
    await token1.transfer(await pair.getAddress(), expandTo18Decimals(1000));
    await pair.mint(await wallet.getAddress());
    expect(await pair.totalSupply()).to.equal(expandTo18Decimals(100));
  });

  it("correct factory address", async function() {
    this.timeout(10000000);
    expect(await computeLiquidityValue.factory()).to.equal(await factory.getAddress());
  });

  describe("#getLiquidityValue", () => {
    it("correct for 5 shares", async () => {
      const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
        await token0.getAddress(),
        await token1.getAddress(),
        expandTo18Decimals(5)
      );
      expect(token0Amount).to.equal("500000000000000000");
      expect(token1Amount).to.equal("50000000000000000000");
    });

    it("correct for 7 shares", async () => {
      const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
        await token0.getAddress(),
        await token1.getAddress(),
        expandTo18Decimals(7)
      );
      expect(token0Amount).to.equal("700000000000000000");
      expect(token1Amount).to.equal("70000000000000000000");
    });

    it("correct after swap", async () => {
      console.log("router address", await router.getAddress());
      await token0.approve(await router.getAddress(), ethers.MaxUint256);
      const tx = await router.swapExactTokensForTokens(
        expandTo18Decimals(10),
        0,
        [await token0.getAddress(), await token1.getAddress()],
        await wallet.getAddress(),
        ethers.MaxUint256
      );
      await tx.wait();
      const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
        await token0.getAddress(),
        await token1.getAddress(),
        expandTo18Decimals(7)
      );
      expect(token0Amount).to.equal("1400000000000000000");
      expect(token1Amount).to.equal("35052578868302453680");
    });

    describe("fee on", () => {
      beforeEach("turn on fee", async () => {
        await factory.setFeeTo(await wallet.getAddress());
      });

      // this is necessary to cause kLast to be set
      beforeEach("mint more liquidity to address zero", async () => {
        await token0.transfer(await pair.getAddress(), expandTo18Decimals(10));
        await token1.transfer(await pair.getAddress(), expandTo18Decimals(1000));
        await pair.mint(ethers.ZeroAddress);
        expect(await pair.totalSupply()).to.equal(expandTo18Decimals(200));
      });

      it("correct after swap", async () => {
        await token0.approve(await router.getAddress(), ethers.MaxUint256);
        const tx = await router.swapExactTokensForTokens(
          expandTo18Decimals(20),
          0,
          [await token0.getAddress(), await token1.getAddress()],
          await wallet.getAddress(),
          ethers.MaxUint256
        );
        await tx.wait();
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
          await token0.getAddress(),
          await token1.getAddress(),
          expandTo18Decimals(7)
        );
        expect(token0Amount).to.equal("1399824934325735058");
        expect(token1Amount).to.equal("35048195651620807684");
      });
    });
  });

  describe("#getReservesAfterArbitrage", () => {
    it("1/400", async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        await token0.getAddress(),
        await token1.getAddress(),
        1,
        400
      );
      expect(reserveA).to.equal("5007516917298542016");
      expect(reserveB).to.equal("1999997739838173075192");
    });

    it("1/200", async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        await token0.getAddress(),
        await token1.getAddress(),
        1,
        200
      );
      expect(reserveA).to.equal("7081698338256310291");
      expect(reserveB).to.equal("1413330640570018326894");
    });

    it("1/100 (same price)", async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        await token0.getAddress(),
        await token1.getAddress(),
        1,
        100
      );
      expect(reserveA).to.equal("10000000000000000000");
      expect(reserveB).to.equal("1000000000000000000000");
    });

    it("1/50", async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        await token0.getAddress(),
        await token1.getAddress(),
        1,
        50
      );
      expect(reserveA).to.equal("14133306405700183269");
      expect(reserveB).to.equal("708169833825631029041");
    });

    it("1/25", async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        await token0.getAddress(),
        await token1.getAddress(),
        1,
        25
      );
      expect(reserveA).to.equal("19999977398381730752");
      expect(reserveB).to.equal("500751691729854201595");
    });

    it("25/1", async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        await token0.getAddress(),
        await token1.getAddress(),
        25,
        1
      );
      expect(reserveA).to.equal("500721601459041764285");
      expect(reserveB).to.equal("20030067669194168064");
    });

    it("works with large numbers for the price", async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        await token0.getAddress(),
        await token1.getAddress(),
        ethers.MaxUint256 / 1000n,
        ethers.MaxUint256 / 1000n
      );
      // diff of 30 bips
      expect(reserveA).to.equal("100120248075158403008");
      expect(reserveB).to.equal("100150338345970840319");
    });
  });

  describe("#getLiquidityValue", () => {
    describe("fee is off", () => {
      it("produces the correct value after arbing to 1:105", async () => {
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
          await token0.getAddress(),
          await token1.getAddress(),
          1,
          105,
          expandTo18Decimals(5)
        );
        expect(token0Amount).to.equal("488683612488266114"); // slightly less than 5% of 10, or 0.5
        expect(token1Amount).to.equal("51161327957205755422"); // slightly more than 5% of 100, or 5
      });

      it("produces the correct value after arbing to 1:95", async () => {
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
          await token0.getAddress(),
          await token1.getAddress(),
          1,
          95,
          expandTo18Decimals(5)
        );
        expect(token0Amount).to.equal("512255881944227034"); // slightly more than 5% of 10, or 0.5
        expect(token1Amount).to.equal("48807237571060645526"); // slightly less than 5% of 100, or 5
      });

      it("produces correct value at the current price", async () => {
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
          await token0.getAddress(),
          await token1.getAddress(),
          1,
          100,
          expandTo18Decimals(5)
        );
        expect(token0Amount).to.equal("500000000000000000");
        expect(token1Amount).to.equal("50000000000000000000");
      });

      it("gas current price", async () => {
        // expect(
        //   await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
        //     await token0.getAddress(),
        //     await token1.getAddress(),
        //     1,
        //     100,
        //     expandTo18Decimals(5)
        //   )
        // ).to.equal("12705");
      });

      it("gas higher price", async () => {
        // expect(
        //   await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
        //     await token0.getAddress(),
        //     await token1.getAddress(),
        //     1,
        //     105,
        //     expandTo18Decimals(5)
        //   )
        // ).to.equal("13478");
      });

      it("gas lower price", async () => {
        // expect(
        //   await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
        //     await token0.getAddress(),
        //     await token1.getAddress(),
        //     1,
        //     95,
        //     expandTo18Decimals(5)
        //   )
        // ).to.equal("13523");
      });

      describe("after a swap", () => {
        beforeEach("swap to ~1:25", async () => {
          await token0.approve(await router.getAddress(), ethers.MaxUint256);
          const tx = await router.swapExactTokensForTokens(
            expandTo18Decimals(10),
            0,
            [await token0.getAddress(), await token1.getAddress()],
            await wallet.getAddress(),
            ethers.MaxUint256
          );
          await tx.wait();
          const [reserve0, reserve1] = await pair.getReserves();
          expect(reserve0).to.equal("20000000000000000000");
          expect(reserve1).to.equal("500751126690035052579"); // half plus the fee
        });

        it("is roughly 1/25th liquidity", async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            await token0.getAddress(),
            await token1.getAddress(),
            1,
            25,
            expandTo18Decimals(5)
          );

          expect(token0Amount).to.equal("1000000000000000000");
          expect(token1Amount).to.equal("25037556334501752628");
        });

        it("shares after arbing back to 1:100", async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            await token0.getAddress(),
            await token1.getAddress(),
            1,
            100,
            expandTo18Decimals(5)
          );

          expect(token0Amount).to.equal("501127678536722155");
          expect(token1Amount).to.equal("50037429168613534246");
        });
      });
    });

    describe("fee is on", () => {
      beforeEach("turn on fee", async () => {
        await factory.setFeeTo(await wallet.getAddress());
      });

      // this is necessary to cause kLast to be set
      beforeEach("mint more liquidity to address zero", async () => {
        await token0.transfer(await pair.getAddress(), expandTo18Decimals(10));
        await token1.transfer(await pair.getAddress(), expandTo18Decimals(1000));
        await pair.mint(ethers.ZeroAddress);
        expect(await pair.totalSupply()).to.equal(expandTo18Decimals(200));
      });

      describe("no fee to be collected", () => {
        it("produces the correct value after arbing to 1:105", async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            await token0.getAddress(),
            await token1.getAddress(),
            1,
            105,
            expandTo18Decimals(5)
          );
          expect(token0Amount).to.equal("488680839243189328"); // slightly less than 5% of 10, or 0.5
          expect(token1Amount).to.equal("51161037620273529068"); // slightly more than 5% of 100, or 5
        });

        it("produces the correct value after arbing to 1:95", async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            await token0.getAddress(),
            await token1.getAddress(),
            1,
            95,
            expandTo18Decimals(5)
          );
          expect(token0Amount).to.equal("512252817918759166"); // slightly more than 5% of 10, or 0.5
          expect(token1Amount).to.equal("48806945633721895174"); // slightly less than 5% of 100, or 5
        });

        it("produces correct value at the current price", async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            await token0.getAddress(),
            await token1.getAddress(),
            1,
            100,
            expandTo18Decimals(5)
          );
          expect(token0Amount).to.equal("500000000000000000");
          expect(token1Amount).to.equal("50000000000000000000");
        });
      });

      it("gas current price", async () => {
        // expect(
        //   await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
        //     await token0.getAddress(),
        //     await token1.getAddress(),
        //     1,
        //     100,
        //     expandTo18Decimals(5)
        //   )
        // ).to.equal("16938");
      });

      it("gas higher price", async () => {
        // expect(
        //   await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
        //     await token0.getAddress(),
        //     await token1.getAddress(),
        //     1,
        //     105,
        //     expandTo18Decimals(5)
        //   )
        // ).to.equal("18475");
      });

      it("gas lower price", async () => {
        // expect(
        //   await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
        //     await token0.getAddress(),
        //     await token1.getAddress(),
        //     1,
        //     95,
        //     expandTo18Decimals(5)
        //   )
        // ).to.equal("18406");
      });

      describe("after a swap", () => {
        beforeEach("swap to ~1:25", async () => {
          await token0.approve(await router.getAddress(), ethers.MaxUint256);
          const tx = await router.swapExactTokensForTokens(
            expandTo18Decimals(20),
            0,
            [await token0.getAddress(), await token1.getAddress()],
            await wallet.getAddress(),
            ethers.MaxUint256
          );
          await tx.wait();
          const [reserve0, reserve1] = await pair.getReserves();
          expect(reserve0).to.equal("40000000000000000000");
          expect(reserve1).to.equal("1001502253380070105158"); // half plus the fee
        });

        it("is roughly 1:25", async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            await token0.getAddress(),
            await token1.getAddress(),
            1,
            25,
            expandTo18Decimals(5)
          );

          expect(token0Amount).to.equal("999874953089810756");
          expect(token1Amount).to.equal("25034425465443434060");
        });

        it("shares after arbing back to 1:100", async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            await token0.getAddress(),
            await token1.getAddress(),
            1,
            100,
            expandTo18Decimals(5)
          );

          expect(token0Amount).to.equal("501002443792372662");
          expect(token1Amount).to.equal("50024924521757597314");
        });
      });
    });
  });
});
