# ERC1963 Subgraph

Indexes `ValueUpdated` events from the ERC1963 contract for use in your frontend.

## Quick Start (The Graph)

1. **Create a Subgraph in [Subgraph Studio](https://thegraph.com/studio/)** — connect wallet, Create a Subgraph, name it (e.g. "ERC1963 Polkadot Hub").
2. **Install Graph CLI** (if needed): `npm install -g @graphprotocol/graph-cli@latest`
3. **Set contract address and start block** in `subgraph.yaml`:
   - `source.address`: your deployed ERC1963 address
   - `source.startBlock`: deployment block (from `forge script ... --broadcast` output)
   - `network`: use the network that matches your chain (e.g. mainnet; change if your chain is listed).
4. **Install and build:**
   ```bash
   npm install
   npm run codegen
   npm run build
   ```
5. **Deploy to Studio:** get your deploy key from Studio, then:
   ```bash
   graph auth <DEPLOY_KEY>
   graph deploy <SUBGRAPH_SLUG>
   ```
6. **Query** from Studio playground or your frontend using the Subgraph Query URL.

## Files

| File | Role |
|------|------|
| `subgraph.yaml` | Data source (contract address, start block, ABI), event handlers. |
| `schema.graphql` | `ValueUpdate` entity. |
| `src/mapping.ts` | Maps `ValueUpdated` events → `ValueUpdate` entities. |
| `abi/ERC1963.json` | Contract ABI (from `out/ERC1963.sol/ERC1963.json`). |
