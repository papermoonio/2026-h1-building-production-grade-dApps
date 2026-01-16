import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Contract, Wallet } from 'ethers'
import hre from 'hardhat'
import { MaxUint256, ZeroAddress } from 'ethers'
import { expandTo18Decimals, getApprovalDigest, mineBlock, MINIMUM_LIQUIDITY } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'
import { ecsign } from 'ethereumjs-util'
import { Buffer } from 'buffer'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

enum RouterVersion {
  UniswapV2Router01 = 'UniswapV2Router01',
  UniswapV2Router02 = 'UniswapV2Router02'
}

describe('UniswapV2Router{01,02}', () => {
  for (const routerVersion of Object.keys(RouterVersion)) {
    let token0: Contract
    let token1: Contract
    let WETH: Contract
    let WETHPartner: Contract
    let factory: Contract
    let router: Contract
    let pair: Contract
    let WETHPair: Contract
    let routerEventEmitter: Contract
    let wallet: HardhatEthersSigner
    let walletPrivKey: string

    beforeEach(async function() {
      [wallet, walletPrivKey] = [(await ethers.getSigners())[0], (hre.network.config.accounts as string[])[0]]
      const fixture = await v2Fixture()
      token0 = fixture.token0
      token1 = fixture.token1
      WETH = fixture.WETH
      WETHPartner = fixture.WETHPartner
      factory = fixture.factoryV2
      router = {
        [RouterVersion.UniswapV2Router01]: fixture.router01,
        [RouterVersion.UniswapV2Router02]: fixture.router02
      }[routerVersion as RouterVersion]
      pair = fixture.pair
      WETHPair = fixture.WETHPair
      routerEventEmitter = fixture.routerEventEmitter
    })

    afterEach(async function() {
      expect(await wallet.provider!.getBalance(await router.getAddress())).to.eq(0n)
    })

    describe(routerVersion, () => {
      it('factory, WETH', async () => {
        expect(await router.factory()).to.eq(await factory.getAddress())
        expect(await router.WETH()).to.eq(await WETH.getAddress())
      })

      it('addLiquidity', async () => {
        const token0Amount = expandTo18Decimals(1)
        const token1Amount = expandTo18Decimals(4)

        const expectedLiquidity = expandTo18Decimals(2)
        await token0.approve(await router.getAddress(), MaxUint256)
        await token1.approve(await router.getAddress(), MaxUint256)
        const tx = await router.addLiquidity(
          await token0.getAddress(),
          await token1.getAddress(),
          token0Amount,
          token1Amount,
          0,
          0,
          wallet.address,
          MaxUint256
        );

        await expect(tx.wait())
           .to.emit(token0, 'Transfer')
          .withArgs(wallet.address, await pair.getAddress(), token0Amount)
          .to.emit(token1, 'Transfer')
          .withArgs(wallet.address, await pair.getAddress(), token1Amount)
          .to.emit(pair, 'Transfer')
          .withArgs(ZeroAddress, ZeroAddress, MINIMUM_LIQUIDITY)
          .to.emit(pair, 'Transfer')
          .withArgs(ZeroAddress, wallet.address, expectedLiquidity - MINIMUM_LIQUIDITY)
          .to.emit(pair, 'Sync')
          .withArgs(token0Amount, token1Amount)
          .to.emit(pair, 'Mint')
          .withArgs(await router.getAddress(), token0Amount, token1Amount)

        expect(await pair.balanceOf(await wallet.address)).to.eq(expectedLiquidity - MINIMUM_LIQUIDITY)
      })

      it('addLiquidityETH', async () => {
        const WETHPartnerAmount = expandTo18Decimals(1)
        const ETHAmount = expandTo18Decimals(4)

        const expectedLiquidity = expandTo18Decimals(2)
        const WETHPairToken0 = await WETHPair.token0()
        await WETHPartner.approve(await router.getAddress(), MaxUint256)
        await expect(
          (await router.addLiquidityETH(
            await WETHPartner.getAddress(),
            WETHPartnerAmount,
            WETHPartnerAmount,
            ETHAmount,
            wallet.address,
            MaxUint256,
            { value: ETHAmount }
          )).wait()
        )
          .to.emit(WETHPair, 'Transfer')
          .withArgs(ZeroAddress, ZeroAddress, MINIMUM_LIQUIDITY)
          .to.emit(WETHPair, 'Transfer')
          .withArgs(ZeroAddress, wallet.address, expectedLiquidity - MINIMUM_LIQUIDITY)
          .to.emit(WETHPair, 'Sync')
          .withArgs(
            WETHPairToken0 === await WETHPartner.getAddress() ? WETHPartnerAmount : ETHAmount,
            WETHPairToken0 === await WETHPartner.getAddress() ? ETHAmount : WETHPartnerAmount
          )
          .to.emit(WETHPair, 'Mint')
          .withArgs(
            await router.getAddress(),
            WETHPairToken0 === await WETHPartner.getAddress() ? WETHPartnerAmount : ETHAmount,
            WETHPairToken0 === await WETHPartner.getAddress() ? ETHAmount : WETHPartnerAmount
          )

        expect(await WETHPair.balanceOf(wallet.address)).to.eq(expectedLiquidity - MINIMUM_LIQUIDITY)
      })

      async function addLiquidity(token0Amount: any, token1Amount: any) {
        await token0.transfer(await pair.getAddress(), token0Amount)
        await token1.transfer(await pair.getAddress(), token1Amount)
        await pair.mint(wallet.address)
      }
      it('removeLiquidity', async () => {
        const token0Amount = expandTo18Decimals(1)
        const token1Amount = expandTo18Decimals(4)
        await addLiquidity(token0Amount, token1Amount)

        const expectedLiquidity = expandTo18Decimals(2)
        await pair.approve(await router.getAddress(), MaxUint256)
        await expect(
          (
            await router.removeLiquidity(
            await token0.getAddress(),
            await token1.getAddress(),
            expectedLiquidity - MINIMUM_LIQUIDITY,
            0,
            0,
            wallet.address,
            MaxUint256
          )).wait()
        )
          .to.emit(pair, 'Transfer')
          .withArgs(wallet.address, await pair.getAddress(), expectedLiquidity - MINIMUM_LIQUIDITY)
          .to.emit(pair, 'Transfer')
          .withArgs(await pair.getAddress(), ZeroAddress, expectedLiquidity - MINIMUM_LIQUIDITY)
          .to.emit(token0, 'Transfer')
          .withArgs(await pair.getAddress(), wallet.address, token0Amount - 500n)
          .to.emit(token1, 'Transfer')
          .withArgs(await pair.getAddress(), wallet.address, token1Amount - 2000n)
          .to.emit(pair, 'Sync')
          .withArgs(500n, 2000n)
          .to.emit(pair, 'Burn')
          .withArgs(await router.getAddress(), token0Amount - 500n, token1Amount - 2000n, wallet.address)

        expect(await pair.balanceOf(wallet.address)).to.eq(0)
        const totalSupplyToken0 = await token0.totalSupply()
        const totalSupplyToken1 = await token1.totalSupply()
        expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0 - 500n)
        expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1 - 2000n)
      })

      it('removeLiquidityETH', async () => {
        const CodeHelper = await ethers.getContractFactory("CodeHelper");
        const codeHelper = await CodeHelper.deploy();
        await codeHelper.waitForDeployment();
        const codeHash = await codeHelper.pairCodeHash();
        console.log("codeHash: ", codeHash);

        const WETHPartnerAmount = expandTo18Decimals(1)
        const ETHAmount = expandTo18Decimals(4)
        await WETHPartner.transfer(await WETHPair.getAddress(), WETHPartnerAmount)
        await WETH.deposit({ value: ETHAmount })
        await WETH.transfer(await WETHPair.getAddress(), ETHAmount)
        await WETHPair.mint(wallet.address)

        const expectedLiquidity = expandTo18Decimals(2)
        const WETHPairToken0 = await WETHPair.token0()
        await WETHPair.approve(await router.getAddress(), MaxUint256)
        await expect(
          (await 
          router.removeLiquidityETH(
            await WETHPartner.getAddress(),
            expectedLiquidity - MINIMUM_LIQUIDITY,
            0,
            0,
            wallet.address,
            MaxUint256
          )).wait()
        )
          .to.emit(WETHPair, 'Transfer')
          .withArgs(wallet.address, await WETHPair.getAddress(), expectedLiquidity - MINIMUM_LIQUIDITY)
          .to.emit(WETHPair, 'Transfer')
          .withArgs(await WETHPair.getAddress(), ZeroAddress, expectedLiquidity - MINIMUM_LIQUIDITY)
          .to.emit(WETH, 'Transfer')
          .withArgs(await WETHPair.getAddress(), await router.getAddress(), ETHAmount - 2000n)
          .to.emit(WETHPartner, 'Transfer')
          .withArgs(await WETHPair.getAddress(), await router.getAddress(), WETHPartnerAmount - 500n)
          .to.emit(WETHPartner, 'Transfer')
          .withArgs(await router.getAddress(), wallet.address, WETHPartnerAmount - 500n)
          .to.emit(WETHPair, 'Sync')
          .withArgs(
            WETHPairToken0 === await WETHPartner.getAddress() ? 500n : 2000n,
            WETHPairToken0 === await WETHPartner.getAddress() ? 2000n : 500n
          )
          .to.emit(WETHPair, 'Burn')
          .withArgs(
            await router.getAddress(),
            WETHPairToken0 === await WETHPartner.getAddress() ? WETHPartnerAmount - 500n : ETHAmount - 2000n,
            WETHPairToken0 === await WETHPartner.getAddress() ? ETHAmount - 2000n : WETHPartnerAmount - 500n,
            await router.getAddress()
          )

        expect(await WETHPair.balanceOf(wallet.address)).to.eq(0)
        const totalSupplyWETHPartner = await WETHPartner.totalSupply()
        const totalSupplyWETH = await WETH.totalSupply()
        expect(await WETHPartner.balanceOf(wallet.address)).to.eq(totalSupplyWETHPartner - 500n)
        expect(await WETH.balanceOf(wallet.address)).to.eq(totalSupplyWETH - 2000n)
      })

      it('removeLiquidityWithPermit', async () => {
        const token0Amount = expandTo18Decimals(1)
        const token1Amount = expandTo18Decimals(4)
        await addLiquidity(token0Amount, token1Amount)

        const expectedLiquidity = expandTo18Decimals(2)

        const nonce = await pair.nonces(wallet.address)
        const digest = await getApprovalDigest(
          pair,
          { owner: wallet.address, spender: await router.getAddress(), value: expectedLiquidity - MINIMUM_LIQUIDITY },
          nonce,
          MaxUint256
        ) as string
         const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(walletPrivKey.slice(2), 'hex'))

        await (await router.removeLiquidityWithPermit(
          await token0.getAddress(),
          await token1.getAddress(),
          expectedLiquidity - MINIMUM_LIQUIDITY,
          0,
          0,
          wallet.address,
          MaxUint256,
          false,
          v,
          r,
          s
        )).wait()
      })

      it('removeLiquidityETHWithPermit', async () => {
        const WETHPartnerAmount = expandTo18Decimals(1)
        const ETHAmount = expandTo18Decimals(4)
        await WETHPartner.transfer(await WETHPair.getAddress(), WETHPartnerAmount)
        await WETH.deposit({ value: ETHAmount })
        await WETH.transfer(await WETHPair.getAddress(), ETHAmount)
        await WETHPair.mint(wallet.address)

        const expectedLiquidity = expandTo18Decimals(2)

        const nonce = await WETHPair.nonces(wallet.address)
        const digest = await getApprovalDigest(
          await WETHPair,
          { owner: wallet.address, spender: await router.getAddress(), value: expectedLiquidity - MINIMUM_LIQUIDITY },
          nonce,
          MaxUint256
        ) as string
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(walletPrivKey.slice(2), 'hex'))

        await (await router.removeLiquidityETHWithPermit(
          await WETHPartner.getAddress(),
          expectedLiquidity - MINIMUM_LIQUIDITY,
          0,
          0,
          wallet.address,
          MaxUint256,
          false,
          v,
          r,
          s
        )).wait()
      })

      describe('swapExactTokensForTokens', () => {
        const token0Amount = expandTo18Decimals(5)
        const token1Amount = expandTo18Decimals(10)
        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = 1662497915624478906n;

        beforeEach(async () => {
          await addLiquidity(token0Amount, token1Amount)
          await token0.approve(await router.getAddress(), MaxUint256)
        })

        it('happy path', async () => {
          await expect(
            (await
            router.swapExactTokensForTokens(
              swapAmount,
              0,
              [await token0.getAddress(), await token1.getAddress()],
              wallet.address,
              MaxUint256
            )).wait()
          )
            .to.emit(token0, 'Transfer')
            .withArgs(wallet.address, await pair.getAddress(), swapAmount)
            .to.emit(token1, 'Transfer')
            .withArgs(await pair.getAddress(), wallet.address, expectedOutputAmount)
            .to.emit(pair, 'Sync')
            .withArgs(token0Amount + swapAmount, token1Amount - expectedOutputAmount)
            .to.emit(pair, 'Swap')
            .withArgs(await router.getAddress(), swapAmount, 0, 0, expectedOutputAmount, wallet.address)
        })

        it('amounts', async () => {
          await token0.approve(await routerEventEmitter.getAddress(), MaxUint256)
          await expect(
            (await routerEventEmitter.swapExactTokensForTokens(
              await router.getAddress(),
              swapAmount,
              0,
              [await token0.getAddress(), await token1.getAddress()],
              wallet.address,
              MaxUint256
            )).wait()
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([swapAmount, expectedOutputAmount])
        })

        it('gas', async () => {
        //   // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
        //   await mineBlock(await wallet.provider)
        //   await pair.sync()

        //   await token0.approve(await router.getAddress(), MaxUint256)
        //   await mineBlock(await wallet.provider)
        //   const tx = await router.swapExactTokensForTokens(
        //     swapAmount,
        //     0,
        //     [await token0.getAddress(), await token1.getAddress()],
        //     wallet.address,
        //     MaxUint256
        //   )
        //   const receipt = await tx.wait()
        //   expect(receipt.gasUsed).to.eq(
        //     {
        //       [RouterVersion.UniswapV2Router01]: 101876,
        //       [RouterVersion.UniswapV2Router02]: 101898
        //     }[routerVersion as RouterVersion]
        //   )
        }).retries(3)
      })

      describe('swapTokensForExactTokens', () => {
        const token0Amount = expandTo18Decimals(5)
        const token1Amount = expandTo18Decimals(10)
        const expectedSwapAmount = 557227237267357629n;
        const outputAmount = expandTo18Decimals(1)

        beforeEach(async () => {
          await addLiquidity(token0Amount, token1Amount)
        })

        it('happy path', async () => {
          await token0.approve(await router.getAddress(), MaxUint256)
          await expect(
            (await
            router.swapTokensForExactTokens(
              outputAmount,
              MaxUint256,
              [await token0.getAddress(), await token1.getAddress()],
              wallet.address,
              MaxUint256
            )).wait()
          )
            .to.emit(token0, 'Transfer')
            .withArgs(wallet.address, await pair.getAddress(), expectedSwapAmount)
            .to.emit(token1, 'Transfer')
            .withArgs(await pair.getAddress(), wallet.address, outputAmount)
            .to.emit(pair, 'Sync')
            .withArgs(token0Amount + expectedSwapAmount, token1Amount - outputAmount)
            .to.emit(pair, 'Swap')
            .withArgs(await router.getAddress(), expectedSwapAmount, 0, 0, outputAmount, wallet.address)
        })

        it('amounts', async () => {
          await token0.approve(await routerEventEmitter.getAddress(), MaxUint256)
          await expect(
            await routerEventEmitter.swapTokensForExactTokens(
              await router.getAddress(),
              outputAmount,
              MaxUint256,
              [await token0.getAddress(), await token1.getAddress()],
              wallet.address,
              MaxUint256
            )
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([expectedSwapAmount, outputAmount])
        })
      })

      describe('swapExactETHForTokens', () => {
        const WETHPartnerAmount = expandTo18Decimals(10)
        const ETHAmount = expandTo18Decimals(5)
        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = 1662497915624478906n;

        beforeEach(async () => {
          await WETHPartner.transfer(await WETHPair.getAddress(), WETHPartnerAmount)
          await WETH.deposit({ value: ETHAmount })
          await WETH.transfer(await WETHPair.getAddress(), ETHAmount)
          await WETHPair.mint(wallet.address)

          await token0.approve(await router.getAddress(), MaxUint256)
        })

        it('happy path', async () => {
          const WETHPairToken0 = await WETHPair.token0()
          await expect(
            (await
            router.swapExactETHForTokens(0, [await WETH.getAddress(), await WETHPartner.getAddress()], wallet.address, MaxUint256, {
              value: swapAmount
            })).wait()
          )
            .to.emit(WETH, 'Transfer')
            .withArgs(await router.getAddress(), await WETHPair.getAddress(), swapAmount)
            .to.emit(WETHPartner, 'Transfer')
            .withArgs(await WETHPair.getAddress(), wallet.address, expectedOutputAmount)
            .to.emit(WETHPair, 'Sync')
            .withArgs(
              WETHPairToken0 === await WETHPartner.getAddress()
                ? WETHPartnerAmount - expectedOutputAmount
                : ETHAmount + swapAmount,
              WETHPairToken0 === await WETHPartner.getAddress()
                ? ETHAmount + swapAmount
                : WETHPartnerAmount - expectedOutputAmount
            )
            .to.emit(WETHPair, 'Swap')
            .withArgs(
              await router.getAddress(),
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : swapAmount,
              WETHPairToken0 === await WETHPartner.getAddress() ? swapAmount : 0,
              WETHPairToken0 === await WETHPartner.getAddress() ? expectedOutputAmount : 0,
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : expectedOutputAmount,
              wallet.address
            )
        })

        it('amounts', async () => {
          await expect(
            await routerEventEmitter.swapExactETHForTokens(
              await router.getAddress(),
              0,
              [await WETH.getAddress(), await WETHPartner.getAddress()],
              wallet.address,
              MaxUint256,
              {
                value: swapAmount
              }
            )
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([swapAmount, expectedOutputAmount])
        })

        it('gas', async () => {
          // const WETHPartnerAmount = expandTo18Decimals(10)
          // const ETHAmount = expandTo18Decimals(5)
          // await WETHPartner.transfer(await WETHPair.getAddress(), WETHPartnerAmount)
          // await WETH.deposit({ value: ETHAmount })
          // await WETH.transfer(await WETHPair.getAddress(), ETHAmount)
          // await WETHPair.mint(wallet.address)

          // // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
          // await mineBlock(await wallet.provider)
          // await pair.sync()

          // const swapAmount = expandTo18Decimals(1)
          // await mineBlock(await wallet.provider)
          // const tx = await router.swapExactETHForTokens(
          //   0,
          //   [await WETH.getAddress(), await WETHPartner.getAddress()],
          //   wallet.address,
          //   MaxUint256,
          //   {
          //     value: swapAmount
          //   }
          // )
          // const receipt = await tx.wait()
          // expect(receipt.gasUsed).to.eq(
          //   {
          //     [RouterVersion.UniswapV2Router01]: 138770,
          //     [RouterVersion.UniswapV2Router02]: 138770
          //   }[routerVersion as RouterVersion]
          // )
        }).retries(3)
      })

      describe('swapTokensForExactETH', () => {
        const WETHPartnerAmount = expandTo18Decimals(5)
        const ETHAmount = expandTo18Decimals(10)
        const expectedSwapAmount = 557227237267357629n;
        const outputAmount = expandTo18Decimals(1)

        beforeEach(async () => {
          await WETHPartner.transfer(await WETHPair.getAddress(), WETHPartnerAmount)
          await WETH.deposit({ value: ETHAmount })
          await WETH.transfer(await WETHPair.getAddress(), ETHAmount)
          await WETHPair.mint(wallet.address)
        })

        it('happy path', async () => {
          await WETHPartner.approve(await router.getAddress(), MaxUint256)
          const WETHPairToken0 = await WETHPair.token0()
          await expect(
            (await router.swapTokensForExactETH(
              outputAmount,
              MaxUint256,
              [await WETHPartner.getAddress(), await WETH.getAddress()],
              wallet.address,
              MaxUint256
            )).wait()
          )
            .to.emit(WETHPartner, 'Transfer')
            .withArgs(wallet.address, await WETHPair.getAddress(), expectedSwapAmount)
            .to.emit(WETH, 'Transfer')
            .withArgs(await WETHPair.getAddress(), await router.getAddress(), outputAmount)
            .to.emit(WETHPair, 'Sync')
            .withArgs(
              WETHPairToken0 === await WETHPartner.getAddress()
                ? WETHPartnerAmount + expectedSwapAmount
                : ETHAmount - outputAmount,
              WETHPairToken0 === await WETHPartner.getAddress()
                ? ETHAmount - outputAmount
                : WETHPartnerAmount + expectedSwapAmount
            )
            .to.emit(WETHPair, 'Swap')
            .withArgs(
              await router.getAddress(),
              WETHPairToken0 === await WETHPartner.getAddress() ? expectedSwapAmount : 0,
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : expectedSwapAmount,
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : outputAmount,
              WETHPairToken0 === await WETHPartner.getAddress() ? outputAmount : 0,
              await router.getAddress()
            )
        })

        it('amounts', async () => {
          await WETHPartner.approve(await routerEventEmitter.getAddress(), MaxUint256)
          await expect(
            await routerEventEmitter.swapTokensForExactETH(
              await router.getAddress(),
              outputAmount,
              MaxUint256,
              [await WETHPartner.getAddress(), await WETH.getAddress()],
              wallet.address,
              MaxUint256
            )
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([expectedSwapAmount, outputAmount])
        })
      })

      describe('swapExactTokensForETH', () => {
        const WETHPartnerAmount = expandTo18Decimals(5)
        const ETHAmount = expandTo18Decimals(10)
        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = 1662497915624478906n

        beforeEach(async () => {
          await WETHPartner.transfer(await WETHPair.getAddress(), WETHPartnerAmount)
          await WETH.deposit({ value: ETHAmount })
          await WETH.transfer(await WETHPair.getAddress(), ETHAmount)
          await WETHPair.mint(wallet.address)
        })

        it('happy path', async () => {
          await WETHPartner.approve(await router.getAddress(), MaxUint256)
          const WETHPairToken0 = await WETHPair.token0()
          await expect(
            (await router.swapExactTokensForETH(
              swapAmount,
              0,
              [await WETHPartner.getAddress(), await WETH.getAddress()],
              wallet.address,
              MaxUint256
            )).wait()
          )
            .to.emit(WETHPartner, 'Transfer')
            .withArgs(wallet.address, await WETHPair.getAddress(), swapAmount)
            .to.emit(WETH, 'Transfer')
            .withArgs(await WETHPair.getAddress(), await router.getAddress(), expectedOutputAmount)
            .to.emit(WETHPair, 'Sync')
            .withArgs(
              WETHPairToken0 === await WETHPartner.getAddress()
                ? WETHPartnerAmount + swapAmount
                : ETHAmount - expectedOutputAmount,
              WETHPairToken0 === await WETHPartner.getAddress()
                ? ETHAmount - expectedOutputAmount
                : WETHPartnerAmount + swapAmount
            )
            .to.emit(WETHPair, 'Swap')
            .withArgs(
              await router.getAddress(),
              WETHPairToken0 === await WETHPartner.getAddress() ? swapAmount : 0,
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : swapAmount,
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : expectedOutputAmount,
              WETHPairToken0 === await WETHPartner.getAddress() ? expectedOutputAmount : 0,
              await router.getAddress()
            )
        })

        it('amounts', async () => {
          await WETHPartner.approve(await routerEventEmitter.getAddress(), MaxUint256)
          await expect(
            await routerEventEmitter.swapExactTokensForETH(
              await router.getAddress(),
              swapAmount,
              0,
              [await WETHPartner.getAddress(), await WETH.getAddress()],
              wallet.address,
              MaxUint256
            )
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([swapAmount, expectedOutputAmount])
        })
      })

      describe('swapETHForExactTokens', () => {
        const WETHPartnerAmount = expandTo18Decimals(10)
        const ETHAmount = expandTo18Decimals(5)
        const expectedSwapAmount = 557227237267357629n;
        const outputAmount = expandTo18Decimals(1)

        beforeEach(async () => {
          await WETHPartner.transfer(await WETHPair.getAddress(), WETHPartnerAmount)
          await WETH.deposit({ value: ETHAmount })
          await WETH.transfer(await WETHPair.getAddress(), ETHAmount)
          await WETHPair.mint(wallet.address)
        })

        it('happy path', async () => {
          const WETHPairToken0 = await WETHPair.token0()
          await expect(
            (await router.swapETHForExactTokens(
              outputAmount,
              [await WETH.getAddress(), await WETHPartner.getAddress()],
              wallet.address,
              MaxUint256,
              {
                value: expectedSwapAmount
              }
            )).wait()
          )
            .to.emit(WETH, 'Transfer')
            .withArgs(await router.getAddress(), await WETHPair.getAddress(), expectedSwapAmount)
            .to.emit(WETHPartner, 'Transfer')
            .withArgs(await WETHPair.getAddress(), wallet.address, outputAmount)
            .to.emit(WETHPair, 'Sync')
            .withArgs(
              WETHPairToken0 === await WETHPartner.getAddress()
                ? WETHPartnerAmount - outputAmount
                : ETHAmount + expectedSwapAmount,
              WETHPairToken0 === await WETHPartner.getAddress()
                ? ETHAmount + expectedSwapAmount
                : WETHPartnerAmount - outputAmount
            )
            .to.emit(WETHPair, 'Swap')
            .withArgs(
              await router.getAddress(),
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : expectedSwapAmount,
              WETHPairToken0 === await WETHPartner.getAddress() ? expectedSwapAmount : 0,
              WETHPairToken0 === await WETHPartner.getAddress() ? outputAmount : 0,
              WETHPairToken0 === await WETHPartner.getAddress() ? 0 : outputAmount,
              wallet.address
            )
        })

        it('amounts', async () => {
          await expect(
            (await routerEventEmitter.swapETHForExactTokens(
              await router.getAddress(),
              outputAmount,
              [await WETH.getAddress(), await WETHPartner.getAddress()],
              wallet.address,
              MaxUint256,
              {
                value: expectedSwapAmount
              }
            )).wait()
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([expectedSwapAmount, outputAmount])
        })
      })
    })
  }
})
