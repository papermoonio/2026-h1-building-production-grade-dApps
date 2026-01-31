# ERC1963 + Subgraph + Polkadot Hub: Framework & Step-by-Step Guide

Use **ERC1963** as your smart contract name. This guide walks you through building the contract, indexing it with a Subgraph ([The Graph Quick Start](https://thegraph.com/docs/en/subgraphs/quick-start/)), deploying to **Polkadot Hub TestNet**, and getting it **verified on Routescan** so it appears at [Polkadot Testnet Verified Contracts](https://polkadot.testnet.routescan.io/blockchain/verified-contracts).

---

## What You’ll Learn (Learning Outcomes)

| Area | What You Learn |
|------|----------------|
| **Smart contracts** | Solidity basics, events for indexing, deployment with **Foundry** (Forge + Cast), and verification. |
| **The Graph** | Subgraph manifest, schema, and mappings; how on-chain events become queryable GraphQL data. |
| **Polkadot Hub** | EVM on Polkadot (REVM), testnet (Chain ID 420420417), RPC, and faucet. |
| **Verification** | Contract verification on Routescan (source + compiler match). |
| **Full stack** | Contract → indexer → API → UI; reading from Subgraph in a frontend. |

---

## Prerequisites

- [ ] **Foundry** (Forge, Cast, Anvil) — [install](https://book.getfoundry.sh/getting-started/installation)  
- [ ] Node.js + npm/yarn/pnpm (for Graph CLI later)  
- [ ] Crypto wallet (e.g. MetaMask)  
- [ ] [Subgraph Studio](https://thegraph.com/studio/) account (wallet connect)  
- [ ] PAS testnet tokens from [Polkadot Faucet](https://faucet.polkadot.io/) (for Polkadot Hub TestNet). On Polkadot Hub the native token for gas is **PAS**, not ETH; Forge may still show “ETH” in estimates — that refers to the chain’s native token (PAS here).

---

## Phase 1: Smart Contract (ERC1963)

**Goal:** Deploy a contract named **ERC1963** that emits events your Subgraph will index.

### Step 1.1 – Project setup (Foundry)

This repo is already set up. If starting from scratch:

```bash
forge init erc1963-subgraph-polkadot --no-commit
cd erc1963-subgraph-polkadot
forge install foundry-rs/forge-std --no-commit
```

Copy `foundry.toml`, `contracts/ERC1963.sol`, and `script/Deploy.s.sol` from this repo. Use a `.env` (never commit) with `PRIVATE_KEY=` and optional `RPC_URL=`.

### Step 1.2 – Polkadot Hub TestNet

Set in `.env`:

- `PRIVATE_KEY` — deployer key (with or without `0x`).
- `RPC_URL` — e.g. `https://eth-rpc-testnet.polkadot.io/` (optional; you can pass `--rpc-url` when deploying).

### Step 1.3 – The ERC1963 contract

`contracts/ERC1963.sol` has:

- Simple state: `value`, `lastSetter`.
- **Events** for every state change: `ValueUpdated(address indexed user, uint256 newValue)`.
- Functions: `setValue(uint256)` and `getValue()`.

**Why events matter:** The Subgraph indexes these events into entities. No events ⇒ nothing useful to index.

### Step 1.4 – Deploy with Forge

```bash
forge build
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

Or with explicit URL: `--rpc-url https://eth-rpc-testnet.polkadot.io/`. The script prints **contract address** and **deployment block** (use as Subgraph `startBlock`). Any “ETH” in Forge’s gas estimate is the chain’s native token — on Polkadot Hub that is **PAS**.

**Interacting with the contract (Cast):**

- **Read:** `cast call <CONTRACT_ADDRESS> "getValue()" --rpc-url $RPC_URL`
- **Write:** `cast send <CONTRACT_ADDRESS> "setValue(uint256)" <VALUE> --rpc-url $RPC_URL --private-key $PRIVATE_KEY`

**Checkpoint:** Contract is on Polkadot Hub TestNet; you can read/write via **Cast** or Remix.

**If deploy fails with receipt errors:** The Polkadot Hub public RPC often returns **503**, **null receipt**, or times out when Forge polls for the transaction receipt. Forge then reports "Failure on receiving a receipt" and leaves the tx as "pending" in `broadcast/`. On the **next** run Forge re-sends the same tx → **"Transaction Already Imported"** (1013); retrying leads to **"Transaction is temporarily banned"** (1012). **Prevent the loop:** After **any** run that fails with "Failure on receiving a receipt", run **once**: `./scripts/clear-pending-deploy.sh` so the next deploy is fresh (no re-send). Then (1) Check the block explorer for the tx hash in `broadcast/Deploy.s.sol/420420417/run-latest.json`; if it’s "Contract Creation", use that **contract address** and **block** in `subgraph/subgraph.yaml`. (2) To deploy again, run `forge script ... --broadcast` (fresh nonce). **If you get "Transaction is temporarily banned":** switch RPC (same account): in `.env` set `RPC_URL=https://services.polkadothub-rpc.com/testnet` (see `.env.example`) and try again.

---

## Phase 2: Subgraph for ERC1963

**Goal:** Index ERC1963 events and expose them via GraphQL.

### Step 2.1 – Install Graph CLI

```bash
npm install -g @graphprotocol/graph-cli@latest
graph --version
```

### Step 2.2 – Create Subgraph in Studio

1. Go to [Subgraph Studio](https://thegraph.com/studio/).  
2. Connect wallet → **Create a Subgraph**.  
3. Name it e.g. **ERC1963 Polkadot Hub**.

### Step 2.3 – Initialize Subgraph (from contract)

From your project root:

```bash
graph init
```

When prompted:

- **Protocol:** Ethereum (Polkadot Hub is EVM-compatible).  
- **Subgraph slug:** same as in Studio (e.g. `erc1963-polkadot-hub`).  
- **Directory:** e.g. `./subgraph` or current dir.  
- **Network:** use the one that matches Polkadot Hub (or “mainnet” and then change in manifest).  
- **Contract address:** your deployed ERC1963 address.  
- **ABI:** path to Foundry artifact `out/ERC1963.sol/ERC1963.json` (the file has an `abi` key; if the CLI wants a plain ABI file, copy it: `jq '.abi' out/ERC1963.sol/ERC1963.json > abi/ERC1963.json`).  
- **Start block:** deployment block from Step 1.4.  
- **Contract name:** ERC1963.  
- **Index contract events as entities:** Yes (then refine schema/mappings as needed).

### Step 2.4 – Edit the Subgraph

You’ll work with three pieces:

| File | Role |
|------|------|
| `subgraph.yaml` | Data sources, network, start block, ABI, event handlers. |
| `schema.graphql` | Entities (e.g. `ValueUpdate`, `User`). |
| `src/mapping.ts` | Handlers that map events → entities. |

- In `subgraph.yaml`: set the correct **network name** and **startBlock** for Polkadot Hub if the CLI didn’t. The Graph may list it as a custom network; use the slug they expect (e.g. see [Supported Networks](https://thegraph.com/docs/en/supported-networks/)).  
- In `schema.graphql`: define entities that match your events (e.g. one entity per event type).  
- In `mapping.ts`: in each handler, create/update entities and save with `entity.save()`.

### Step 2.5 – Build and deploy to Studio

```bash
cd subgraph   # if your subgraph is in ./subgraph
graph codegen && graph build
graph auth <DEPLOY_KEY>
graph deploy <SUBGRAPH_SLUG>
```

Get **DEPLOY_KEY** and **SUBGRAPH_SLUG** from the Subgraph page in Studio.

### Step 2.6 – Test queries in Studio

Use the Studio playground to run GraphQL queries against your Subgraph (e.g. list all `ValueUpdate` entities).

**Checkpoint:** Subgraph is deployed and returning data from ERC1963 events.

---

## Phase 3: Polkadot Hub Deployment & Routescan Verification

**Goal:** Contract is live on Polkadot Hub TestNet and **verified** on [Routescan](https://polkadot.testnet.routescan.io/blockchain/verified-contracts).

### Step 3.1 – Deploy (if not already)

You did this in Phase 1. Ensure you have:

- Contract address  
- Compiler version (e.g. 0.8.20)  
- Optimizer runs (e.g. 200) from `foundry.toml`

### Step 3.2 – Verify on Routescan

1. Open [Polkadot Testnet Routescan](https://polkadot.testnet.routescan.io/).  
2. Search for your **contract address**.  
3. Go to the **Contract** tab → **Verify & Publish**.  
4. Choose **Solidity (Single file)** or **Standard JSON**. For single file: `forge flatten contracts/ERC1963.sol`. For standard JSON: `forge build --force` then use the input from `out/ERC1963.sol/ERC1963.json` or Foundry’s standard-input output.  
5. Enter:  
   - Compiler version  
   - Optimization (e.g. 200 runs)  
   - Contract name: `ERC1963`  
   - Paste source or upload JSON  
6. Submit. After verification, your contract appears under **Verified Contracts**.

**Checkpoint:** ERC1963 is verified and scanable on Routescan.

---

## Phase 4: UI for Polkadot Hub

**Goal:** A simple UI that (1) interacts with ERC1963 on Polkadot Hub, and (2) reads from your Subgraph.

### Step 4.1 – Frontend setup

Use React/Vite (or your stack). Install:

- `ethers` or `viem` for contract calls.  
- `graphql` + `graphql-request` or Apollo for Subgraph queries.

### Step 4.2 – Connect to Polkadot Hub TestNet

- **Chain ID:** 420420417  
- **RPC:** e.g. `https://eth-rpc-testnet.polkadot.io/`  
- **Block explorer:** `https://polkadot.testnet.routescan.io`  
- **Native token:** **PAS** (gas/fees are in PAS, not ETH)

Add this network in MetaMask (or use your app’s network config).

### Step 4.3 – Contract interaction

- **Read:** call `getValue()` via provider.  
- **Write:** connect signer, call `setValue(value)`, wait for tx.  
- Use your ERC1963 ABI and deployed address.

### Step 4.4 – Subgraph integration

- Use the **Query URL** from Subgraph Studio (or from Graph Explorer after publishing).  
- Run a GraphQL query (e.g. “last 10 ValueUpdates”).  
- Display results in the UI (history, leaderboard, etc.).

**Checkpoint:** UI reads/writes ERC1963 and displays indexed data from the Subgraph.

---

## Step-by-Step Checklist (Follow-Up)

- [ ] **1** – Foundry project + `.env` (PRIVATE_KEY, RPC_URL)  
- [ ] **2** – ERC1963.sol with events + `script/Deploy.s.sol`  
- [ ] **3** – `forge script` deploy to Polkadot Hub TestNet, note address & block  
- [ ] **4** – Create Subgraph in Studio, `graph init` from contract  
- [ ] **5** – Edit `subgraph.yaml`, `schema.graphql`, `mapping.ts`  
- [ ] **6** – `graph codegen && graph build && graph deploy`  
- [ ] **7** – Verify ERC1963 on Routescan (single file or standard JSON)  
- [ ] **8** – Build UI: add Polkadot Hub, read/write contract, query Subgraph  
- [ ] **9** – (Optional) Publish Subgraph to The Graph Network for production

---

## References

- [The Graph – Quick Start](https://thegraph.com/docs/en/subgraphs/quick-start/)  
- [The Graph – Creating a Subgraph](https://thegraph.com/docs/en/subgraphs/creating-a-subgraph/)  
- [Polkadot – Smart Contracts (Parachain Contracts)](https://docs.polkadot.com/develop/smart-contracts/evm/parachain-contracts/)  
- [Polkadot – Connect to Polkadot](https://docs.polkadot.com/develop/smart-contracts/connect-to-polkadot)  
- [Routescan – Polkadot Testnet](https://polkadot.testnet.routescan.io/)

---

## Notes

- **ERC1963** is used here as the **contract name** (no ERC-1963 standard exists; you’re free to implement any logic).  
- Polkadot Hub TestNet is EVM (REVM); same tooling as Ethereum.  
- Subgraph network: if “polkadot-hub” isn’t in the CLI list, you may need to deploy to a supported network (e.g. Ethereum testnet) for Studio, or use a custom graph-node; [Supported Networks](https://thegraph.com/docs/en/supported-networks/) — Polkadot Hub is not listed yet; use a supported testnet (e.g. Sepolia) for the Subgraph, or run your own graph-node ([New Chain Integration](https://thegraph.com/docs/en/new-chain-integration/)).

Use this doc as your single framework: do phases in order, tick the checkpoints, and you’ll have covered contract, indexer, verification, and UI end-to-end.
