import { ethers } from "ethers";
import { readFileSync } from "fs";
import { TypedApi } from "polkadot-api";
import { devnet, hub } from "@polkadot-api/descriptors";
import { getPolkadotSigner } from "polkadot-api/signer";
import { accountId32ToH160, convertPublicKeyToSs58, getAlice } from "./accounts";
import { getApi, getProvider } from "./utils";

const asset = "0x0000000100000000000000000000000000010000"

const abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
];

export async function getERC20Balance(provider: ethers.JsonRpcProvider, address: string) {

    const contract = new ethers.Contract(asset, abi, provider);
    if (!contract || !contract.totalSupply || !contract.balanceOf) {
        throw new Error("Contract is not defined");
    }

    console.log("contract: ", await contract.getAddress());
    const balance = await contract.totalSupply();
    console.log("Balance: ", balance);
}


export async function createERC20Asset(api: TypedApi<typeof devnet | typeof hub>) {
    const alice = getAlice();
    const ss58Address = convertPublicKeyToSs58(alice.publicKey);
    console.log("ss58Address: ", ss58Address);
    const aliceSigner = getPolkadotSigner(
        alice.publicKey,
        "Sr25519",
        alice.sign,
    )
    const assetId = 1;

    const tx = api.tx.Assets.create({
        id: assetId,
        admin: { type: "Id", value: ss58Address },
        min_balance: BigInt(100),
    })

    const hash = await tx.signAndSubmit(aliceSigner);
    console.log("hash: ", hash.dispatchError?.value);

    const metadata = await api.query.Assets.Asset.getValue(assetId);
    console.log("metadata: ", metadata);

    const mintTx = api.tx.Assets.mint({
        id: assetId,
        beneficiary: { type: "Id", value: ss58Address },
        amount: BigInt(100000),

    })
    const hash2 = await mintTx.signAndSubmit(aliceSigner);
    console.log("hash: ", hash2);

    const balance = await api.query.Assets.Account.getValue(assetId, ss58Address);
    console.log("Balance: ", balance);
}

async function main() {
    const api = getApi(true);
    const provider = getProvider(true);
    await createERC20Asset(api);
    const alice = getAlice();
    const address = accountId32ToH160(alice.publicKey);
    console.log("address: ", address);
    await getERC20Balance(provider, address);
}

main();