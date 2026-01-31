# ERC1963 + Subgraph + Polkadot Hub (Lesson 6 – 1963)

Homework submission for [Building Production-Grade dApps](https://github.com/papermoonio/2026-h1-building-production-grade-dApps) **Lesson 6**, under folder **1963**.

Smart contract **ERC1963**, indexed by a Subgraph, targeting Polkadot Hub TestNet. Verified on [Routescan](https://polkadot.testnet.routescan.io/blockchain/verified-contracts).

**Stack:** Foundry (Forge + Cast), The Graph (Subgraph), Remix (fallback deploy).

---

## Foundry + Polkadot Hub: Not Working (and Why)

We tried to deploy `contracts/ERC1963.sol` to Polkadot Hub TestNet (Chain ID 420420417) using Foundry. **Deployment via Foundry did not work reliably** for the following reasons.

### What Happened

1. **Receipt never returned**  
   After `forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast`, Forge sent the transaction and got a hash. When it asked the Polkadot Hub RPC for the **transaction receipt**, the RPC often returned **null** (or 503 / timeout). Forge then reported *"Failure on receiving a receipt"* and left the tx as **pending** in `broadcast/`.

2. **Re-send loop**  
   On the next run, Forge saw that pending tx and tried to **re-send the same transaction**. The chain had already seen it, so the RPC returned **"Transaction Already Imported"** (error 1013). Re-running the script kept re-sending the same tx.

3. **Temporary ban**  
   After many duplicate attempts, the RPC node applied anti-spam and returned **"Transaction is temporarily banned"** (error 1012). The same account could not send new transactions for a while.

4. **Tx reverted on chain**  
   In some runs the creation tx was **included but reverted** (e.g. only ~2501 gas used, status 0). So the contract address had no code; `cast call` returned *"Contract code is empty"*. Cause is likely chain-specific (Polkadot Hub EVM behaviour or RPC/node differences), not the Solidity code.

### Summary

| Error / outcome | Cause |
|-----------------|--------|
| Failure on receiving a receipt | RPC returns null/503 when Forge polls for receipt |
| Transaction Already Imported (1013) | Same tx re-sent because Forge left it "pending" |
| Transaction is temporarily banned (1012) | Too many duplicate/repeated submissions to the node |
| Transaction Failure (revert) | Creation tx reverted on chain; contract address has no code |

**Conclusion:** Foundry + Polkadot Hub is currently unreliable due to RPC receipt behaviour, re-send loop, and occasional on-chain revert. We use **Remix + MetaMask** to deploy the same contract to Polkadot Hub instead.

---

## Remix Deployment (Same Contract)

The same `contracts/ERC1963.sol` was deployed to Polkadot Hub TestNet using **Remix** and **MetaMask** (Injected Provider), with MetaMask connected to a custom network: Chain ID **420420417**, RPC `https://eth-rpc-testnet.polkadot.io/` or `https://services.polkadothub-rpc.com/testnet`.

![Remix ERC1963 Deploy to Polkadot Hub](assets/Remix-ERC1963-Deploy-Polkadot-Hub.png)

- **Contract:** `ERC1963` (same as in this repo).
- **Network:** Custom (420420417) – Polkadot Hub TestNet.
- After deployment, use the **contract address** and **block number** in `subgraph/subgraph.yaml` (address and `startBlock`).

---

## Quick Start

1. **Plan:** See [FRAMEWORK.md](./FRAMEWORK.md) for phases and outcomes.
2. **Contract:** `contracts/ERC1963.sol` — build with Forge; deploy with **Remix + MetaMask** to Polkadot Hub (see above).
3. **Subgraph:** In [`subgraph/`](./subgraph/). Set contract address and `startBlock` in `subgraph/subgraph.yaml`, then `cd subgraph && npm install && npm run codegen && npm run build`. Deploy with `npx graph auth --studio <KEY>` and `npx graph deploy <SLUG>`. See [subgraph/README.md](./subgraph/README.md).
4. **Deploy & verify:** Phase 1 (deploy via Remix), Phase 3 (Routescan), Phase 4 (UI).

## Commands (Foundry – build only; deploy via Remix)

`lib/` is in `.gitignore` (not submitted). To build locally, install forge-std first:

```bash
forge install foundry-rs/forge-std --no-git   # required: lib/ not in repo
cp .env.example .env   # set PRIVATE_KEY, RPC_URL for Cast
forge build
```

Deploy to Polkadot Hub via **Remix** (see "Remix Deployment" above). On Polkadot Hub, gas is paid in **PAS**; get testnet PAS from the [Polkadot Faucet](https://faucet.polkadot.io/).

**Cast (read/write)** after you have a deployed contract address:

- `cast call <ADDRESS> "getValue()" --rpc-url $RPC_URL`
- `cast send <ADDRESS> "setValue(uint256)" <VALUE> --rpc-url $RPC_URL --private-key $PRIVATE_KEY`

---

## Deploy with Remix (recommended for Polkadot Hub)

1. **Remix:** [remix.ethereum.org](https://remix.ethereum.org) → create `ERC1963.sol` and paste the contents of `contracts/ERC1963.sol`.
2. **Compile:** Solidity 0.8.20.
3. **MetaMask:** Add Polkadot Hub testnet (Chain ID **420420417**, RPC above). Fund with PAS from the [Polkadot Faucet](https://faucet.polkadot.io/).
4. **Deploy:** Deploy tab → Environment **Injected Provider - MetaMask** → network **Custom (420420417)** → Deploy. Save **contract address** and **block number**.
5. **Subgraph:** Update `subgraph/subgraph.yaml` with that address and `startBlock`.
