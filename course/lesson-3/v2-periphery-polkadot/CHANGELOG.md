# Changelog

## Status


- [x] Compilation
- [x] Tests: 
    Most test cases have been completed, except for the following:  
    - Tests related to Uniswap v1 migration
    - Test cases using mineblock to manually set block time

## Modification Record

| Change Type                     | Description & Cause                                                                                            | Files Affected                                                                                                                                                                                                                                                                                                                                                                                                     |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Solidity Version Upgrade**    | Solidity version upgraded from 0.5.x to 0.8.x                                                                  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Test Workflow**               | 1. Test framework migrates from Waffle to Hardhat, <br>2. ethersv5 upgrade to ethersv6                         | test/shared/\*, <br> test/ExampleComputeLiquidityValue.spec.ts, <br>test/UExampleSlidingWindowOracle.spec.ts, <br> test/UniswapV2Router01.spec.ts, <br>test/ExampleFlashSwap.spec.ts, <br> test/ExampleSwapToPrice.spec.ts, <br> test/UniswapV2Router02.spec.ts, <br> test/ExampleOracleSimple.spec.ts, <br>test/UniswapV2Migrator.spec.ts, <br>test/UniswapV2Router01.spec.ts, <br>test/UniswapV2Router02.spec.ts |
| **Contract Logic Modification** | Core changes to smart contract logic due to a fundamental incompatibility between the EVM and PolkaVM runtime. | contracts/libraries/UniswapV2Library.sol                                                                                                                                                                                                                                                                                                                                                                           |

---

## Issue Reporting

### [v2-periphery-polkadot] fields had validation errors

#### Description

When running `npx hardhat test`, a vague "fields had validation errors" message appears without further details.

#### Analysis

After debugging, it was discovered that the root cause is a `CodeSizeLimit` error during contract deployment. The error message is likely being obscured due to version incompatibilities between `hardhat-polkadot` and `hardhat`, making it difficult to diagnose.

### [v2-periphery-polkadot] PrecisionLoss

#### Description

When running removeLiquidityETH tests in v2-periphery, transactions revert due to a DecimalPrecisionLoss error originating from the Substrate runtime. This occurs during value conversions between ETH (18 decimals) and DOT (12 decimals).

#### Analysis

In this test case, the Substrate runtime rejects conversions with a remainder, e.g., converting 3999999999999998000 wei (ETH) to DOT results in a remainder of 998000 wei, which cannot be represented in DOT’s 12-decimal system.

- ETH value: 3999999999999998000 (wei)
- Conversion: ETH (1e18) → DOT (1e12) requires division by 1e6.
- Result: 3999999999999998000 / 1e6 = 3999999999999.998 → Remainder 998000 (unrepresentable in DOT).


### [v2-periphery-polkadot] TransferFailed

#### Description
After migrating to the latest substrate-node (which includes the eth-decimals update), Uniswap V2 periphery tests no longer report DecimalsPrecisionLoss errors. However, tests involving ETH transfers occasionally fail with:
```
Error: execution reverted: "TransferHelper::safeTransferETH: ETH transfer failed"
```
Or:
```
2) UniswapV2Router{01,02}
       UniswapV2Router02
         swapExactTokensForETH
           amounts:
     ProviderError: execution reverted: panic: assertion failed (0x01)
```

#### Analysis
Looking into the substrate logs, both caused by the same reason:
```
TRACE tokio-runtime-worker runtime::revive::strace: call(flags_and_callee: 34359935664, ref_time_limit: 18446744073709551615, proof_size_limit: 18446744073709551615, deposit_and_value: 18446159137818405824, input_data: 133232, output_data: 18446158996084753072) = Ok(TransferFailed) gas_consumed: Weight { ref_time: 22257362352, proof_size: 1049891 }
```
The current [eth-decimals](https://github.com/paritytech/polkadot-sdk/pull/9101) has a bug in handling the receiver's dust balance during ETH transfers, causing transactions to revert.
