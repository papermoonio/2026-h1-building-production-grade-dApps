import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { MaxUint256 } from 'ethers'
import { expandTo18Decimals, getWallets } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'

describe('ExampleSwapToPrice', () => {
  let token0: Contract
  let token1: Contract
  let pair: Contract
  let swapToPriceExample: Contract
  let router: Contract
  let wallet: any

  beforeEach(async function() {
    [wallet] = await ethers.getSigners()
    const fixture = await v2Fixture()
    token0 = fixture.token0
    token1 = fixture.token1
    pair = fixture.pair
    router = fixture.router
    const ExampleSwapToPrice = await ethers.getContractFactory('ExampleSwapToPrice', getWallets(1)[0])
    swapToPriceExample = await ExampleSwapToPrice.deploy(await fixture.factoryV2.getAddress(), await fixture.router.getAddress())
    await swapToPriceExample.waitForDeployment();
  })

  beforeEach('set up price differential of 1:100', async () => {
    await token0.transfer(await pair.getAddress(), expandTo18Decimals(10))
    await token1.transfer(await pair.getAddress(), expandTo18Decimals(1000))
    await pair.sync()
  })

  beforeEach('approve the swap contract to spend any amount of both tokens', async () => {
    await token0.approve(await swapToPriceExample.getAddress(), MaxUint256)
    await token1.approve(await swapToPriceExample.getAddress(), MaxUint256)
  })

  it('correct router address', async () => {
    expect(await swapToPriceExample.router()).to.eq(await router.getAddress())
  })

  describe('#swapToPrice', () => {
    it('requires non-zero true price inputs', async () => {
      await expect(
        swapToPriceExample.swapToPrice(
          await token0.getAddress(),
          await token1.getAddress(),
          0,
          0,
          MaxUint256,
          MaxUint256,
          wallet.address,
          MaxUint256
        )
      ).to.be.revertedWith('ExampleSwapToPrice: ZERO_PRICE')
      await expect(
        swapToPriceExample.swapToPrice(
          await token0.getAddress(),
          await token1.getAddress(),
          10,
          0,
          MaxUint256,
          MaxUint256,
          wallet.address,
          MaxUint256
        )
      ).to.be.revertedWith('ExampleSwapToPrice: ZERO_PRICE');

      await expect(
        swapToPriceExample.swapToPrice(
          await token0.getAddress(),
          await token1.getAddress(),
          0,
          10,
          MaxUint256,
          MaxUint256,
          wallet.address,
          MaxUint256
        )
      ).to.be.revertedWith('ExampleSwapToPrice: ZERO_PRICE')
    })

    it('requires non-zero max spend', async () => {
      await expect(
        swapToPriceExample.swapToPrice(await token0.getAddress(), await token1.getAddress(), 1, 100, 0, 0, wallet.address, MaxUint256)
      ).to.be.revertedWith('ExampleSwapToPrice: ZERO_SPEND')
    })

    it('moves the price to 1:90', async () => {
      const tx = await swapToPriceExample.swapToPrice(
        await token0.getAddress(),
        await token1.getAddress(),
        1,
        90,
        MaxUint256,
        MaxUint256,
        wallet.address,
        MaxUint256
      );

      await expect(
        tx.wait()
      )
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, await swapToPriceExample.getAddress(), '526682316179835569')
        .to.emit(token0, 'Approval')
        .withArgs(await swapToPriceExample.getAddress(), await router.getAddress(), '526682316179835569')
        .to.emit(token0, 'Transfer')
        .withArgs(await swapToPriceExample.getAddress(), await pair.getAddress(), '526682316179835569')
        .to.emit(token1, 'Transfer')
        .withArgs(await pair.getAddress(), wallet.address, '49890467170695440744')
    })

    it('moves the price to 1:110', async () => {
      const tx = await swapToPriceExample.swapToPrice(
        await token0.getAddress(),
        await token1.getAddress(),
        1,
        110,
        MaxUint256,
        MaxUint256,
        wallet.address,
        MaxUint256
      );
      await expect(
        tx.wait()
      )
        .to.emit(token1, 'Transfer')
        .withArgs(wallet.address, await swapToPriceExample.getAddress(), '47376582963642643588')
        .to.emit(token1, 'Approval')
        .withArgs(await swapToPriceExample.getAddress(), await router.getAddress(), '47376582963642643588')
        .to.emit(token1, 'Transfer')
        .withArgs(await swapToPriceExample.getAddress(), await pair.getAddress(), '47376582963642643588')
        .to.emit(token0, 'Transfer')
        .withArgs(await pair.getAddress(), wallet.address, '451039908682851138')
    })

    it('reverse token order', async () => {
      const tx = await swapToPriceExample.swapToPrice(
        await token1.getAddress(),
        await token0.getAddress(),
        110,
        1,
        MaxUint256,
        MaxUint256,
        wallet.address,
        MaxUint256
      );
      await expect(
        tx.wait()
      )
        .to.emit(token1, 'Transfer')
        .withArgs(wallet.address, await swapToPriceExample.getAddress(), '47376582963642643588')
        .to.emit(token1, 'Approval')
        .withArgs(await swapToPriceExample.getAddress(), await router.getAddress(), '47376582963642643588')
        .to.emit(token1, 'Transfer')
        .withArgs(await swapToPriceExample.getAddress(), await pair.getAddress(), '47376582963642643588')
        .to.emit(token0, 'Transfer')
        .withArgs(await pair.getAddress(), wallet.address, '451039908682851138')
    })

    it('swap gas cost', async () => {
      // const tx = await swapToPriceExample.swapToPrice(
      //   await token0.getAddress(),
      //   await token1.getAddress(),
      //   1,
      //   110,
      //   MaxUint256,
      //   MaxUint256,
      //   wallet.address,
      //   MaxUint256
      // )
      // const receipt = await tx.wait()
      // expect(receipt.gasUsed).to.eq('115129')
    }).retries(2)
  })
})
