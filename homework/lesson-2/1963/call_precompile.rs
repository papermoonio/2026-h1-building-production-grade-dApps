// Call System precompile using revive.call extrinsic
// This demonstrates calling a precompile directly via terminal

use pallet_revive_eth_rpc::subxt_client::{self, SrcChainConfig};
use sp_core::H160;
use sp_weights::Weight;
use subxt::OnlineClient;
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
    
    println!("\nCalling System precompile:");
    println!("  Precompile: {:?}", precompile_addr);
    println!("  EVM Address: 0x{}", hex::encode(&evm_addr_bytes));
    println!("  Call data: 0x{}", hex::encode(&call_data));
    println!();

    // Create the call extrinsic
    // Parameters: dest, value, weightLimit, storageDepositLimit, data
    let tx_payload = subxt_client::tx().revive().call(
        precompile_addr,
        0u128.into(),
        Weight::from_parts(10_000_000_000, 0), // 10 billion refTime
        1_000_000_000_000u128, // 1 trillion storage deposit
        call_data,
    );

    println!("Submitting transaction...");
    let res = client
        .tx()
        .sign_and_submit_then_watch_default(&tx_payload, &dev::alice())
        .await?
        .wait_for_finalized()
        .await?;

    println!("✅ Transaction finalized: {:?}", res.extrinsic_hash());
    
    // Check for events to see the result
    println!("\nChecking transaction events...");
    let events = res.wait_for_success().await?;
    
    println!("\nTransaction completed successfully!");
    println!("Extract the AccountId32 from the transaction events.");
    println!("The result is in the execution return data.");
    
    Ok(())
}

