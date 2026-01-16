import { ethers } from "hardhat";
import * as EthersLib from "ethers";

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log("Using signer:", await signer.getAddress());

  const provider = signer.provider!;
  let gasPrice: any;
  if (typeof (provider as any).getGasPrice === 'function') {
    gasPrice = await (provider as any).getGasPrice();
  } else {
    const res = await provider.send('eth_gasPrice', []);
    console.log('eth_gasPrice raw:', res);
    gasPrice = BigInt(res);
  }
  console.log('Suggested gasPrice:', gasPrice.toString());

  const tx = {
    to: await signer.getAddress(),
    value: 0n,
    gasLimit: 21000n,
    gasPrice: gasPrice, // use provider suggested gasPrice
    type: 0,
  } as any;

  try {
    const sent = await signer.sendTransaction(tx);
    console.log("Sent tx:", sent.hash);
    const receipt = await sent.wait();
    console.log("Receipt:", receipt);
  } catch (err) {
    console.error("Error sending tx:", err);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });