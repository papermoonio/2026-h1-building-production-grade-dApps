import { useState } from 'react';
import { ethers } from 'ethers';

interface ConnectWalletProps {
    onConnect: (account: string, provider: ethers.BrowserProvider) => void;
}

export const ConnectWallet = ({ onConnect }: ConnectWalletProps) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const connect = async () => {
        setIsConnecting(true);
        setError('');

        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                if (accounts.length > 0) {
                    onConnect(accounts[0], provider);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to connect');
            } finally {
                setIsConnecting(false);
            }
        } else {
            setError('MetaMask is not installed');
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
