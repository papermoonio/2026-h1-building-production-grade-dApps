/**
 * ============================================================
 * index.ts
 *
 * 一个完整的 Frontier / Revive 示例文件，展示：
 *
 * 1. Substrate(sr25519) 账户生成（HDKD / Alice / Random）
 * 2. SS58 地址生成
 * 3. AccountId32 ↔ EVM H160 地址确定性映射
 * 4. Substrate API（polkadot-api）
 * 5. EVM JSON-RPC Provider（ethers）
 * 6. 调用 EVM precompile（无 selector）
 * 7. Runtime pallet-assets 创建 ERC20（系统级代币）
 * ============================================================
 */

/* ============================================================
 * 账户 / 地址工具（HDKD）
 * ============================================================
 */

import {
    DEV_PHRASE,
    entropyToMiniSecret,
    mnemonicToEntropy,
    KeyPair,
    ss58Address,
  } from "@polkadot-labs/hdkd-helpers";
  import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
  import { randomBytes } from "crypto";
  
  /* ============================================================
   * Ethereum 工具
   * ============================================================
   */
  
  import { ethers, keccak256, getBytes, getAddress } from "ethers";
  
  /* ============================================================
   * Substrate API
   * ============================================================
   */
  
  import { getWsProvider } from "polkadot-api/ws-provider";
  import { createClient, TypedApi } from "polkadot-api";
  import { devnet, hub } from "@polkadot-api/descriptors";
  import { getPolkadotSigner } from "polkadot-api/signer";
  
  /* ============================================================
   * 网络配置
   * ============================================================
   */
  
  const LOCAL_EVM_RPC = "http://localhost:8545";
  const LOCAL_WS_RPC = "http://localhost:9944";
  
  const HUB_EVM_RPC = "https://services.polkadothub-rpc.com/testnet";
  const HUB_WS_RPC = "wss://asset-hub-paseo-rpc.n.dwellir.com";
  
  /* ============================================================
   * SS58 配置
   * ============================================================
   */
  
  const SS58_PREFIX = 42; // dev / generic
  
  /* ============================================================
   * 账户生成
   * ============================================================
   */
  
  // HD 派生：DEV_PHRASE + path
  export function getKeypairFromPath(path: string): KeyPair {
    const entropy = mnemonicToEntropy(DEV_PHRASE);
    const miniSecret = entropyToMiniSecret(entropy);
    const derive = sr25519CreateDerive(miniSecret);
    return derive(path);
  }
  
  // 开发链 Root 账户
  export const getAlice = () => getKeypairFromPath("//Alice");
  
  // 随机 Substrate 账户（不可恢复）
  export function getRandomSubstrateKeypair(): KeyPair {
    const seed = randomBytes(32);
    const miniSecret = entropyToMiniSecret(seed);
    const derive = sr25519CreateDerive(miniSecret);
    return derive("");
  }
  
  // SS58 地址
  export function convertPublicKeyToSs58(publicKey: Uint8Array): string {
    return ss58Address(publicKey, SS58_PREFIX);
  }
  
  /* ============================================================
   * AccountId32 ↔ EVM 地址
   * ============================================================
   */
  
  export type AccountId32 = Uint8Array;
  
  // 判断是否是 EVM 派生账户
  function isEthDerived(accountId: AccountId32): boolean {
    if (accountId.length !== 32) return false;
    for (let i = 20; i < 32; i++) {
      if (accountId[i] !== 0xee) return false;
    }
    return true;
  }
  
  // EVM → Substrate
  export function h160ToAccountId32(address: string): AccountId32 {
    const normalized = getAddress(address);
    const bytes = getBytes(normalized);
  
    if (bytes.length !== 20) {
      throw new Error("Invalid H160 address");
    }
  
    const accountId = new Uint8Array(32);
    accountId.fill(0xee);
    accountId.set(bytes, 0);
    return accountId;
  }
  
  // Substrate → EVM
  export function accountId32ToH160(accountId: AccountId32): string {
    if (accountId.length !== 32) {
      throw new Error("AccountId32 must be 32 bytes");
    }
  
    // 情况 1：EVM 派生（可逆）
    if (isEthDerived(accountId)) {
      const h160 = accountId.slice(0, 20);
      return getAddress("0x" + Buffer.from(h160).toString("hex"));
    }
  
    // 情况 2：普通 Substrate 账户（Frontier 标准）
    const hash = keccak256(accountId);
    const hashBytes = getBytes(hash);
    const h160 = hashBytes.slice(12, 32);
    return getAddress("0x" + Buffer.from(h160).toString("hex"));
  }
  
  // 生成随机 EVM 钱包
  export function generateRandomEthersWallet(): string {
    const wallet = ethers.Wallet.createRandom();
    console.log("EVM private key:", wallet.privateKey);
    return wallet.address;
  }
  
  /* ============================================================
   * Provider / API
   * ============================================================
   */
  
  export function getProvider(isLocal: boolean): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(
      isLocal ? LOCAL_EVM_RPC : HUB_EVM_RPC
    );
  }
  
  export function getApi(
    isLocal: boolean
  ): TypedApi<typeof devnet | typeof hub> {
    return createClient(
      getWsProvider(isLocal ? LOCAL_WS_RPC : HUB_WS_RPC)
    ).getTypedApi(isLocal ? devnet : hub);
  }
  
  /* ============================================================
   * Precompile 示例（无 selector）
   * ============================================================
   */
  
  const HASH_PRECOMPILE =
    "0x0000000000000000000000000000000000000002";
  
  export async function callHashPrecompile(
    provider: ethers.JsonRpcProvider
  ) {
    const result = await provider.call({
      to: HASH_PRECOMPILE,
      data: "0x12345678",
    });
  
    console.log("hash precompile result:", result);
  }
  
  /* ============================================================
   * Runtime 创建 ERC20（pallet-assets → ERC20 precompile）
   * ============================================================
   */
  
  const ASSET_ID = 1;
  const ERC20_PRECOMPILE =
    "0x0000000100000000000000000000000000010000";
  
  const ERC20_ABI = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
  ];
  
  export async function createERC20Asset(
    api: TypedApi<typeof devnet | typeof hub>
  ) {
    const alice = getAlice();
    const ss58 = convertPublicKeyToSs58(alice.publicKey);
  
    const signer = getPolkadotSigner(
      alice.publicKey,
      "Sr25519",
      alice.sign
    );
  
    await api.tx.Assets.create({
      id: ASSET_ID,
      admin: { type: "Id", value: ss58 },
      min_balance: BigInt(1),
    }).signAndSubmit(signer);
  
    await api.tx.Assets.mint({
      id: ASSET_ID,
      beneficiary: { type: "Id", value: ss58 },
      amount: BigInt(100000),
    }).signAndSubmit(signer);
  
    console.log("Asset created & minted");
  }
  
  /* ============================================================
   * main
   * ============================================================
   */
  
  async function main() {
    const api = getApi(true);
    const provider = getProvider(true);
  
    const alice = getAlice();
  
    console.log("Alice SS58:", convertPublicKeyToSs58(alice.publicKey));
    console.log(
      "Alice EVM:",
      accountId32ToH160(alice.publicKey)
    );
  
    await callHashPrecompile(provider);
    await createERC20Asset(api);
  
    const erc20 = new ethers.Contract(
      ERC20_PRECOMPILE,
      ERC20_ABI,
      provider
    );
  
    const evmAddr = accountId32ToH160(alice.publicKey);
    const balance = await erc20.balanceOf!(evmAddr);
    console.log("ERC20 balance:", balance.toString());
  }
  
  main().catch(console.error);
  