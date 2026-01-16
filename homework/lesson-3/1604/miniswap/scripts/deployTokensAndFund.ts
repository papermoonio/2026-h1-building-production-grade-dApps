import { ethers } from 'hardhat';

async function main() {
  const recipient = process.env.TARGET_ADDRESS || '0x03983bBdeDf5887B7261145DFbaF2359A99397cC';
  const fundAmount = ethers.parseEther('10000');

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const provider = deployer.provider!;
  const deployerAddr = await deployer.getAddress();
  const balance = await provider.getBalance(deployerAddr);

  console.log(`Deployer: ${deployerAddr} balance: ${balance.toString()}`);
  if (balance.toString() === '0') {
    throw new Error('Deployer has zero balance. Fund the deployer account and retry.');
  }

  // Fetch network gasPrice
  let gasPrice: bigint;
  if (typeof (provider as any).getGasPrice === 'function') {
    gasPrice = await (provider as any).getGasPrice();
  } else {
    const res: any = await provider.send('eth_gasPrice', []);
    gasPrice = BigInt(res);
  }
  console.log('Using gasPrice:', gasPrice.toString());

  console.log(`Deploying Mock tokens and funding ${recipient} with ${ethers.formatEther(fundAmount)} tokens`);

  const MockERC20 = await ethers.getContractFactory('MockERC20');
  const tokenA = await MockERC20.deploy('Token A', 'TKNA', ethers.parseEther('1000000'), { gasPrice });
  await tokenA.waitForDeployment();
  console.log(`Token A deployed to: ${await tokenA.getAddress()}`);

  const tokenB = await MockERC20.deploy('Token B', 'TKNB', ethers.parseEther('1000000'), { gasPrice });
  await tokenB.waitForDeployment();
  console.log(`Token B deployed to: ${await tokenB.getAddress()}`);

  // Transfer funds to recipient (include gasPrice)
  console.log(`Transferring ${ethers.formatEther(fundAmount)} tokens to ${recipient}...`);
  const txA = await tokenA.transfer(recipient, fundAmount, { gasPrice });
  console.log(`Token A transfer tx: ${txA.hash}`);
  await txA.wait();

  const txB = await tokenB.transfer(recipient, fundAmount, { gasPrice });
  console.log(`Token B transfer tx: ${txB.hash}`);
  await txB.wait();

  const balA = await tokenA.balanceOf(recipient);
  const balB = await tokenB.balanceOf(recipient);

  console.log(`Final balances for ${recipient}: TKNA=${ethers.formatEther(balA)}, TKNB=${ethers.formatEther(balB)}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });