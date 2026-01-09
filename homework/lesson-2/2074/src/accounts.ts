import { DEV_PHRASE, entropyToMiniSecret, mnemonicToEntropy, KeyPair, ss58Address } from "@polkadot-labs/hdkd-helpers"
import { sr25519CreateDerive } from "@polkadot-labs/hdkd"
import { keccak256, getBytes, getAddress } from "ethers"
import { randomBytes } from 'crypto'
import { ethers } from "ethers";

const SS58_PREFIX = 42;

export function getKeypairFromPath(path: string): KeyPair {
    const entropy = mnemonicToEntropy(DEV_PHRASE)
    const miniSecret = entropyToMiniSecret(entropy)
    const derive = sr25519CreateDerive(miniSecret)
    const hdkdKeyPair = derive(path)
    return hdkdKeyPair
}

export const getAlice = () => getKeypairFromPath("//Alice")

export function getRandomSubstrateKeypair(): KeyPair {
    const seed = randomBytes(32);
    const miniSecret = entropyToMiniSecret(seed)
    const derive = sr25519CreateDerive(miniSecret)
    const hdkdKeyPair = derive("")

    return hdkdKeyPair
}

export function convertPublicKeyToSs58(publickey: Uint8Array) {
    return ss58Address(publickey, SS58_PREFIX);
}
export type AccountId32 = Uint8Array;

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

export function h160ToAccountId32(address: string): AccountId32 {

    const normalizedAddress = getAddress(address);
    const addressBytes = getBytes(normalizedAddress);

    if (addressBytes.length !== 20) {
        throw new Error(`H160 address must be 20 bytes, got ${addressBytes.length}`);
    }
    const accountId = new Uint8Array(32);
    accountId.fill(0xEE);
    accountId.set(addressBytes, 0);

    return accountId;
}

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

export function generateRandomEthersWallet(): string {
    const account = ethers.Wallet.createRandom();
    console.log("new account private key is ", account.privateKey);
    return account.address;
}

async function main() {
    const alice = getAlice();
    console.log("Alice ss58 address is ", convertPublicKeyToSs58(alice.publicKey));
}

main()