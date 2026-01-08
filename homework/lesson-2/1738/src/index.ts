import {
    DEV_PHRASE,
    entropyToMiniSecret,
    mnemonicToEntropy,
    KeyPair,
    ss58Address,
} from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import { ethers, keccak256, getBytes, getAddress } from "ethers";
import { getWsProvider } from "polkadot-api/ws-provider";
import { createClient, TypedApi } from "polkadot-api";
import { devnet } from "@polkadot-api/descriptors";
import { getPolkadotSigner } from "polkadot-api/signer";

/* ===================== config ===================== */
// 网络配置 （Local）
const WS_RPC = "http://localhost:9944";  // Substrate WS
const EVM_RPC = "http://localhost:8545";  // EVM JSON-RPC

// Substrate 地址网络标识（它决定了：5GrwvaEF...  ← 前缀不同）
const SS58_PREFIX = 42;  // 42 = Substrate / dev / generic （Polkadot 主网是 0，Kusama 是 2）

// HASH_PRECOMPILE
const HASH_PRECOMPILE = "0x0000000000000000000000000000000000000002";
// ERC20_PRECOMPILE
const ERC20_PRECOMPILE = "0x0000000100000000000000000000000000010000";

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
];

// 定义 AssetId (Frontier 会把 assetId = 1, 映射成固定的 ERC20 precompile 地址)
const ASSET_ID = 1;

/* ===================== account ===================== */
// getAlice（开发链的 Root 账户，所有 dev chain 都内置，拥有 sudo 权限）
function getAlice(): KeyPair {
    const entropy = mnemonicToEntropy(DEV_PHRASE);
    const mini = entropyToMiniSecret(entropy);
    const derive = sr25519CreateDerive(mini);
    return derive("//Alice");
}

// SS58 地址生成
function toSs58(pub: Uint8Array): string {
    return ss58Address(pub, SS58_PREFIX);
}

/* ===================== address mapping ===================== */
// AccountId32 的定义
type AccountId32 = Uint8Array;  // Substrate 的账户本质 = 32 字节数组

// 这个 AccountId32 是不是「从 EVM 地址派生来的」
function isEthDerived(a: AccountId32): boolean {
    return a.slice(20).every((x) => x === 0xee);
}

// Substrate AccountId32 → EVM 地址
function accountId32ToH160(a: AccountId32): string {
    if (isEthDerived(a)) {
        return getAddress("0x" + Buffer.from(a.slice(0, 20)).toString("hex"));
    }
    const hash = keccak256(a);
    return getAddress("0x" + Buffer.from(getBytes(hash).slice(12)).toString("hex"));
}

/* ===================== main ===================== */

async function main() {
    const api = createClient(getWsProvider(WS_RPC)).getTypedApi(devnet);
    const provider = new ethers.JsonRpcProvider(EVM_RPC);

    const alice = getAlice();
    const ss58 = toSs58(alice.publicKey);
    const evmAddr = accountId32ToH160(alice.publicKey);

    console.log("\n=== Address Mapping ===");
    console.log("SS58          :", ss58);
    console.log("EVM           :", evmAddr);

    /* -------- precompile -------- */
    // 调用预编译功能对data进行hash编码
    const hashResult = await provider.call({
        to: HASH_PRECOMPILE,
        data: "0x12345678",
    });

    console.log("\n=== Precompile ===");
    console.log("hash result:", hashResult);

    /* -------- create asset -------- */
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
        amount: BigInt(300000),
    }).signAndSubmit(signer);

    /* -------- runtime balance -------- */
    const runtimeAccount =
        await api.query.Assets.Account.getValue(
            ASSET_ID,
            ss58
        );

    console.log("\n=== Runtime Balance ===");
    console.log("Assets pallet:", runtimeAccount?.balance.toString());

    /* -------- evm balance -------- */
    const erc20 = new ethers.Contract(
        ERC20_PRECOMPILE,
        ERC20_ABI,
        provider
    );

    const evmBalance = await erc20.balanceOf!(evmAddr);

    console.log("\n=== EVM Balance ===");
    console.log("ERC20 balance:", evmBalance.toString());
}

main().catch(console.error);
