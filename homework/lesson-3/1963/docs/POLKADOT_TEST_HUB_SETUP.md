# Polkadot Test Hub Setup Guide

## Part 1: Find Test Hub Details

### Step 1.1: Visit Polkadot Test Hub Documentation

1. **Open your web browser**
2. **Navigate to:** [Polkadot Developer Documentation](https://docs.polkadot.com/develop/smart-contracts/connect-to-polkadot/)
3. **Look for the "Test Networks" or "Test Hub" section**

### Step 1.2: Note the Network Details

Based on the official Polkadot documentation, here are the **Polkadot Hub TestNet (Paseo)** details:

#### Network Information:
- **Network Name:** `Polkadot Hub TestNet` (also known as `Paseo`)
- **RPC URL:** `https://testnet-passet-hub-eth-rpc.polkadot.io`
- **Chain ID (Decimal):** `420420422`
- **Chain ID (Hex):** `0x19191926`
- **Currency Symbol:** `PAS`
- **Block Explorer:** `https://blockscout-passet-hub.parity-testnet.parity.io/`

### Step 1.3: Verify the RPC Endpoint

**Test the RPC URL to ensure it's working:**

Open a terminal and run:

```bash
curl -X POST https://testnet-passet-hub-eth-rpc.polkadot.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
```

If you get a response with a block number, the RPC endpoint is working! ✅

### Step 1.4: Get Chain ID via RPC

**Verify the Chain ID:**

```bash
curl -X POST https://testnet-passet-hub-eth-rpc.polkadot.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**Expected response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x19191926"}
```

**Convert hex to decimal:**
- `0x19191926` = `420420422` (decimal)

You can verify this with:
```bash
echo $((0x19191926))
# Output: 420420422
```

---

## Part 2: Get Test Tokens

### Step 2.1: Access the Polkadot Faucet

1. **Open your web browser**
2. **Navigate to:** [Polkadot Faucet](https://faucet.polkadot.io/)
3. **The page should load with network and chain dropdowns**

### Step 2.2: Select the Correct Network

1. **Find the "Network" dropdown** (usually at the top of the page)
2. **Click on the dropdown**
3. **Select:** `Paseo` from the list
   - This is the test network name for Polkadot Hub TestNet

### Step 2.3: Select the Correct Chain

1. **Find the "Chain" dropdown** (usually below the Network dropdown)
2. **Click on the dropdown**
3. **Select:** `AssetHub` from the list
   - This is the specific chain within the Paseo testnet

### Step 2.4: Get Your Wallet Address

**Option A: Using MetaMask**

1. **Open MetaMask extension** in your browser
2. **Make sure you're connected to the Polkadot Hub TestNet network** (see Step 2.5 below)
3. **Click on your account name/address** at the top
4. **Click "Copy address to clipboard"** or manually copy the address
5. **Your address will look like:** `0x1234567890abcdef1234567890abcdef12345678`

**Option B: Using Polkadot.js Apps**

1. **Navigate to:** [Polkadot.js Apps](https://polkadot.js.org/apps)
2. **Connect to the network** (if needed)
3. **Go to Accounts tab**
4. **Copy your account address**

### Step 2.5: Add Polkadot Hub TestNet to MetaMask (If Not Already Added)

**Before requesting tokens, ensure MetaMask is configured:**

1. **Open MetaMask extension**
2. **Click the network dropdown** (top of MetaMask, usually shows current network)
3. **Click "Add Network"** → **"Add a network manually"**

4. **Enter the following details:**

```
Network Name: Polkadot Hub TestNet
RPC URL: https://testnet-passet-hub-eth-rpc.polkadot.io
Chain ID: 420420422
Currency Symbol: PAS
Block Explorer URL: https://blockscout-passet-hub.parity-testnet.parity.io/
```

5. **Click "Save"**
6. **Switch to the network** by selecting it from the dropdown

### Step 2.6: Request Test Tokens from Faucet

1. **Go back to the faucet page:** [Polkadot Faucet](https://faucet.polkadot.io/)
2. **Verify the selections:**
   - Network: `Paseo`
   - Chain: `AssetHub`
3. **Paste your wallet address** into the address field
   - Make sure it's the correct address (starts with `0x`)
4. **Click the "Get some PASs" button** (or similar button to request tokens)
5. **Wait for confirmation** - you should see a success message

### Step 2.7: Verify Token Receipt

**Option A: Check in MetaMask**

1. **Open MetaMask**
2. **Make sure you're on the Polkadot Hub TestNet network**
3. **Check your account balance** - you should see PAS tokens
4. **The balance should appear** within a few minutes

**Option B: Check via RPC**

```bash
# Replace YOUR_ADDRESS with your actual address
curl -X POST https://testnet-passet-hub-eth-rpc.polkadot.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["YOUR_ADDRESS","latest"],"id":1}'
```

**Expected response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
```

Convert the hex result to decimal to see your balance in wei.

### Step 2.8: Troubleshooting Token Requests

**If tokens don't arrive:**

1. **Check rate limiting:**
   - The faucet may have rate limits (e.g., once per hour/day)
   - Wait and try again later

2. **Verify network and chain:**
   - Make sure you selected `Paseo` network and `AssetHub` chain
   - Double-check your address is correct

3. **Check address format:**
   - Ensure your address starts with `0x`
   - Verify it's a valid Ethereum-compatible address

4. **Check MetaMask network:**
   - Make sure MetaMask is connected to Polkadot Hub TestNet
   - Tokens sent to wrong network won't be visible

5. **Contact Test Hub team:**
   - If faucet is unavailable, you may need to request tokens directly
   - Check Polkadot Discord or forums for alternative methods

---

## Part 3: Update Hardhat Configuration

### Step 3.1: Update hardhat.config.js

Now that you have the network details, update your Hardhat configuration:

**Open:** `hardhat.config.js`

**Update the testhub network configuration:**

```javascript
testhub: {
  url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
  chainId: 420420422, // Decimal format
  accounts: {
    mnemonic: "your twelve word mnemonic phrase here", // Optional: for automated deployment
  },
},
```

**Note:** 
- Use decimal Chain ID (`420420422`) in Hardhat config
- Keep your mnemonic secure and never commit it to version control
- Consider using environment variables for sensitive data

### Step 3.2: Test the Configuration

**Test deployment to Test Hub:**

```bash
# Make sure you have test tokens first!
npx hardhat run scripts/deploy.js --network testhub
```

**If successful, you should see:**
- Contract deployment transaction
- Contract address
- Gas used information

---

## Part 4: Summary Checklist

### Network Details ✅
- [ ] RPC URL noted: `https://testnet-passet-hub-eth-rpc.polkadot.io`
- [ ] Chain ID noted: `420420422` (decimal) / `0x19191926` (hex)
- [ ] Network name noted: `Polkadot Hub TestNet` (Paseo)
- [ ] Currency symbol noted: `PAS`
- [ ] Block explorer URL noted: `https://blockscout-passet-hub.parity-testnet.parity.io/`

### Test Tokens ✅
- [ ] Accessed Polkadot Faucet: `https://faucet.polkadot.io/`
- [ ] Selected `Paseo` network
- [ ] Selected `AssetHub` chain
- [ ] Got wallet address
- [ ] Added Polkadot Hub TestNet to MetaMask
- [ ] Requested test tokens
- [ ] Verified tokens received in wallet
- [ ] Have enough tokens for deployment gas fees

### Configuration ✅
- [ ] Updated `hardhat.config.js` with correct RPC URL
- [ ] Updated `hardhat.config.js` with correct Chain ID
- [ ] Tested RPC connection
- [ ] Ready to deploy contracts

---

## Additional Resources

- **Polkadot Documentation:** https://docs.polkadot.com/
- **Polkadot Faucet:** https://faucet.polkadot.io/
- **Block Explorer:** https://blockscout-passet-hub.parity-testnet.parity.io/
- **Polkadot.js Apps:** https://polkadot.js.org/apps

---

## Notes

- **Test tokens are free** - use them for testing only
- **Rate limiting applies** - don't abuse the faucet
- **Network may reset** - testnet data may be cleared periodically
- **Keep mnemonic secure** - never share or commit to version control
- **Gas fees are low** - but ensure you have enough PAS tokens
