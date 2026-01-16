# Submission Information

## Student ID: 1963
## GitHub: https://github.com/Funghi88

## Files Structure

```
1963/
├── address_conversion_and_balance.rs    # Main example
├── call_precompile_runtime_api.rs        # Basic example
├── call_precompile.rs                    # Alternative example
├── README.md                             # Documentation
└── substrate/
    └── frame/
        └── revive/
            └── fixtures/
                ├── build/
                │   └── _Cargo.toml      # Build fix
                └── src/
                    └── builder.rs       # Build script fix
```

## How to Run

```bash
# In polkadot-sdk repository
cd substrate/frame/revive/rpc
SKIP_PALLET_REVIVE_FIXTURES=1 cargo run --example address_conversion_and_balance
```

## What Was Done

1. Fixed build errors in pallet-revive-fixtures
2. Implemented EVM to AccountId32 conversion using System precompile
3. Implemented balance queries for both EVM and Substrate addresses
4. Verified balance consistency (explained differences)
