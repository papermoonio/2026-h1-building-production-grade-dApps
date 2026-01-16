import { ethers } from "hardhat";
import * as EthersLib from "ethers";

async function main() {
  console.log("Deploying MiniSwap contract...");

  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider!;
  const network = await provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
  console.log(`Using deployer: ${await deployer.getAddress()}`);

  const balance = await provider.getBalance(await deployer.getAddress());
  console.log(`Deployer balance: ${balance.toString()}`);
  if (balance.toString() === '0') {
    throw new Error('Deployer account has zero balance. Fund the account on the target network and try again.');
  }

  const MiniSwap = await ethers.getContractFactory("MiniSwap");

  // Use network-suggested gas price to avoid txpool bans
  let gasPrice: any;
  if (typeof (provider as any).getGasPrice === 'function') {
    gasPrice = await (provider as any).getGasPrice();
  } else {
    const res = await provider.send('eth_gasPrice', []);
    console.log('eth_gasPrice raw:', res);
    gasPrice = BigInt(res);
  }
  console.log('Network gasPrice:', gasPrice.toString());

  const miniSwap = await MiniSwap.deploy({ gasPrice });

  await miniSwap.waitForDeployment();

  console.log(`MiniSwap contract deployed to: ${await miniSwap.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});