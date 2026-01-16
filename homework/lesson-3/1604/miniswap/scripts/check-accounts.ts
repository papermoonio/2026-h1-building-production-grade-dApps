import { ethers } from "hardhat";
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  await cryptoWaitReady();

  const pkHex = process.env.POLKADOT_PRIVATE_KEY || '';
  if (!pkHex) {
    throw new Error('POLKADOT_PRIVATE_KEY not set in .env');
  }

  // Ensure hex prefix
  const clean = pkHex.startsWith('0x') ? pkHex.slice(2) : pkHex;
  const seed = Buffer.from(clean, 'hex');

  // Derive Ethereum address (H160) from private key
  const wallet = new (ethers as any).Wallet('0x' + clean);
  const ethAddress = wallet.address;

  // Derive SS58 (substrate) address from the same private key using ECDSA
  const keyring = new Keyring({ type: 'ecdsa' });
  const pair = keyring.addFromSeed(seed);
  const ss58 = pair.address;

  console.log(`Private key (hex): 0x${clean}`);
  console.log(`Ethereum (H160) address: ${ethAddress}`);
  console.log(`Substrate (SS58) address: ${ss58}`);

  // Query balances via RPC
  const provider = (await ethers.getSigners())[0].provider!;
  const ethBal = await provider.getBalance(ethAddress).catch(() => null);
  const substrateBal = await provider.send('system_accountNextIndex', [ss58]).catch(() => null);

  console.log(`eth_getBalance(${ethAddress}) => ${ethBal ? ethBal.toString() : 'error or unavailable'}`);
  console.log(`Note: Substrate native balances are best checked in polkadot.js apps UI; ` +
              `the JSON-RPC method used depends on node (we attempted a lightweight probe).`);
  console.log(`If the SS58 account shows funds in polkadot.js, those are native-chain balances and may not reflect EVM H160 balances.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });