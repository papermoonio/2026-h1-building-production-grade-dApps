// import { expect } from 'chai'
// import { ethers } from 'hardhat'
// import { Contract } from 'ethers'
// import { expandTo18Decimals } from './shared/utilities'
// import { v2Fixture } from './shared/fixtures'
// import ExampleFlashSwapArtifact from '../build/ExampleFlashSwap.json'

// describe('ExampleFlashSwap', () => {
//   let WETH: Contract
//   let WETHPartner: Contract
//   let WETHExchangeV1: Contract
//   let WETHPair: Contract
//   let flashSwapExample: Contract
//   let wallet: any

//   beforeEach(async function() {
//     [wallet] = await ethers.getSigners()
//     const fixture = await v2Fixture()
//     WETH = fixture.WETH
//     WETHPartner = fixture.WETHPartner
//     // WETHExchangeV1 = fixture.WETHExchangeV1
//     WETHPair = fixture.WETHPair
//     flashSwapExample = await ethers.deployContract(
//       ExampleFlashSwapArtifact.abi,
//       ExampleFlashSwapArtifact.bytecode,
//       [fixture.factoryV2.address, fixture.factoryV1.address, fixture.router.address]
//     )
//     await flashSwapExample.waitForDeployment()
//   })

//   it('uniswapV2Call:0', async () => {
//     // add liquidity to V1 at a rate of 1 ETH / 200 X
//     const WETHPartnerAmountV1 = expandTo18Decimals(2000)
//     const ETHAmountV1 = expandTo18Decimals(10)
//     await WETHPartner.approve(WETHExchangeV1.getAddress(), WETHPartnerAmountV1)
//     await WETHExchangeV1.addLiquidity(1, WETHPartnerAmountV1, ethers.MaxUint256, {
//       value: ETHAmountV1
//     })

//     // add liquidity to V2 at a rate of 1 ETH / 100 X
//     const WETHPartnerAmountV2 = expandTo18Decimals(1000)
//     const ETHAmountV2 = expandTo18Decimals(10)
//     await WETHPartner.transfer(WETHPair.getAddress(), WETHPartnerAmountV2)
//     await WETH.deposit({ value: ETHAmountV2 })
//     await WETH.transfer(WETHPair.getAddress(), ETHAmountV2)
//     await WETHPair.mint(wallet.address)

//     const balanceBefore = await WETHPartner.balanceOf(wallet.address)

//     // now, execute arbitrage via uniswapV2Call:
//     // receive 1 ETH from V2, get as much X from V1 as we can, repay V2 with minimum X, keep the rest!
//     const arbitrageAmount = expandTo18Decimals(1)
//     const WETHPairToken0 = await WETHPair.token0()
//     const amount0 = WETHPairToken0 === WETHPartner.address ? 0 : arbitrageAmount
//     const amount1 = WETHPairToken0 === WETHPartner.address ? arbitrageAmount : 0
//     await WETHPair.swap(
//       amount0,
//       amount1,
//       await flashSwapExample.getAddress(),
//       ethers.AbiCoder.defaultAbiCoder().encode(['uint'], [1])
//     )

//     const balanceAfter = await WETHPartner.balanceOf(wallet.address)
//     const profit = balanceAfter.sub(balanceBefore).div(expandTo18Decimals(1))
//     const reservesV1 = [
//       await WETHPartner.balanceOf(WETHExchangeV1.getAddress()),
//       await ethers.provider.getBalance(WETHExchangeV1.getAddress())
//     ]
//     const priceV1 = reservesV1[0].div(reservesV1[1])
//     const reservesV2 = (await WETHPair.getReserves()).slice(0, 2)
//     const priceV2 =
//       WETHPairToken0 === WETHPartner.address ? reservesV2[0].div(reservesV2[1]) : reservesV2[1].div(reservesV2[0])

//     expect(profit.toString()).to.eq('69') // our profit is ~69 tokens
//     expect(priceV1.toString()).to.eq('165') // we pushed the v1 price down to ~165
//     expect(priceV2.toString()).to.eq('123') // we pushed the v2 price up to ~123
//   })

//   it('uniswapV2Call:1', async () => {
//     // add liquidity to V1 at a rate of 1 ETH / 100 X
//     const WETHPartnerAmountV1 = expandTo18Decimals(1000)
//     const ETHAmountV1 = expandTo18Decimals(10)
//     await WETHPartner.approve(WETHExchangeV1.getAddress(), WETHPartnerAmountV1)
//     await WETHExchangeV1.addLiquidity(1, WETHPartnerAmountV1, ethers.MaxUint256, {
//       value: ETHAmountV1
//     })

//     // add liquidity to V2 at a rate of 1 ETH / 200 X
//     const WETHPartnerAmountV2 = expandTo18Decimals(2000)
//     const ETHAmountV2 = expandTo18Decimals(10)
//     await WETHPartner.transfer(WETHPair.getAddress(), WETHPartnerAmountV2)
//     await WETH.deposit({ value: ETHAmountV2 })
//     await WETH.transfer(WETHPair.getAddress(), ETHAmountV2)
//     await WETHPair.mint(wallet.address)

//     const balanceBefore = await ethers.provider.getBalance(wallet.address)

//     // now, execute arbitrage via uniswapV2Call:
//     // receive 200 X from V2, get as much ETH from V1 as we can, repay V2 with minimum ETH, keep the rest!
//     const arbitrageAmount = expandTo18Decimals(200)
//     const WETHPairToken0 = await WETHPair.token0()
//     const amount0 = WETHPairToken0 === WETHPartner.address ? arbitrageAmount : 0
//     const amount1 = WETHPairToken0 === WETHPartner.address ? 0 : arbitrageAmount
//     await WETHPair.swap(
//       amount0,
//       amount1,
//       await flashSwapExample.getAddress(),
//       ethers.AbiCoder.defaultAbiCoder().encode(['uint'], [1])
//     )

//     const balanceAfter = await ethers.provider.getBalance(wallet.address)
//     const profit = balanceAfter.sub(balanceBefore)
//     const reservesV1 = [
//       await WETHPartner.balanceOf(WETHExchangeV1.getAddress()),
//       await ethers.provider.getBalance(WETHExchangeV1.getAddress())
//     ]
//     const priceV1 = reservesV1[0].div(reservesV1[1])
//     const reservesV2 = (await WETHPair.getReserves()).slice(0, 2)
//     const priceV2 =
//       WETHPairToken0 === WETHPartner.address ? reservesV2[0].div(reservesV2[1]) : reservesV2[1].div(reservesV2[0])

//     expect(ethers.formatEther(profit)).to.eq('0.548043441089763649') // our profit is ~.5 ETH
//     expect(priceV1.toString()).to.eq('143') // we pushed the v1 price up to ~143
//     expect(priceV2.toString()).to.eq('161') // we pushed the v2 price down to ~161
//   })
// })
