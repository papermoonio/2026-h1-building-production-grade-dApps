// Call System precompile using runtime API (bypasses extrinsic limits)
// Based on substrate/frame/revive/rpc/src/tests.rs

use pallet_revive_eth_rpc::subxt_client::{self, SrcChainConfig};
use sp_core::H160;
use subxt::{OnlineClient, utils::Static};
use subxt_signer::sr25519::dev;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Connecting to node at ws://localhost:9944...");
    let client = OnlineClient::<SrcChainConfig>::from_url("ws://localhost:9944").await?;
    println!("✅ Connected!");

    // System precompile address: 0x0000000000000000000000000000000000000900
    let mut precompile_bytes = [0u8; 20];
    precompile_bytes[18] = 0x09;
    precompile_bytes[19] = 0x00;
    let precompile_addr = H160::from_slice(&precompile_bytes);
    
    // alith EVM address
    let evm_addr_bytes = hex::decode("f24ff3a9cf04c71dbc94d0b566f7a27b94566cac")?;
    
    // Function selector: keccak256("toAccountId(address)")[:4] = cf5231cc
    let function_selector = hex::decode("cf5231cc")?;
    
    // Pad address to 32 bytes (12 bytes padding + 20 bytes address)
    let mut call_data = function_selector;
    call_data.extend_from_slice(&[0u8; 12]); // padding
    call_data.extend_from_slice(&evm_addr_bytes);
    
    println!("\nCalling System precompile via runtime API:");
    println!("  Precompile: {:?}", precompile_addr);
    println!("  EVM Address: 0x{}", hex::encode(&evm_addr_bytes));
    println!("  Call data: 0x{}", hex::encode(&call_data));
    println!();

    // Get ALICE's AccountId32
    let alice = dev::alice();
    let alice_account_id = alice.public_key().to_account_id();
    
    // Use runtime API to call (bypasses extrinsic limits)
    // This uses the ReviveApi_call runtime API method
    let payload = subxt_client::apis().revive_api().call(
        alice_account_id,
        precompile_addr,
        0u128, // value
        None::<Static<sp_weights::Weight>>,  // gas_limit (None = unlimited)
        None::<u128>,  // storage_deposit_limit (None = unlimited)
        call_data,
    );

    println!("Calling runtime API...");
    let contract_result = client.runtime_api().at_latest().await?.call(payload).await?;
    
    match contract_result.result {
        Ok(exec_result) => {
            println!("✅ Success!");
            println!("Result data: 0x{}", hex::encode(&exec_result.0.data));
            println!("\nThe AccountId32 is in the result data.");
            println!("Decode it to get the 32-byte AccountId32 format.");
        }
        Err(e) => {
            println!("❌ Error: {:?}", e);
            return Err(format!("Runtime API call failed: {:?}", e).into());
        }
    }
    
    Ok(())
}

