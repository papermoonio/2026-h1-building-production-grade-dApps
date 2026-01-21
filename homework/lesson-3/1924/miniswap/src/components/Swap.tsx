import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MiniSwap_ADDRESS, MiniSwap_ABI, ERC20_ABI } from '../constants';

interface SwapProps {
    provider: ethers.BrowserProvider;
    account: string;
}

export const Swap = ({ provider, account }: SwapProps) => {
    const [tokenIn, setTokenIn] = useState('');
    const [tokenOut, setTokenOut] = useState('');
    const [amountIn, setAmountIn] = useState('');
    const [status, setStatus] = useState('');

    const handleSwap = async () => {
        setStatus('Swapping...');
        try {
            const signer = await provider.getSigner();
            const uniswap = new ethers.Contract(MiniSwap_ADDRESS, MiniSwap_ABI, signer);
            const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);

            const amountInWei = ethers.parseEther(amountIn);
            // Check allowance
            const allowance = await tokenInContract.allowance(account, MiniSwap_ADDRESS);
            if (allowance < amountInWei) {
                setStatus('Approving token...');
                const tx = await tokenInContract.approve(MiniSwap_ADDRESS, amountInWei);
                await tx.wait();
                setStatus('Approved. Swapping...');
            }

            const tx = await uniswap.swap(
                tokenIn,
                tokenOut,
                amountInWei
            );
            await tx.wait();
            setStatus('Swap successful!');
        } catch (err: any) {
            console.error(err);
            setStatus(`Swap failed: ${err.message}`);
        }
    };

    return (
        <div className="card">
            <h2>Swap</h2>
            <div className="input-group">
                <label>Token In Address</label>
                <input
                    placeholder="0x..."
                    value={tokenIn}
                    onChange={(e) => setTokenIn(e.target.value)}
                />
                <input
                    placeholder="Amount"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                />
            </div>
            <div className="input-group">
                <label>Token Out Address</label>
                <input
                    placeholder="0x..."
                    value={tokenOut}
                    onChange={(e) => setTokenOut(e.target.value)}
                />
            </div>
            <button onClick={handleSwap}>Swap</button>
            {status && <p className="status-msg">{status}</p>}
        </div>
    );
};
