# Step-by-Step: MetaMask Connection & pallet-revive Workflow

## Part 1: Test MetaMask Connection to Local Node

### Prerequisites
- ✅ revive-dev-node running (Terminal 1)
- ✅ Ethereum RPC server running (Terminal 2)
- ✅ MetaMask browser extension installed

---

### Step 1: Verify Node is Running

**In Terminal 1 (revive-dev-node):**
- You should see logs showing blocks being produced
- Look for: `✨ Imported #X` messages
- Node should be running on `ws://127.0.0.1:9944`

**In Terminal 2 (Ethereum RPC server):**
- You should see: `Ethereum RPC server started on http://127.0.0.1:8545`
- If not running, start it with:
  ```bash
  cd /Users/annabellelee/polkadot-sdk
  RUST_LOG="info,eth-rpc=debug" \
  cargo run -p pallet-revive-eth-rpc -- --dev
  ```

---

### Step 2: Test Ethereum RPC Endpoint

**Open a new terminal (Terminal 3) and test:**

```bash
# Test if Ethereum RPC is responding
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x0"}
```

If you get a response, the RPC server is working! ✅

---

### Step 3: Get Chain ID

**In Terminal 3, get the chain ID:**

```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**Note the result** - it will be something like `"0x2a"` (42 in decimal) or `"0x1"` (1 in decimal)

**Convert hex to decimal:**
- `0x2a` = 42
- `0x1` = 1
- Or use: `echo $((0x2a))` to convert

---

### Step 4: Configure MetaMask Network

**4.1. Open MetaMask Extension**
- Click the MetaMask icon in your browser
- If you don't have an account, create one first

**4.2. Add Custom Network**
- Click the network dropdown (top of MetaMask, usually shows "Ethereum Mainnet")
- Click "Add Network" → "Add a network manually"

**4.3. Enter Network Details:**

```
Network Name: Polkadot Revive Local
RPC URL: http://127.0.0.1:8545
Chain ID: [Use the decimal number from Step 3, e.g., 42 or 1]
Currency Symbol: UNIT (or DOT)
Block Explorer URL: (leave empty)
```

**4.4. Click "Save"**

**4.5. Switch to the Network**
- Select "Polkadot Revive Local" from the network dropdown
- MetaMask should now be connected to your local node

---

### Step 5: Verify Connection

**5.1. Check Account Balance**
- In MetaMask, you should see your account
- The balance might show 0 initially (we'll fund it next)

**5.2. Test Connection via Browser Console**
- Open browser Developer Tools (F12)
- Go to Console tab
- Run:
  ```javascript
  // Check if MetaMask is connected
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
    
    // Get chain ID
    window.ethereum.request({ method: 'eth_chainId' })
      .then(chainId => console.log('Chain ID:', chainId));
    
    // Get accounts
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => console.log('Accounts:', accounts));
  } else {
    console.log('MetaMask not found');
  }
  ```

**Expected output:**
- `MetaMask is installed!`
- `Chain ID: 0x2a` (or your chain ID)
- `Accounts: ['0x...']` (your account address)

---

### Step 6: Get Test Account with Balance

**6.1. Check Node Logs for Pre-funded Accounts**
- Look in Terminal 1 (revive-dev-node) logs
- Search for account addresses or keys
- Or use Polkadot.js Apps (see Step 7)

**6.2. Use Polkadot.js Apps to Get Accounts**
- Visit: https://polkadot.js.org/apps
- Click network selector (top left)
- Enter: `ws://127.0.0.1:9944`
- Click "Switch"
- Go to "Accounts" tab
- You'll see pre-funded accounts with balances

**6.3. Import Account to MetaMask (if needed)**
- If you need to import a specific account:
  - Get the private key from Polkadot.js Apps (if available)
  - In MetaMask: Click account icon → "Import Account" → "Private Key"
  - Paste the private key

**6.4. Fund Your MetaMask Account**
- If your MetaMask account has 0 balance:
  - Use Polkadot.js Apps to transfer funds
  - Or use the node's pre-funded accounts directly

---

### Step 7: Test a Simple Transaction

**7.1. In Browser Console, test sending a transaction:**

