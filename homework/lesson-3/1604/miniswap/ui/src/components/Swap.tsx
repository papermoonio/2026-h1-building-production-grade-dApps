import { useState } from 'react';
import { ethers } from 'ethers';
import { MiniSwap_ADDRESS, MiniSwap_ABI, ERC20_ABI, RPC, CHAIN_ID_HEX } from '../constants';

interface SwapProps {
    provider: ethers.BrowserProvider;
    account: string;
    canSendTx?: boolean;
}

export const Swap = ({ provider, account, canSendTx = false }: SwapProps) => {
    const [tokenIn, setTokenIn] = useState('');
    const [tokenOut, setTokenOut] = useState('');
    const [amountIn, setAmountIn] = useState('');
    const [status, setStatus] = useState('');

    const withTimeout = async <T,>(p: Promise<T>, ms = 15000): Promise<T> => {
        return await Promise.race([
            p,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('RPC call timed out')), ms)),
        ] as any);
    };

    const handleSwap = async () => {
        setStatus('Preparing swap...');
        console.log('handleSwap start', { tokenIn, tokenOut, amountIn, account });
        try {
            if (!canSendTx) {
                setStatus('Connected wallet cannot send transactions; please use MetaMask or another EVM wallet');
                return;
            }

            if (!tokenIn || !tokenOut) {
                setStatus('Token addresses required');
                return;
            }

            // Ensure wallet is on the expected network
            try {
                const chainId = await provider.send('eth_chainId', []);
                if (chainId !== CHAIN_ID_HEX) {
                    setStatus(`Connected wallet is on wrong network (${chainId}); please switch to PassetHub (chainId ${CHAIN_ID_HEX}).`);
                    return;
                }
            } catch (e: any) {
                console.warn('Failed to check chainId', e);
            }

            let amountInWei: bigint;
            try {
                amountInWei = ethers.parseEther(amountIn || '0');
            } catch (e) {
                setStatus('Invalid amount');
                return;
            }
            if (amountInWei === 0n) {
                setStatus('Amount must be > 0');
                return;
            }

            const signer = await provider.getSigner();
            console.log('swap: signer', typeof (signer as any).sendTransaction === 'function');
            const uniswap = new ethers.Contract(MiniSwap_ADDRESS, MiniSwap_ABI, signer);
            // Use JSON-RPC provider for reliable read operations
            const readProvider = new ethers.JsonRpcProvider(RPC);
            const tokenInRead = new ethers.Contract(tokenIn, ERC20_ABI, readProvider as any);
            const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);

            // Check tokenIn and tokenOut contracts exist before calling allowance
            try {
                const codeIn = await withTimeout(readProvider.getCode(tokenIn));
                if (!codeIn || codeIn === '0x') throw new Error(`No contract found at token address ${tokenIn}`);
                const codeOut = await withTimeout(readProvider.getCode(tokenOut));
                if (!codeOut || codeOut === '0x') throw new Error(`No contract found at token address ${tokenOut}`);
            } catch (e: any) {
                throw new Error(`Failed to verify token contract at ${e?.message || e}`);
            }

            // Check allowance with a timeout and clearer messaging
            let allowance: bigint = 0n;
            try {
                allowance = await withTimeout(tokenInRead.allowance(account, MiniSwap_ADDRESS));
                console.log('allowance', allowance.toString());
            } catch (e: any) {
                throw new Error('Failed to read token allowance from network RPC. Please ensure the token contract is deployed and reachable; try again or refresh the page.');
            }

            if (allowance < amountInWei) {
                setStatus('Approving token...');
                if (typeof (signer as any).sendTransaction !== 'function') throw new Error('Connected wallet cannot send transactions; please use MetaMask');
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
            // Friendly guidance for common issues
            if (/No contract found|Failed to verify token contract/.test(err?.message || '')) {
                setStatus(err.message);
            } else {
                setStatus(`Swap failed: ${err?.message || String(err)}`);
            }
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
