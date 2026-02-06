import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Contract ABIs
const MINISWAP_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) returns (uint256)",
  "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity) returns (uint256, uint256)",
  "function swap(address tokenIn, address tokenOut, uint256 amountIn) returns (uint256)",
  "function getPoolInfo(address tokenA, address tokenB) view returns (uint256, uint256, uint256)",
  "function getLpTokenBalance(address tokenA, address tokenB, address user) view returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) returns (bool)",
];

interface UserState {
  address: string | null;
  balance: string;
  balanceA: string;
  balanceB: string;
  connected: boolean;
}

interface PoolState {
  reserve0: string;
  reserve1: string;
  totalLiquidity: string;
  userLpBalance: string;
}

function App() {
  const [user, setUser] = useState<UserState>({
    address: null,
    balance: '0',
    balanceA: '0',
    balanceB: '0',
    connected: false,
  });

  const [pool, setPool] = useState<PoolState>({
    reserve0: '0',
    reserve1: '0',
    totalLiquidity: '0',
    userLpBalance: '0',
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'info'>('swap');

  // Form states
  const [swapInputAmount, setSwapInputAmount] = useState('');
  const [liquidityAmountA, setLiquidityAmountA] = useState('');
  const [liquidityAmountB, setLiquidityAmountB] = useState('');
  const [removeLiquidityAmount, setRemoveLiquidityAmount] = useState('');

  // Contract addresses (update these with your deployed addresses)
  const MINISWAP_ADDRESS = import.meta.env.VITE_MINISWAP_ADDRESS || '0x5FbDB2815C2dB0E0359CC45434C97D3eEAcC94B1';
  const TOKEN_A_ADDRESS = import.meta.env.VITE_TOKEN_A_ADDRESS || '0x70997970C51812e339D9B73B908260131B0d4720';
  const TOKEN_B_ADDRESS = import.meta.env.VITE_TOKEN_B_ADDRESS || '0xA0Ee7A142d267C1f36714E4a8F75759e8cF4862b';

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setUser((prev) => ({
        ...prev,
        address,
        connected: true,
      }));

      // Get balances
      await updateBalance(provider, address);
      await updatePoolInfo(provider, address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Update balance
  const updateBalance = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const ethBalance = await provider.getBalance(address);
      const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, provider);
      const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, provider);

      const balanceA = await tokenAContract.balanceOf(address);
      const balanceB = await tokenBContract.balanceOf(address);

      setUser((prev) => ({
        ...prev,
        balance: ethers.formatEther(ethBalance),
        balanceA: ethers.formatEther(balanceA),
        balanceB: ethers.formatEther(balanceB),
      }));
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Update pool info
  const updatePoolInfo = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const miniSwapContract = new ethers.Contract(
        MINISWAP_ADDRESS,
        MINISWAP_ABI,
        provider
      );

      const [reserve0, reserve1, totalLiquidity] = await miniSwapContract.getPoolInfo(
        TOKEN_A_ADDRESS,
        TOKEN_B_ADDRESS
      );

      const userLpBalance = await miniSwapContract.getLpTokenBalance(
        TOKEN_A_ADDRESS,
        TOKEN_B_ADDRESS,
        address
      );

      setPool({
        reserve0: ethers.formatEther(reserve0),
        reserve1: ethers.formatEther(reserve1),
        totalLiquidity: ethers.formatEther(totalLiquidity),
        userLpBalance: ethers.formatEther(userLpBalance),
      });
    } catch (error) {
      console.error('Error updating pool info:', error);
    }
  };

  // Add Liquidity
  const handleAddLiquidity = async () => {
    if (!user.address) {
      alert('Please connect wallet first');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountA = ethers.parseEther(liquidityAmountA || '0');
      const amountB = ethers.parseEther(liquidityAmountB || '0');

      // Approve tokens
      const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer);
      const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, signer);

      const approveTxA = await tokenAContract.approve(MINISWAP_ADDRESS, amountA);
      await approveTxA.wait();

      const approveTxB = await tokenBContract.approve(MINISWAP_ADDRESS, amountB);
      await approveTxB.wait();

      // Add liquidity
      const miniSwapContract = new ethers.Contract(MINISWAP_ADDRESS, MINISWAP_ABI, signer);
      const tx = await miniSwapContract.addLiquidity(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, amountA, amountB);
      await tx.wait();

      alert('Liquidity added successfully!');
      setLiquidityAmountA('');
      setLiquidityAmountB('');

      // Update balance and pool info
      await updateBalance(provider, user.address);
      await updatePoolInfo(provider, user.address);
    } catch (error) {
      console.error('Error adding liquidity:', error);
      alert('Error adding liquidity. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Swap
  const handleSwap = async () => {
    if (!user.address) {
      alert('Please connect wallet first');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountIn = ethers.parseEther(swapInputAmount || '0');

      // Approve token
      const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer);
      const approveTx = await tokenAContract.approve(MINISWAP_ADDRESS, amountIn);
      await approveTx.wait();

      // Swap
      const miniSwapContract = new ethers.Contract(MINISWAP_ADDRESS, MINISWAP_ABI, signer);
      const tx = await miniSwapContract.swap(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, amountIn);
      await tx.wait();

      alert('Swap successful!');
      setSwapInputAmount('');

      // Update balances
      await updateBalance(provider, user.address);
      await updatePoolInfo(provider, user.address);
    } catch (error) {
      console.error('Error swapping:', error);
      alert('Error swapping. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Remove Liquidity
  const handleRemoveLiquidity = async () => {
    if (!user.address) {
      alert('Please connect wallet first');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amount = ethers.parseEther(removeLiquidityAmount || '0');

      const miniSwapContract = new ethers.Contract(MINISWAP_ADDRESS, MINISWAP_ABI, signer);
      const tx = await miniSwapContract.removeLiquidity(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, amount);
      await tx.wait();

      alert('Liquidity removed successfully!');
      setRemoveLiquidityAmount('');

      // Update balance and pool info
      await updateBalance(provider, user.address);
      await updatePoolInfo(provider, user.address);
    } catch (error) {
      console.error('Error removing liquidity:', error);
      alert('Error removing liquidity. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>MiniSwap 🔄</h1>
        <button
          className={`wallet-btn ${user.connected ? 'connected' : ''}`}
          onClick={connectWallet}
        >
          {user.connected ? `Connected: ${user.address?.slice(0, 6)}...${user.address?.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>

      {user.connected && (
        <div className="container">
          <div className="card balance-card">
            <h2>Your Balances</h2>
            <div className="balance-info">
              <div className="balance-item">
                <span>ETH:</span>
                <strong>{parseFloat(user.balance).toFixed(4)}</strong>
              </div>
              <div className="balance-item">
                <span>Token A:</span>
                <strong>{parseFloat(user.balanceA).toFixed(4)}</strong>
              </div>
              <div className="balance-item">
                <span>Token B:</span>
                <strong>{parseFloat(user.balanceB).toFixed(4)}</strong>
              </div>
              <div className="balance-item">
                <span>LP Tokens:</span>
                <strong>{parseFloat(pool.userLpBalance).toFixed(4)}</strong>
              </div>
            </div>
          </div>

          <div className="card pool-info-card">
            <h2>Pool Info</h2>
            <div className="pool-info">
              <div className="pool-item">
                <span>Reserve A:</span>
                <strong>{parseFloat(pool.reserve0).toFixed(4)}</strong>
              </div>
              <div className="pool-item">
                <span>Reserve B:</span>
                <strong>{parseFloat(pool.reserve1).toFixed(4)}</strong>
              </div>
              <div className="pool-item">
                <span>Total LP:</span>
                <strong>{parseFloat(pool.totalLiquidity).toFixed(4)}</strong>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'swap' ? 'active' : ''}`}
              onClick={() => setActiveTab('swap')}
            >
              Swap
            </button>
            <button
              className={`tab-btn ${activeTab === 'liquidity' ? 'active' : ''}`}
              onClick={() => setActiveTab('liquidity')}
            >
              Liquidity
            </button>
            <button
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Info
            </button>
          </div>

          {activeTab === 'swap' && (
            <div className="card">
              <h2>Swap Tokens</h2>
              <input
                type="number"
                placeholder="Amount of Token A"
                value={swapInputAmount}
                onChange={(e) => setSwapInputAmount(e.target.value)}
              />
              <p className="swap-info">You will receive: {swapInputAmount} Token B (1:1 ratio)</p>
              <button onClick={handleSwap} disabled={loading || !swapInputAmount}>
                {loading ? 'Processing...' : 'Swap'}
              </button>
            </div>
          )}

          {activeTab === 'liquidity' && (
            <div className="card">
              <h2>Manage Liquidity</h2>
              <div className="liquidity-section">
                <h3>Add Liquidity</h3>
                <input
                  type="number"
                  placeholder="Token A Amount"
                  value={liquidityAmountA}
                  onChange={(e) => setLiquidityAmountA(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Token B Amount (must be equal)"
                  value={liquidityAmountB}
                  onChange={(e) => setLiquidityAmountB(e.target.value)}
                />
                <button onClick={handleAddLiquidity} disabled={loading || !liquidityAmountA || !liquidityAmountB}>
                  {loading ? 'Processing...' : 'Add Liquidity'}
                </button>
              </div>

              <div className="liquidity-section">
                <h3>Remove Liquidity</h3>
                <input
                  type="number"
                  placeholder="LP Token Amount"
                  value={removeLiquidityAmount}
                  onChange={(e) => setRemoveLiquidityAmount(e.target.value)}
                />
                <button onClick={handleRemoveLiquidity} disabled={loading || !removeLiquidityAmount}>
                  {loading ? 'Processing...' : 'Remove Liquidity'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="card">
              <h2>Contract Addresses</h2>
              <div className="info-content">
                <p><strong>MiniSwap:</strong> <code>{MINISWAP_ADDRESS}</code></p>
                <p><strong>Token A:</strong> <code>{TOKEN_A_ADDRESS}</code></p>
                <p><strong>Token B:</strong> <code>{TOKEN_B_ADDRESS}</code></p>
              </div>
              <h3>Features</h3>
              <ul>
                <li>✓ Add/Remove Liquidity with 1:1 token ratio</li>
                <li>✓ Swap tokens with fair pricing</li>
                <li>✓ LP token rewards</li>
                <li>✓ Metamask integration</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {!user.connected && (
        <div className="welcome">
          <h2>Welcome to MiniSwap</h2>
          <p>A simplified AMM implementation for learning Uniswap mechanics</p>
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet to Start
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