```javascript
// Request account access
await window.ethereum.request({ method: 'eth_requestAccounts' });

// Get accounts
const accounts = await window.ethereum.request({ method: 'eth_accounts' });
console.log('Connected account:', accounts[0]);

// Get balance
const balance = await window.ethereum.request({
  method: 'eth_getBalance',
  params: [accounts[0], 'latest']
});
console.log('Balance:', balance);
```

**7.2. If you see a balance, connection is working! ✅**

---

## Part 2: Understand pallet-revive Workflow

### What is pallet-revive?

**pallet-revive** is a Substrate pallet that enables:
- ✅ EVM-compatible smart contracts on Polkadot
- ✅ Solidity contract deployment and execution
- ✅ Ethereum JSON-RPC API compatibility
- ✅ Works with standard Ethereum tools (MetaMask, Hardhat, etc.)

### Key Concepts

**1. PolkaVM**
- pallet-revive uses PolkaVM (RISC-V based virtual machine)
- Contracts compile to PolkaVM bytecode
- Not traditional EVM, but EVM-compatible

**2. Contract Deployment**
- Contracts are stored by `code_hash`
- Multiple instances can use the same code
- Code is stored once, instances are separate

**3. Account Model**
- Uses Substrate's account system
- Accounts can be regular accounts or contract accounts
- Contract accounts have code and storage

---

### Workflow Overview

```
┌─────────────────────────────────────────────────────────┐
│ 1. Write Contract (Solidity)                            │
│    - Write your miniSwap.sol                            │
│    - Functions: addLiquidity, removeLiquidity, swap     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Compile to PolkaVM Bytecode                          │
│    - Use revive compiler                                │
│    - Output: bytecode + ABI                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Deploy via Ethereum JSON-RPC                         │
│    - Use MetaMask, Hardhat, or web3.js                  │
│    - Send transaction to pallet-revive                  │
│    - Contract gets instantiated                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Interact with Contract                               │
│    - Call functions via Ethereum JSON-RPC                │
│    - Use MetaMask for transactions                      │
│    - Use web3.js/ethers.js for programmatic calls       │
└─────────────────────────────────────────────────────────┘
```

---

### Step-by-Step: Deploy Your First Contract

**Step 1: Create a Simple Test Contract**

Create file: `contracts/TestContract.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestContract {
    uint256 public value;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}
```

**Step 2: Compile the Contract**

You'll need the revive compiler. For now, you can:
- Use Hardhat with revive plugin (if available)
- Or compile manually with revive compiler
- Or use the examples in the SDK

**Step 3: Deploy Using MetaMask**

**Option A: Using Hardhat/Foundry**
```bash
# In your homework directory
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

**Option B: Using web3.js in Browser**
```javascript
// In browser console or your frontend
const Web3 = require('web3');
const web3 = new Web3(window.ethereum);

// Deploy contract
const contract = new web3.eth.Contract(abi);
const deployTx = contract.deploy({ data: bytecode });

const deployed = await deployTx.send({
  from: accounts[0],
  gas: 1500000
});

console.log('Contract deployed at:', deployed.options.address);
```

**Step 4: Interact with Deployed Contract**

```javascript
// Call a function
const result = await contract.methods.getValue().call();
console.log('Value:', result);

// Send a transaction
await contract.methods.setValue(42).send({
  from: accounts[0],
  gas: 100000
});
```

---

### Understanding ink! (Alternative to Solidity)

**ink!** is Rust-based smart contract language for Substrate.

**Key Differences:**

| Feature | Solidity (pallet-revive) | ink! |
|---------|-------------------------|------|
| Language | Solidity | Rust |
| Compiler | revive | cargo-contract |
| VM | PolkaVM | Wasm |
| Compatibility | EVM-compatible | Native Substrate |
| Tools | MetaMask, Hardhat | Polkadot.js, cargo-contract |

**For Your Homework:**
- **Use Solidity** if you want MetaMask compatibility and Ethereum tooling
- **Use ink!** if you want native Substrate features and Rust ecosystem

**Recommendation for miniSwap:**
- **Use Solidity** - Better for Uniswap V2 compatibility and MetaMask integration

---

### pallet-revive vs ink! Decision Guide

**Choose pallet-revive (Solidity) if:**
- ✅ You want MetaMask support
- ✅ You're porting Uniswap V2 code
- ✅ You want Ethereum tooling (Hardhat, Foundry)
- ✅ You want EVM compatibility

**Choose ink! (Rust) if:**
- ✅ You prefer Rust
- ✅ You want native Substrate features
- ✅ You don't need MetaMask
- ✅ You want better performance

**For Your Homework: Use pallet-revive (Solidity)** ✅

---

## Part 3: Practical Testing Steps

### Test 1: Verify RPC Endpoints

**Run these commands in Terminal 3:**

```bash
# Test eth_blockNumber
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test eth_chainId
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Test eth_accounts (will be empty, but should work)
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}'
```

All should return valid JSON responses.

---

### Test 2: MetaMask Connection Test

**In Browser Console:**

```javascript
// 1. Check MetaMask availability
if (typeof window.ethereum !== 'undefined') {
  console.log('✅ MetaMask detected');
} else {
  console.log('❌ MetaMask not found');
}

