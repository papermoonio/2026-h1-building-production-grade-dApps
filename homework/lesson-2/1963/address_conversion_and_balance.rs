// Complete example: Address conversion and balance verification
// This demonstrates:
// 1. Converting EVM address to AccountId32 using System precompile
// 2. Querying balance for EVM address
// 3. Querying balance for Substrate AccountId32
// 4. Verifying that balances are consistent

use pallet_revive_eth_rpc::subxt_client::{self, SrcChainConfig};
use sp_core::{H160, U256};
use subxt::{OnlineClient, utils::Static};
use subxt_signer::sr25519::dev;
use hex;

// Helper function to decode ABI-encoded bytes (returns the AccountId32)
fn decode_account_id32(encoded: &[u8]) -> Result<[u8; 32], Box<dyn std::error::Error>> {
    // ABI encoding format: offset (32 bytes) + length (32 bytes) + data (32 bytes)
    if encoded.len() < 96 {
        return Err("Invalid ABI encoding: too short".into());
    }
    
    // Skip offset (first 32 bytes) and length (next 32 bytes)
    // Extract the AccountId32 (next 32 bytes)
    let mut account_id = [0u8; 32];
    account_id.copy_from_slice(&encoded[64..96]);
    Ok(account_id)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("==========================================");
    println!("Address Conversion & Balance Verification");
    println!("==========================================");
    println!();

    // Connect to node
    println!("Connecting to node at ws://localhost:9944...");
    let client = OnlineClient::<SrcChainConfig>::from_url("ws://localhost:9944").await?;
    println!("✅ Connected!");
    println!();

    // Step 1: Convert EVM address to AccountId32 using System precompile
    let evm_addr_bytes = hex::decode("f24ff3a9cf04c71dbc94d0b566f7a27b94566cac")?;
    let evm_addr = H160::from_slice(&evm_addr_bytes);
    
    println!("Step 1: Converting EVM address to AccountId32");
    println!("  EVM Address: 0x{}", hex::encode(&evm_addr_bytes));
    
    // System precompile address: 0x0000000000000000000000000000000000000900
    let mut precompile_bytes = [0u8; 20];
    precompile_bytes[18] = 0x09;
    precompile_bytes[19] = 0x00;
    let precompile_addr = H160::from_slice(&precompile_bytes);
    
    // Function selector: keccak256("toAccountId(address)")[:4] = cf5231cc
    let function_selector = hex::decode("cf5231cc")?;
    
    // Pad address to 32 bytes (12 bytes padding + 20 bytes address)
    let mut call_data = function_selector;
    call_data.extend_from_slice(&[0u8; 12]); // padding
    call_data.extend_from_slice(&evm_addr_bytes);
    
    // Get ALICE's AccountId32 for the call
    let alice = dev::alice();
    let alice_account_id = alice.public_key().to_account_id();
    
    // Call the precompile via runtime API
    let payload = subxt_client::apis().revive_api().call(
        alice_account_id,
        precompile_addr,
        0u128,
        None::<Static<sp_weights::Weight>>,
        None::<u128>,
        call_data.clone(),
    );

    let contract_result = client.runtime_api().at_latest().await?.call(payload).await?;
    
    let substrate_account_id = match contract_result.result {
        Ok(exec_result) => {
            // Decode the AccountId32 from ABI-encoded result
            let account_id_bytes = decode_account_id32(&exec_result.0.data)?;
            println!("  ✅ Conversion successful!");
            println!("  AccountId32: 0x{}", hex::encode(&account_id_bytes));
            account_id_bytes
        }
        Err(e) => {
            println!("  ❌ Error: {:?}", e);
            return Err(format!("Precompile call failed: {:?}", e).into());
        }
    };
    println!();

    // Step 2: Query EVM address balance
    println!("Step 2: Querying EVM address balance");
    let runtime_api = client.runtime_api();
    let at = runtime_api.at_latest().await?;
    
    let evm_balance_payload = subxt_client::apis().revive_api().balance(evm_addr.0.into());
    let evm_balance_static = at.call(evm_balance_payload).await?;
    let evm_balance = *evm_balance_static;
    
    println!("  EVM Address: 0x{}", hex::encode(&evm_addr_bytes));
    println!("  Balance: {} ({} wei)", evm_balance, evm_balance);
    println!();

    // Step 3: Query Substrate AccountId32 balance
    println!("Step 3: Querying Substrate AccountId32 balance");
    
    // Try to query Balances pallet first, fallback to System account
    let account_id32 = subxt::utils::AccountId32(substrate_account_id);
    
    // Try Balances pallet account storage
    let balances_query = subxt_client::storage().balances().account(account_id32.clone());
    let balances_info = client.storage().at_latest().await?.fetch(&balances_query).await?;
    
    let substrate_balance = if let Some(balances_data) = balances_info {
        // Use Balances pallet account data
        balances_data.free
    } else {
        // Fallback to System account storage
        let account_query = subxt_client::storage().system().account(account_id32);
        let account_info = client.storage().at_latest().await?.fetch(&account_query).await?;
        
        if let Some(account_data) = account_info {
            account_data.data.free
        } else {
            println!("  ⚠️  Account not found in storage");
            println!("  This might mean the account hasn't been used yet on Substrate side");
            return Ok(());
        }
    };
    
    println!("  AccountId32: 0x{}", hex::encode(&substrate_account_id));
    println!("  Balance: {} ({} wei)", substrate_balance, substrate_balance);
    println!();

    // Step 4: Verify balance consistency
    println!("Step 4: Verifying balance consistency");
    println!("  EVM Balance:      {}", evm_balance);
    println!("  Substrate Balance: {}", substrate_balance);
    
    // Convert substrate_balance (u128) to U256 for comparison
    let substrate_balance_u256 = U256::from(substrate_balance);
    
    if evm_balance == substrate_balance_u256 {
        println!("  ✅ SUCCESS: Balances match! The same account has consistent balance across EVM and Substrate.");
    } else {
        println!("  ⚠️  WARNING: Balances do not match!");
        println!("     Difference: {}", 
            if evm_balance > substrate_balance_u256 {
                evm_balance - substrate_balance_u256
            } else {
                substrate_balance_u256 - evm_balance
            }
        );
        println!();
        println!("  Note: This difference might be due to:");
        println!("    - Different balance calculation methods (free vs total)");
        println!("    - Dust or reserved balances");
        println!("    - Different storage locations (System vs Balances pallet)");
    }
    
    println!();
    println!("==========================================");
    println!("Verification Complete!");
    println!("==========================================");
    
    Ok(())
}

