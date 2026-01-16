import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expandTo18Decimals } from './utilities';
import { getWallets } from "./utilities";

// interface IUniswapV1Factory {
//   initializeFactory(exchangeTemplate: string): Promise<any>;
//   createExchange(token: string): Promise<any>;
//   getExchange(token: string): Promise<string>;
// }

interface IUniswapV2Factory {
  createPair(tokenA: string, tokenB: string): Promise<any>;
  getPair(tokenA: string, tokenB: string): Promise<string>;
}

interface IUniswapV2Pair {
  token0(): Promise<string>;
}

type BaseContract = Contract & { deploymentTransaction(): any };

interface V2Fixture {
  token0: BaseContract;
  token1: BaseContract;
  WETH: BaseContract;
  WETHPartner: BaseContract;
  // factoryV1: BaseContract & IUniswapV1Factory;
  factoryV2: BaseContract & IUniswapV2Factory;
  router01: BaseContract;
  router02: BaseContract;
  routerEventEmitter: BaseContract;
  router: BaseContract;
  migrator: BaseContract | null;
  // WETHExchangeV1: BaseContract;
  pair: BaseContract & IUniswapV2Pair;
  WETHPair: BaseContract & IUniswapV2Pair;
}

const overrides = {
  gasLimit: 9999999
}

export async function v2Fixture(): Promise<V2Fixture> {
  const [wallet] = await ethers.getSigners();
  const [walletForLargeContract] = getWallets(1);

  // deploy tokens
  const ERC20 = await ethers.getContractFactory("ERC20");
  const tokenA = (await ERC20.deploy(expandTo18Decimals(10000))) as unknown as BaseContract;
  await tokenA.waitForDeployment();
  const tokenB = (await ERC20.deploy(expandTo18Decimals(10000))) as unknown as BaseContract;
  await tokenB.waitForDeployment();
  const WETH = (await ethers.getContractFactory("WETH9").then(f => f.deploy())) as unknown as BaseContract;
  await WETH.waitForDeployment();
  const WETHPartner = (await ERC20.deploy(expandTo18Decimals(10000))) as unknown as BaseContract;
  await WETHPartner.waitForDeployment();

  // deploy V1
  // const UniswapV1Factory = await ethers.getContractFactory("UniswapV1Factory");
  // const UniswapV1Exchange = await ethers.getContractFactory("UniswapV1Exchange");
  // const factoryV1 = (await UniswapV1Factory.deploy()) as unknown as BaseContract & IUniswapV1Factory;
  // await factoryV1.waitForDeployment();
  // const exchangeTemplate = (await UniswapV1Exchange.deploy()) as unknown as BaseContract;
  // await exchangeTemplate.waitForDeployment();
  // await factoryV1.initializeFactory(await exchangeTemplate.getAddress());

  // deploy V2
  const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factoryV2 = (await UniswapV2Factory.deploy(wallet.address)) as unknown as BaseContract & IUniswapV2Factory;
  await factoryV2.waitForDeployment();

  // deploy routers
  const UniswapV2Router01 = await ethers.getContractFactory("UniswapV2Router01", walletForLargeContract);
  const UniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02", walletForLargeContract);
  const router01 = (await UniswapV2Router01.deploy(await factoryV2.getAddress(), await WETH.getAddress())) as unknown as BaseContract;
  await router01.waitForDeployment();

  const router02 = (await UniswapV2Router02.deploy(await factoryV2.getAddress(), await WETH.getAddress())) as unknown as BaseContract;
  await router02.waitForDeployment();  

  // event emitter for testing
  const RouterEventEmitter = await ethers.getContractFactory("RouterEventEmitter");
  const routerEventEmitter = (await RouterEventEmitter.deploy()) as unknown as BaseContract;
  await routerEventEmitter.waitForDeployment();

  // deploy migrator
  // const UniswapV2Migrator = await ethers.getContractFactory("UniswapV2Migrator");
  // const migrator = (await UniswapV2Migrator.deploy(await factoryV1.getAddress(), await router01.getAddress())) as unknown as BaseContract;
  // await migrator.waitForDeployment();

  // initialize V1
  // await factoryV1.createExchange(await WETHPartner.getAddress());
  // const WETHExchangeV1Address = await factoryV1.getExchange(await WETHPartner.getAddress());
  // const WETHExchangeV1 = (await ethers.getContractAt("UniswapV1Exchange", WETHExchangeV1Address)) as unknown as BaseContract;

  // upload Pair contracts
  const UniswapV2Pair = await ethers.getContractFactory("UniswapV2Pair", walletForLargeContract);
  const pairForUpload = await UniswapV2Pair.deploy();
  await pairForUpload.waitForDeployment();

  // initialize V2
  await factoryV2.createPair(await tokenA.getAddress(), await tokenB.getAddress());
  const pairAddress = await factoryV2.getPair(await tokenA.getAddress(), await tokenB.getAddress());
  const pair = (await ethers.getContractAt("UniswapV2Pair", pairAddress)) as unknown as BaseContract & IUniswapV2Pair;

  const token0Address = await pair.token0();
  const token0 = (await tokenA.getAddress()) === token0Address ? tokenA : tokenB;
  const token1 = (await tokenA.getAddress()) === token0Address ? tokenB : tokenA;

  await factoryV2.createPair(await WETH.getAddress(), await WETHPartner.getAddress());
  const WETHPairAddress = await factoryV2.getPair(await WETH.getAddress(), await WETHPartner.getAddress());
  const WETHPair = (await ethers.getContractAt("UniswapV2Pair", WETHPairAddress)) as unknown as BaseContract & IUniswapV2Pair;

  return {
    token0,
    token1,
    WETH,
    WETHPartner,
    // factoryV1,
    factoryV2,
    router01,
    router02,
    router: router02, // the default router, 01 had a minor bug
    routerEventEmitter,
    migrator: null,
    // WETHExchangeV1,
    pair,
    WETHPair
  };
}
