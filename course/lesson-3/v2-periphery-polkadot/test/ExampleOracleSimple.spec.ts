// import { expect } from 'chai'
// import { ethers } from 'hardhat'
// import { Contract } from 'ethers'
// import { expandTo18Decimals, mineBlock, encodePrice, getWallets } from './shared/utilities'
// import { v2Fixture } from './shared/fixtures'

// const token0Amount = expandTo18Decimals(5)
// const token1Amount = expandTo18Decimals(10)

// describe('ExampleOracleSimple', () => {
//   let token0: Contract
//   let token1: Contract
//   let pair: Contract
//   let exampleOracleSimple: Contract
//   let wallet: any

//   async function addLiquidity() {
//     await token0.transfer(await pair.getAddress(), token0Amount)
//     await token1.transfer(await pair.getAddress(), token1Amount)
//     await pair.mint(wallet.address)
//   }

//   beforeEach(async function() {
//     [wallet] = await ethers.getSigners()
//     const fixture = await v2Fixture()
//     token0 = fixture.token0
//     token1 = fixture.token1
//     pair = fixture.pair
//     await addLiquidity()
//     const ExampleOracleSimple = await ethers.getContractFactory('ExampleOracleSimple', getWallets(1)[0])
//     exampleOracleSimple = await ExampleOracleSimple.deploy(
//       await fixture.factoryV2.getAddress(),
//       await token0.getAddress(),
//       await token1.getAddress()
//     )
//     await exampleOracleSimple.waitForDeployment()
//   })

//   it('update', async () => {
//     const blockTimestamp = (await pair.getReserves())[2]
//     await mineBlock(ethers.provider, Number(blockTimestamp) + 60 * 60 * 23)
//     await expect(exampleOracleSimple.update()).to.be.reverted
//     await mineBlock(ethers.provider, Number(blockTimestamp) + 60 * 60 * 24)
//     await exampleOracleSimple.update()

//     const expectedPrice = encodePrice(token0Amount, token1Amount)

//     expect(await exampleOracleSimple.price0Average()).to.eq(expectedPrice[0])
//     expect(await exampleOracleSimple.price1Average()).to.eq(expectedPrice[1])

//     expect(await exampleOracleSimple.consult(await token0.getAddress(), token0Amount)).to.eq(token1Amount)
//     expect(await exampleOracleSimple.consult(await token1.getAddress(), token1Amount)).to.eq(token0Amount)
//   })
// })
