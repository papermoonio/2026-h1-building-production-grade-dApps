import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { keccak256, getBytes, getAddress } from 'ethers';

const SS58_PREFIX = 42;

function isEthDerived(accountId) {
  if (accountId.length !== 32) {
    return false;
  }
  for (let i = 20; i < 32; i++) {
    if (accountId[i] !== 0xEE) {
      return false;
    }
  }
  return true;
}

export function substrateToEvmAddress(substrateAddress) {
  const publicKey = decodeAddress(substrateAddress);
  
  if (isEthDerived(publicKey)) {
    const h160Bytes = publicKey.slice(0, 20);
    const addressHex = '0x' + Buffer.from(h160Bytes).toString('hex');
    return getAddress(addressHex).toLowerCase();
  } else {
    const hash = keccak256(publicKey);
    const hashBytes = getBytes(hash);
    const h160Bytes = hashBytes.slice(12, 32);
    const addressHex = '0x' + Buffer.from(h160Bytes).toString('hex');
    return getAddress(addressHex).toLowerCase();
  }
}

export function evmToSubstrateAddress(evmAddress, ss58Format = SS58_PREFIX) {
  const normalizedAddress = getAddress(evmAddress);
  const addressBytes = getBytes(normalizedAddress);
  
  const accountId = new Uint8Array(32);
  accountId.fill(0xEE);
  accountId.set(addressBytes, 0);
  
  const substrateAddress = encodeAddress(accountId, ss58Format);
  return substrateAddress;
}

export function validateEvmAddress(address) {
  try {
    getAddress(address);
    return true;
  } catch {
    return false;
  }
}

export function validateSubstrateAddress(address) {
  try {
    decodeAddress(address);
    return true;
  } catch {
    return false;
  }
}

export function getEvmAddressBytes(address) {
  return getBytes(address);
}

export function getSubstrateAddressBytes(address) {
  return decodeAddress(address);
}

export function batchConvertToEvm(substrateAddresses) {
  return substrateAddresses.map(addr => ({
    substrate: addr,
    evm: substrateToEvmAddress(addr),
    isValidSubstrate: validateSubstrateAddress(addr)
  }));
}

export function batchConvertToSubstrate(evmAddresses) {
  return evmAddresses.map(addr => ({
    evm: addr,
    substrate: evmToSubstrateAddress(addr),
    isValidEvm: validateEvmAddress(addr)
  }));
}
