import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

/**
 * Viem-based tests: use network.connect() to get viem helpers from the Hardhat Viem toolbox.
 * We'll deploy the ERC1589 contract and run basic ERC20-style checks (name, symbol, balances,
 * transfer, approve/transferFrom, mint).
 */

describe("ERC1589", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  it("metadata and initial balances", async function () {
    const [deployerClient] = await viem.getWalletClients();
    const deployer = deployerClient.account.address;

    const token = await viem.deployContract("ERC1589", ["TestToken", "TTK", 1000n]);

    const name = await token.read.name();
    const symbol = await token.read.symbol();
    const decimals = await token.read.decimals();
    const totalSupply = await token.read.totalSupply();

    assert.equal(name, "TestToken");
    assert.equal(symbol, "TTK");
    assert.equal(Number(decimals), 18);
    assert.equal(totalSupply, 1000n * 10n ** 18n);

    const balance = await token.read.balanceOf([deployer]);
    assert.equal(balance, totalSupply);
  });

  it("transfer and allowances", async function () {
    const [deployerClient, receiverClient, spenderClient] = await viem.getWalletClients();
    const deployer = deployerClient.account.address;
    const receiver = receiverClient.account.address;
    const spender = spenderClient.account.address;

    const token = await viem.deployContract("ERC1589", ["TestToken", "TTK", 1000n]);

    // transfer 100 tokens
    await token.write.transfer([receiver, 100n * 10n ** 18n]);
    const rBal = await token.read.balanceOf([receiver]);
    const dBal = await token.read.balanceOf([deployer]);
    assert.equal(rBal, 100n * 10n ** 18n);
    assert.equal(dBal, 900n * 10n ** 18n);

    // approve
    await token.write.approve([spender, 50n * 10n ** 18n]);
    const allowance = await token.read.allowance([deployer, spender]);
    assert.equal(allowance, 50n * 10n ** 18n);
  });

  it("mint increases totalSupply and deployer balance", async function () {
    const [deployerClient] = await viem.getWalletClients();
    const deployer = deployerClient.account.address;

    const token = await viem.deployContract("ERC1589", ["TestToken", "TTK", 1000n]);

    await token.write.mint([100n]);

    const totalSupply = await token.read.totalSupply();
    const balance = await token.read.balanceOf([deployer]);

    assert.equal(totalSupply, 1100n * 10n ** 18n);
    assert.equal(balance, 1100n * 10n ** 18n);
  });
});
