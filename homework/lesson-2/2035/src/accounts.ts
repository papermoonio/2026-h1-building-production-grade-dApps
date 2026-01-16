import { getAddress, getBytes, keccak256 } from "ethers";
import { ss58Address } from "@polkadot-labs/hdkd-helpers";

const SS58_PREFIX = 42;

export type AccountId32 = Uint8Array;

/**
 * Check if an AccountId32 is derived from an EVM address
 * EVM-derived addresses have 0xEE padding in bytes 20-31
 */
function isEthDerived(accountId: AccountId32): boolean {
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

/**
 * Convert H160 (EVM address) to AccountId32 (Substrate address)
 * Mapping rule:
 * 1. Take 20 bytes of EVM address
 * 2. Place them in bytes 0-19 of a 32-byte array
 * 3. Fill remaining 12 bytes (20-31) with 0xEE
 */
export function h160ToAccountId32(evmAddress: string): AccountId32 {
    const normalizedAddress = getAddress(evmAddress);
    const addressBytes = getBytes(normalizedAddress);

    if (addressBytes.length !== 20) {
        throw new Error(`H160 address must be 20 bytes, got ${addressBytes.length}`);
    }

    const accountId = new Uint8Array(32);
    accountId.fill(0xEE);
    accountId.set(addressBytes, 0);

    return accountId;
}

/**
 * Convert AccountId32 to H160 (EVM address)
 * - If EVM-derived: extract first 20 bytes
 * - If native Substrate: hash with keccak256 and take last 20 bytes
 */
export function accountId32ToH160(accountId: AccountId32): string {
    if (accountId.length !== 32) {
        throw new Error(`AccountId32 must be 32 bytes, got ${accountId.length}`);
    }

    if (isEthDerived(accountId)) {
        const h160Bytes = accountId.slice(0, 20);
        const addressHex = '0x' + Buffer.from(h160Bytes).toString('hex');
        return getAddress(addressHex);
    } else {
        const hash = keccak256(accountId);
        const hashBytes = getBytes(hash);
        const h160Bytes = hashBytes.slice(12, 32);
        const addressHex = '0x' + Buffer.from(h160Bytes).toString('hex');
        return getAddress(addressHex);
    }
}

/**
 * Convert 32-byte AccountId to SS58 string format
 */
export function convertPublicKeyToSs58(publicKey: Uint8Array): string {
    return ss58Address(publicKey, SS58_PREFIX);
}
