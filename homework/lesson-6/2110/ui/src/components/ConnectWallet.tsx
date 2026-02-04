import { useState } from 'react';
import { ethers } from 'ethers';

interface ConnectWalletProps {
    onConnect: (account: string, provider: ethers.BrowserProvider, canSendTx: boolean) => void;
}

export const ConnectWallet = ({ onConnect }: ConnectWalletProps) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const requestAccountsWithTimeout = async (eth: any, provider: ethers.BrowserProvider, timeout = 30000) => {
        const requestPromise = (async () => {
            // Prefer standard provider.request if available
            if (typeof eth.request === 'function') {
                return await eth.request({ method: 'eth_requestAccounts' });
            }
            // Fallback to provider.send
            return await provider.send('eth_requestAccounts', []);
        })();

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out')), timeout));

        return await Promise.race([requestPromise, timeoutPromise]);
    };

    const connect = async () => {
        setIsConnecting(true);
        setError('');

        const ethAny = (window as any).ethereum;
        if (!ethAny) {
            setError('MetaMask is not installed');
            setIsConnecting(false);
            return;
        }

        // Prefer MetaMask if multiple injected providers exist
        let selectedEth = ethAny;
        if (ethAny?.providers && Array.isArray(ethAny.providers)) {
            selectedEth = ethAny.providers.find((p: any) => p.isMetaMask) || ethAny.providers[0];
        }

        const provider = new ethers.BrowserProvider(selectedEth);

        try {
            const accounts: string[] = await requestAccountsWithTimeout(selectedEth, provider, 30000) as string[];
            console.log('connect: accounts', accounts);

            if (accounts && accounts.length > 0) {
                // determine whether signer from this provider can send transactions
                let canSendTx = false;
                try {
                    const signer = await provider.getSigner(accounts[0]);
                    canSendTx = typeof (signer as any).sendTransaction === 'function';
                } catch (e) {
                    console.warn('Could not evaluate signer send capability', e);
                }

                try {
                    const checksummed = ethers.getAddress(accounts[0]);
                    console.log('onConnect', { account: checksummed, canSendTx });
                    onConnect(checksummed, provider, canSendTx);
                } catch (e) {
                    console.log('onConnect', { account: accounts[0], canSendTx });
                    onConnect(accounts[0], provider, canSendTx);
                }

                // listen to changes
                try {
                    selectedEth.on('accountsChanged', async (accts: string[]) => {
                        console.log('accountsChanged', accts);
                        if (accts && accts.length > 0) {
                            let acctCanSend = false;
                            try {
                                const signer = await provider.getSigner(accts[0]);
                                acctCanSend = typeof (signer as any).sendTransaction === 'function';
                            } catch (err) {
                                console.warn('Could not evaluate signer send capability on accountsChanged', err);
                            }

                            try {
                                const checksummed = ethers.getAddress(accts[0]);
                                onConnect(checksummed, provider, acctCanSend);
                            } catch (e) {
                                onConnect(accts[0], provider, acctCanSend);
                            }
                        } else setError('Wallet disconnected');
                    });

                    selectedEth.on('chainChanged', (chainId: string) => {
                        console.log('chainChanged', chainId);
                        window.location.reload();
                    });
                } catch (e) {
                    console.warn('Failed to attach ethereum listeners', e);
                }
            } else {
                setError('No accounts returned from wallet');
            }
        } catch (err: any) {
            console.error('connect error', err);
            setError(err.message || 'Failed to connect');
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="connect-wallet-container">
            <button onClick={connect} disabled={isConnecting} className="connect-btn">
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && <p className="error-msg">{error}</p>}
        </div>
    );
};
