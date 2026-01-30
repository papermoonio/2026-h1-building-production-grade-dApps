# Sample Hardhat 3 Beta Project (`node:test` and `viem`)

This project showcases a Hardhat 3 Beta project using the native Node.js test runner (`node:test`) and the `viem` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html), the new Node.js native test runner, and [`viem`](https://viem.sh/).
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Make a deployment to Polkadot TestNet

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Polkadot TestNet.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Polkadot TestNet, you can run the deployment with the Polkadot TestNet network:

```shell
$ npx hardhat ignition deploy ./ignition/modules/ERC1604FT.ts --network polkadotTestNet
[dotenv@17.2.3] injecting env (1) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
✔ Confirm deploy to network polkadotTestNet (420420417)? … yes
Hardhat Ignition 🚀

Deploying [ TokenModule ]

Batch #1
  Executed TokenModule#ERC1604FT

[ TokenModule ] successfully deployed 🚀

Deployed Addresses

TokenModule#ERC1604FT - 0xd14ABE99C51c84919b519BA6826a032755B9782C
```
