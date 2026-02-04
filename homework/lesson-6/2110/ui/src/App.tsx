import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import { ConnectWallet } from './components/ConnectWallet'
import { RPC, CHAIN_ID } from './constants'
const CHAIN_ID_HEX = '0x' + CHAIN_ID.toString(16);
import { Token } from './components/Token'

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [canSendTx, setCanSendTx] = useState<boolean>(false)
  const [chainId, setChainId] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)

  const handleConnect = (connectedAccount: string, connectedProvider: ethers.BrowserProvider, _canSendTx: boolean) => {
    setAccount(connectedAccount)
    setProvider(connectedProvider)
    setCanSendTx(_canSendTx)
    setNetworkError(null)
  }

  useEffect(() => {
    if (!provider) return;
    (async () => {
      try {
        const cid = await provider.send('eth_chainId', []);
        setChainId(cid);
      } catch (e) {
        console.warn('Failed to query chainId from provider', e);
      }
    })();
  }, [provider]);

  // Fetch and update native balance when provider/account/chain changes
  useEffect(() => {
    if (!provider || !account) {
      setBalance(null);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const hex = await provider.send('eth_getBalance', [account, 'latest']);
        const bn = BigInt(hex);
        const formatted = Number(ethers.formatEther(bn));
        const display = `${formatted.toFixed(6)} PAS`;
        if (mounted) setBalance(display);
      } catch (e) {
        console.warn('Failed to fetch balance', e);
        if (mounted) setBalance(null);
      }
    })();

    return () => { mounted = false };
  }, [provider, account, chainId]);

  const switchToPassetHub = async () => {
    setNetworkError(null);
    const ethAny = (window as any).ethereum;
    if (!ethAny) {
      setNetworkError('No injected wallet found');
      return;
    }
    try {
      await ethAny.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
      // Refresh chainId
      if (provider) {
        const cid = await provider.send('eth_chainId', []);
        setChainId(cid);
      }
    } catch (err: any) {
      // 4902 => chain not added
      if (err && err.code === 4902) {
        try {
          await ethAny.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: CHAIN_ID_HEX,
                chainName: 'PassetHub Testnet',
                rpcUrls: [RPC],
                nativeCurrency: { name: 'Pas', symbol: 'PAS', decimals: 18 },
              },
            ],
          });
          await ethAny.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
          if (provider) {
            const cid = await provider.send('eth_chainId', []);
            setChainId(cid);
          }
        } catch (e: any) {
          setNetworkError(e?.message || 'Failed to add/switch network');
        }
      } else {
        setNetworkError(err?.message || 'Failed to switch network');
      }
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <h1>ERC2110FT Token Dashboard</h1>
          <div className="subtitle">Manage and interact with the ERC2110FT token</div>
          {!account && (
            <div className="connect-row">
              <ConnectWallet onConnect={handleConnect} />
            </div>
          )}
        </div>
        {account && (
          <div className="account-display">
            <div className="account-line">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
              <span className="balance">{balance ? ` · ${balance}` : ''}</span>
            </div>
            <div className="chain-status">Chain: {chainId ? Number.parseInt(chainId, 16) : 'unknown'}</div>
            {chainId !== CHAIN_ID_HEX && (
              <div>
                <button onClick={switchToPassetHub} className="switch-btn">Switch to PassetHub</button>
                {networkError && <div className="error-msg">{networkError}</div>}
              </div>
            )}
          </div>
        )}
      </header>

      <main>
        {account && provider && (
          <div className="dashboard">
            {!canSendTx && (
              <div className="warning-banner">⚠️ Connected wallet cannot send transactions; please use MetaMask or another EVM wallet</div>
            )}
            <Token provider={provider} account={account} canSendTx={canSendTx} />
          </div>
        )}
        {!account && (
          <p className="welcome-msg">Please connect your wallet to start.</p>
        )}
      </main>
    </div>
  )
}

export default App
