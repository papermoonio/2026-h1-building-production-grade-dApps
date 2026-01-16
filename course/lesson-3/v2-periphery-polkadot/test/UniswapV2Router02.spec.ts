import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { MaxUint256, parseUnits } from 'ethers'
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'
import { ecsign } from 'ethereumjs-util'
import { Buffer } from 'buffer'
import hre from 'hardhat'

describe('UniswapV2Router02', () => {
  let token0: Contract
  let token1: Contract
  let router: Contract
  let wallet: any
  let walletPrivKey: string

  beforeEach(async function() {
  [wallet, walletPrivKey] = [(await ethers.getSigners())[0], (hre.network.config.accounts as string[])[0]]
    const fixture = await v2Fixture()
    token0 = fixture.token0
    token1 = fixture.token1
    router = fixture.router02
  })

  it('quote', async () => {
    expect(await router.quote(1, 100, 200)).to.eq(2)
    expect(await router.quote(2, 200, 100)).to.eq(1)
    await expect(router.quote(0, 100, 200)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_AMOUNT')
    await expect(router.quote(1, 0, 200)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_LIQUIDITY')
    await expect(router.quote(1, 100, 0)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_LIQUIDITY')
  })

  it('getAmountOut', async () => {
    expect(await router.getAmountOut(2, 100, 100)).to.eq(1)
    await expect(router.getAmountOut(0, 100, 100)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT')
    await expect(router.getAmountOut(2, 0, 100)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_LIQUIDITY')
    await expect(router.getAmountOut(2, 100, 0)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_LIQUIDITY')
  })

  it('getAmountIn', async () => {
    expect(await router.getAmountIn(1, 100, 100)).to.eq(2)
    await expect(router.getAmountIn(0, 100, 100)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT')
    await expect(router.getAmountIn(1, 0, 100)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_LIQUIDITY')
    await expect(router.getAmountIn(1, 100, 0)).to.be.revertedWith('UniswapV2Library: INSUFFICIENT_LIQUIDITY')
  })

  it('getAmountsOut', async () => {
    await token0.approve(await router.getAddress(), MaxUint256)
    await token1.approve(await router.getAddress(), MaxUint256)
    let tx = await router.addLiquidity(
      await token0.getAddress(),
      await token1.getAddress(),
      10000,
      10000,
      0,
      0,
      wallet.address,
      MaxUint256
    );
    await tx.wait();
    await expect(router.getAmountsOut(2, [await token0.getAddress()])).to.be.revertedWith('UniswapV2Library: INVALID_PATH')
    const path = [await token0.getAddress(), await token1.getAddress()]
    expect(await router.getAmountsOut(2, path)).to.deep.eq([2, 1])
  })

  it('getAmountsIn', async () => {
    await token0.approve(await router.getAddress(), MaxUint256)
    await token1.approve(await router.getAddress(), MaxUint256)
    let tx = await router.addLiquidity(
      await token0.getAddress(),
      await token1.getAddress(),
      10000,
      10000,
      0,
      0,
      await wallet.getAddress(),
      MaxUint256
    );
    await tx.wait();
    await expect(router.getAmountsIn(1, [await token0.getAddress()])).to.be.revertedWith('UniswapV2Library: INVALID_PATH')
    const path = [await token0.getAddress(), await token1.getAddress()]
    expect(await router.getAmountsIn(1, path)).to.deep.eq([2, 1])
  })
})

describe('fee-on-transfer tokens', () => {
  let wallet: any
  let walletPrivKey: string
  let DTT: any
  let WETH: Contract
  let router: Contract
  let pair: any

  beforeEach(async function() {
    [wallet, walletPrivKey] = [(await ethers.getSigners())[0], (hre.network.config.accounts as string[])[0]]
    const fixture = await v2Fixture()
    WETH = fixture.WETH
    router = fixture.router02
    const DeflatingERC20 = await ethers.getContractFactory('DeflatingERC20')
    DTT = await DeflatingERC20.deploy(expandTo18Decimals(10000))
    await DTT.waitForDeployment()
    await fixture.factoryV2.createPair(await DTT.getAddress(), await WETH.getAddress())
    const pairAddress = await fixture.factoryV2.getPair(await DTT.getAddress(), await WETH.getAddress())
    pair = await ethers.getContractAt('IUniswapV2Pair', pairAddress)
  })

  afterEach(async function() {
    expect(await wallet.provider.getBalance(await router.getAddress())).to.eq(0n)
  })

  async function addLiquidity(DTTAmount: bigint, WETHAmount: bigint) {
    await DTT.approve(await router.getAddress(), MaxUint256)
    let tx = await router.addLiquidityETH(
      await DTT.getAddress(),
      DTTAmount,
      DTTAmount,
      WETHAmount,
      await wallet.getAddress(),
      MaxUint256,
      { value: WETHAmount }
    );
    await tx.wait();
  }

  it('removeLiquidityETHSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(1)
    const ETHAmount = expandTo18Decimals(4)
    await addLiquidity(DTTAmount, ETHAmount)
    const DTTInPair = await DTT.balanceOf(await pair.getAddress())
    const WETHInPair = await WETH.balanceOf(await pair.getAddress())
    const liquidity = await pair.balanceOf(await wallet.getAddress())
    const totalSupply = await pair.totalSupply()
    const NaiveDTTExpected = DTTInPair * liquidity / totalSupply
    const WETHExpected = WETHInPair * liquidity / totalSupply
    await pair.approve(await router.getAddress(), MaxUint256)
    await router.removeLiquidityETHSupportingFeeOnTransferTokens(
      await DTT.getAddress(),
      liquidity,
      NaiveDTTExpected,
      WETHExpected,
      await wallet.getAddress(),
      MaxUint256
    )
  })

  it('removeLiquidityETHWithPermitSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(1) * 100n / 99n
    const ETHAmount = expandTo18Decimals(4)
    await addLiquidity(DTTAmount, ETHAmount)
    const expectedLiquidity = expandTo18Decimals(2)
    const nonce = await pair.nonces(await wallet.getAddress())
    const digest = await getApprovalDigest(
      pair,
      { owner: await wallet.getAddress(), spender: await router.getAddress(), value: expectedLiquidity - MINIMUM_LIQUIDITY },
      nonce,
      MaxUint256
    )
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(walletPrivKey.slice(2), 'hex'))
    const DTTInPair = await DTT.balanceOf(await pair.getAddress())
    const WETHInPair = await WETH.balanceOf(await pair.getAddress())
    const liquidity = await pair.balanceOf(await wallet.getAddress())
    const totalSupply = await pair.totalSupply()
    const NaiveDTTExpected = DTTInPair * liquidity / totalSupply
    const WETHExpected = WETHInPair * liquidity / totalSupply
    await pair.approve(await router.getAddress(), MaxUint256)
    await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      await DTT.getAddress(),
      liquidity,
      NaiveDTTExpected,
      WETHExpected,
      await wallet.getAddress(),
      MaxUint256,
      false,
      v,
      r,
      s
    )
  })

  describe('swapExactTokensForTokensSupportingFeeOnTransferTokens', () => {
    const DTTAmount = expandTo18Decimals(5) * 100n / 99n
    const ETHAmount = expandTo18Decimals(10)
    const amountIn = expandTo18Decimals(1)
    beforeEach(async () => {
      await addLiquidity(DTTAmount, ETHAmount)
    })
    it('DTT -> WETH', async () => {
      await DTT.approve(await router.getAddress(), MaxUint256)
      let tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [await DTT.getAddress(), await WETH.getAddress()],
        await wallet.getAddress(),
        MaxUint256
      )
      await tx.wait();
    })
    it('WETH -> DTT', async () => {
      await WETH.deposit({ value: amountIn })
      await WETH.approve(await router.getAddress(), MaxUint256)
      let tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [await WETH.getAddress(), await DTT.getAddress()],
        await wallet.getAddress(),
        MaxUint256
      )
      await tx.wait();
    })
  })

  it('swapExactETHForTokensSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(10) * 100n / 99n
    const ETHAmount = expandTo18Decimals(5)
    const swapAmount = expandTo18Decimals(1)
    await addLiquidity(DTTAmount, ETHAmount)
    let tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [await WETH.getAddress(), await DTT.getAddress()],
      await wallet.getAddress(),
      MaxUint256,
      { value: swapAmount }
    );
    await tx.wait();
  })

  it('swapExactTokensForETHSupportingFeeOnTransferTokens', async () => {
    const DTTAmount = expandTo18Decimals(5) * 100n / 99n
    const ETHAmount = expandTo18Decimals(10)
    const swapAmount = expandTo18Decimals(1)
    await addLiquidity(DTTAmount, ETHAmount)
    await DTT.approve(await router.getAddress(), MaxUint256)
    let tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      swapAmount,
      0,
      [await DTT.getAddress(), await WETH.getAddress()],
      await wallet.getAddress(),
      MaxUint256
    );
    await tx.wait();
  })
})

