import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  await cryptoWaitReady();

  const pkHex = process.env.POLKADOT_PRIVATE_KEY || '';
  if (!pkHex) throw new Error('POLKADOT_PRIVATE_KEY not set in .env');
  const clean = pkHex.startsWith('0x') ? pkHex.slice(2) : pkHex;
  const seed = Buffer.from(clean, 'hex');

  const target = '5Dqa7MTY74NjdT5kpkSMcShPjKxPkBAHggx8Hf7mAacU9drx';
  console.log('Looking for match to:', target);

  const types: ('sr25519' | 'ed25519' | 'ecdsa')[] = ['sr25519', 'ed25519', 'ecdsa'];
  for (const type of types) {
    try {
      const kr = new Keyring({ type });
      const pair = kr.addFromSeed(seed);
      const pubHex = Buffer.from(pair.publicKey).toString('hex');
      console.log(`\nKey type: ${type}  pubkey: 0x${pubHex}`);

      for (let format = 0; format < 256; format++) {
        try {
          kr.setSS58Format(format);
          const addr = pair.address;
          if (addr === target) {
            console.log(`MATCH! type=${type} ss58Format=${format} -> ${addr}`);
            return;
          }
        } catch (e) {
          // ignore invalid formats
        }
      }
    } catch (e) {
      console.error('error for type', type, e);
    }
  }

  console.log('No match found across types and formats.');
  console.log('Check if the polkadot.js account was derived from a different seed/mnemonic or used a derivation path.');
}

main().catch((e) => { console.error(e); process.exitCode = 1; });