// 2. Request connection
try {
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  console.log('✅ Connected:', accounts);
} catch (error) {
  console.log('❌ Connection failed:', error);
}

// 3. Get chain ID
const chainId = await window.ethereum.request({
  method: 'eth_chainId'
});
console.log('Chain ID:', chainId);

// 4. Get balance
const accounts = await window.ethereum.request({
  method: 'eth_accounts'
});
if (accounts.length > 0) {
  const balance = await window.ethereum.request({
    method: 'eth_getBalance',
    params: [accounts[0], 'latest']
  });
  console.log('Balance (wei):', balance);
  console.log('Balance (ETH):', parseInt(balance, 16) / 1e18);
}
```

---

### Test 3: Deploy a Simple Contract

**Create a minimal HTML test page:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Contract Test</title>
    <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
</head>
<body>
    <h1>Contract Deployment Test</h1>
    <button id="connect">Connect MetaMask</button>
    <button id="deploy">Deploy Contract</button>
    <div id="result"></div>

    <script>
        let web3;
        let accounts;

        document.getElementById('connect').onclick = async () => {
            if (typeof window.ethereum !== 'undefined') {
                web3 = new Web3(window.ethereum);
                accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                document.getElementById('result').innerHTML = 
                    `Connected: ${accounts[0]}`;
            }
        };

        document.getElementById('deploy').onclick = async () => {
            // Simple bytecode for a minimal contract
            // You'll replace this with your compiled contract
            const bytecode = '0x6080604052348015600f57600080fd5b5060...'; // Your compiled bytecode
            
            const contract = new web3.eth.Contract([]); // Your ABI
            const deployTx = contract.deploy({ data: bytecode });
            
            try {
                const deployed = await deployTx.send({
                    from: accounts[0],
                    gas: 1500000
                });
                document.getElementById('result').innerHTML = 
                    `Contract deployed at: ${deployed.options.address}`;
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    `Error: ${error.message}`;
            }
        };
    </script>
</body>
</html>
```

---

## Summary Checklist

**MetaMask Setup:**
- [ ] Ethereum RPC server running on port 8545
- [ ] Got Chain ID from RPC
- [ ] Added network to MetaMask
- [ ] Switched to local network in MetaMask
- [ ] Verified connection in browser console
- [ ] Got account address
- [ ] Checked account balance

**pallet-revive Understanding:**
- [ ] Understand it enables Solidity contracts on Polkadot
- [ ] Know it uses PolkaVM (not EVM, but compatible)
- [ ] Understand contract deployment workflow
- [ ] Know how to interact via Ethereum JSON-RPC
- [ ] Understand difference between pallet-revive and ink!

**Next Steps:**
- [ ] Write your miniSwap Solidity contract
- [ ] Compile contract to bytecode
- [ ] Deploy contract to local node
- [ ] Test addLiquidity, removeLiquidity, swap functions
- [ ] Build frontend UI

---

## Troubleshooting

**MetaMask shows "Network Error":**
- Check if Ethereum RPC server is running
- Verify RPC URL is `http://127.0.0.1:8545`
- Check Chain ID matches

**Can't get accounts:**
- Make sure you've approved MetaMask connection
- Check browser console for errors
- Try refreshing MetaMask

**Contract deployment fails:**
- Check you have enough balance
- Verify bytecode is correct
- Check node logs for errors
- Ensure contract compiles correctly

**RPC calls fail:**
- Verify both nodes are running
- Check ports 9944 and 8545 are not blocked
- Review node logs for errors