describe('fee-on-transfer tokens: reloaded', () => {
  let wallet: any
  let DTT: any
  let DTT2: any
  let router: Contract
  beforeEach(async function() {
    [wallet] = await ethers.getSigners()
    const fixture = await v2Fixture()
    router = fixture.router02
    const DeflatingERC20 = await ethers.getContractFactory('DeflatingERC20')
    DTT = await DeflatingERC20.deploy(expandTo18Decimals(10000))
    await DTT.waitForDeployment()
    DTT2 = await DeflatingERC20.deploy(expandTo18Decimals(10000))
    await DTT2.waitForDeployment()
    await fixture.factoryV2.createPair(await DTT.getAddress(), await DTT2.getAddress())
    const pairAddress = await fixture.factoryV2.getPair(await DTT.getAddress(), await DTT2.getAddress())
  })
  afterEach(async function() {
    expect(await wallet.provider.getBalance(await router.getAddress())).to.eq(0n)
  })
  async function addLiquidity(DTTAmount: bigint, DTT2Amount: bigint) {
    await DTT.approve(await router.getAddress(), MaxUint256)
    await DTT2.approve(await router.getAddress(), MaxUint256)
    let tx = await router.addLiquidity(
      await DTT.getAddress(),
      await DTT2.getAddress(),
      DTTAmount,
      DTT2Amount,
      DTTAmount,
      DTT2Amount,
      await wallet.getAddress(),
      MaxUint256
    );
    await tx.wait();
  }
  describe('swapExactTokensForTokensSupportingFeeOnTransferTokens', () => {
    const DTTAmount = expandTo18Decimals(5) * 100n / 99n
    const DTT2Amount = expandTo18Decimals(5)
    const amountIn = expandTo18Decimals(1)
    beforeEach(async () => {
      await addLiquidity(DTTAmount, DTT2Amount)
    })
    it('DTT -> DTT2', async () => {
      await DTT.approve(await router.getAddress(), MaxUint256)
      let tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [await DTT.getAddress(), await DTT2.getAddress()],
        await wallet.getAddress(),
        MaxUint256
      )
      await tx.wait()
    })
  })
})
