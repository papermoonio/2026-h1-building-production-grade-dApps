import { ethers } from "hardhat";
import { Contract, Wallet } from "ethers";
import { parseEther, keccak256, AbiCoder, toUtf8Bytes, solidityPacked } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

declare const hre: HardhatRuntimeEnvironment;

export const MINIMUM_LIQUIDITY = BigInt(10)**BigInt(3);

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
);

export function expandTo18Decimals(n: number): bigint {
  return parseEther(n.toString());
}

async function getDomainSeparator(name: string, tokenAddress: string) {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log("chainId from provider:", chainId);
  return keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
        keccak256(toUtf8Bytes(name)),
        keccak256(toUtf8Bytes('1')),
        BigInt(chainId),
        tokenAddress
      ]
    )
  );
}

export async function getApprovalDigest(
  token: Contract,
  approve: {
    owner: string;
    spender: string;
    value: bigint;
  },
  nonce: bigint,
  deadline: bigint
): Promise<string> {
  const name = await token.name();
  const DOMAIN_SEPARATOR = await getDomainSeparator(name, await token.getAddress());
  return keccak256(
    solidityPacked(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          AbiCoder.defaultAbiCoder().encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
          )
        )
      ]
    )
  );
}

export async function mineBlock(timestamp: number): Promise<void> {
  await ethers.provider.send("evm_mine", [timestamp]);
}

export function encodePrice(reserve0: bigint, reserve1: bigint) {
  return [
    (reserve1 * 2n ** 112n) / reserve0,
    (reserve0 * 2n ** 112n) / reserve1
  ];
}


// get the n wallets from hardhat config
export function getWallets(n: number): Wallet[] {
  const provider = new ethers.JsonRpcProvider(hre.network.config.url);
  const accounts = hre.network.config.accounts as string[];
  const allWallets = accounts.map((account: string) => new Wallet(account, provider));
  return allWallets.slice(0, n);
}