# Setup (Lesson 2)

## Prerequisites

- Node.js (with `npx`) and Yarn
- A local Substrate node running with WS endpoint `ws://localhost:9944`

## 1) Generate Polkadot API descriptors (required before installing deps)

This project depends on `@polkadot-api/descriptors` via a local path (`file:.papi/descriptors`).
Run the script below to generate `.papi/` first:

```shell
./get-metadata.sh
```

## 2) Install dependencies

```shell
yarn install
```

## 3) Run the script

```shell
yarn start
```

## Optional: build `subkey` (Substrate CLI)

```shell
cargo build --release -p subkey
```
