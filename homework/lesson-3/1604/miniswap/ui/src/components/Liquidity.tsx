import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MiniSwap_ADDRESS, MiniSwap_ABI, ERC20_ABI, RPC, CHAIN_ID_HEX } from '../constants';

interface LiquidityProps {
    provider: ethers.BrowserProvider;
    account: string;
    canSendTx?: boolean;
}

export const Liquidity = ({ provider, account, canSendTx = false }: LiquidityProps) => {
    const [mode, setMode] = useState<'add' | 'remove'>('add');
    // Pre-fill with deployed test tokens
    const [tokenA, setTokenA] = useState('0x5a8d68E16f0373238016baE06617a2A12C48015f');
    const [tokenB, setTokenB] = useState('0x40be9502BE89d15897453699BA8264762B28FF9a');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');
    const [balanceA, setBalanceA] = useState<string | null>(null);
    const [balanceB, setBalanceB] = useState<string | null>(null);

    const withTimeout = async <T,>(p: Promise<T>, ms = 15000): Promise<T> => {
        return await Promise.race([
            p,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('RPC call timed out')), ms)),
        ] as any);
    };

    // Auto-fetch token balances when token addresses or account change
    useEffect(() => {
        let mounted = true;
        if (!account) {
            setBalanceA(null);
            setBalanceB(null);
            return;
        }
        const readProvider = new ethers.JsonRpcProvider(RPC);
        (async () => {
            try {
                // token A
                const codeA = await withTimeout(readProvider.getCode(tokenA));
                if (!codeA || codeA === '0x') {
                    if (mounted) setBalanceA('—');
                } else {
                    const tokenARead = new ethers.Contract(tokenA, ERC20_ABI, readProvider as any);
                    const [decA, symA, balA] = await Promise.all([tokenARead.decimals(), tokenARead.symbol(), tokenARead.balanceOf(account)]);
                    try {
                        const fa = Number(ethers.formatUnits(balA, Number(decA)));
                        if (mounted) setBalanceA(`${fa.toFixed(6)} ${symA}`);
                    } catch (e) {
                        if (mounted) setBalanceA('N/A');
                    }
                }

                // token B
                const codeB = await withTimeout(readProvider.getCode(tokenB));
                if (!codeB || codeB === '0x') {
                    if (mounted) setBalanceB('—');
                } else {
                    const tokenBRead = new ethers.Contract(tokenB, ERC20_ABI, readProvider as any);
                    const [decB, symB, balB] = await Promise.all([tokenBRead.decimals(), tokenBRead.symbol(), tokenBRead.balanceOf(account)]);
                    try {
                        const fb = Number(ethers.formatUnits(balB, Number(decB)));
                        if (mounted) setBalanceB(`${fb.toFixed(6)} ${symB}`);
                    } catch (e) {
                        if (mounted) setBalanceB('N/A');
                    }
                }
            } catch (e) {
                console.warn('Could not read token balances in effect', e);
                if (mounted) {
                    setBalanceA(null);
                    setBalanceB(null);
                }
            }
        })();

        return () => { mounted = false; };
    }, [tokenA, tokenB, account]);

    const handleAddLiquidity = async () => {
        setStatus('Preparing to add liquidity...');
        console.log('handleAddLiquidity start', { tokenA, tokenB, amount, account });
        try {
            // Quick check for transaction capability
            if (!canSendTx) {
                setStatus('Connected wallet cannot send transactions; please use MetaMask or another EVM wallet');
                return;
            }

            // Basic validation
            if (!tokenA || !tokenB) {
                setStatus('Failed: token addresses required');
                return;
            }
            let amountWei: bigint;
            try {
                amountWei = ethers.parseEther(amount || '0');
            } catch (e) {
                setStatus('Failed: invalid amount');
                return;
            }
            if (amountWei === 0n) {
                setStatus('Failed: amount must be > 0');
                return;
            }

            setStatus('Getting signer...');

            // Ensure provider is on the expected chain
            try {
                const chainId = await provider.send('eth_chainId', []);
                if (chainId !== CHAIN_ID_HEX) {
                    setStatus(`Connected wallet is on wrong network (${chainId}); please switch to PassetHub (chainId ${CHAIN_ID_HEX}).`);
                    return;
                }
            } catch (e: any) {
                console.warn('Failed to check chainId', e);
            }

            // Ensure provider has the account available via eth_accounts
            let rpcAccounts: string[] = [];
            try {
                rpcAccounts = await withTimeout(provider.send('eth_accounts', []), 5000) as string[];
                console.log('rpcAccounts', rpcAccounts);
            } catch (e: any) {
                console.warn('eth_accounts failed or timed out', e);
            }

            if (!rpcAccounts || rpcAccounts.length === 0) {
                setStatus('No accounts available from provider; please reconnect wallet');
                return;
            }

            // Verify token contracts exist on the network
            let readProvider = new ethers.JsonRpcProvider(RPC);
            try {
                const codeA = await withTimeout(readProvider.getCode(tokenA));
                if (!codeA || codeA === '0x') {
                    setStatus(`No contract found at token address ${tokenA}. Check the address and network.`);
                    return;
                }
                const codeB = await withTimeout(readProvider.getCode(tokenB));
                if (!codeB || codeB === '0x') {
                    setStatus(`No contract found at token address ${tokenB}. Check the address and network.`);
                    return;
                }
            } catch (e: any) {
                console.warn('Failed to verify token contracts', e);
            }

            // Fetch and show token balances for UI convenience
            try {
                const tokenARead = new ethers.Contract(tokenA, ERC20_ABI, readProvider as any);
                const tokenBRead = new ethers.Contract(tokenB, ERC20_ABI, readProvider as any);
                const [decA, symA, balA] = await Promise.all([tokenARead.decimals(), tokenARead.symbol(), tokenARead.balanceOf(account)]);
                const [decB, symB, balB] = await Promise.all([tokenBRead.decimals(), tokenBRead.symbol(), tokenBRead.balanceOf(account)]);
                try {
                    const fa = Number(ethers.formatUnits(balA, Number(decA)));
                    setBalanceA(`${fa.toFixed(6)} ${symA}`);
                } catch (e) {
                    setBalanceA('N/A');
                }
                try {
                    const fb = Number(ethers.formatUnits(balB, Number(decB)));
                    setBalanceB(`${fb.toFixed(6)} ${symB}`);
                } catch (e) {
                    setBalanceB('N/A');
                }
            } catch (e) {
                console.warn('Could not read token balances', e);
                setBalanceA(null);
                setBalanceB(null);
            }


            // Normalize and compare addresses to avoid casing mismatches
            try {
                const rpcAddr = ethers.getAddress(rpcAccounts[0]);
                const uiAddr = ethers.getAddress(account);
                if (rpcAddr.toLowerCase() !== uiAddr.toLowerCase()) {
                    console.warn('Account mismatch between UI and provider', { rpcAddr, uiAddr });
                    setStatus('Account mismatch between UI and wallet; please reconnect');
                    return;
                }
            } catch (e) {
                console.warn('Failed to normalize addresses', e);
            }

            // Use a signer bound to the explicit account to avoid provider permission race
            let signer = await provider.getSigner(rpcAccounts[0]);
            console.log('got signer', rpcAccounts[0]);

            // If signer cannot send txs, try to find MetaMask injected provider and create signer from it
            const signerSupportsSend = typeof (signer as any).sendTransaction === 'function';
            if (!signerSupportsSend) {
                console.warn('Current signer does not support sendTransaction, looking for MetaMask');
                const ethAny = (window as any).ethereum;
                let metaEth = undefined;
                if (ethAny?.isMetaMask) metaEth = ethAny;
                if (ethAny?.providers && Array.isArray(ethAny.providers)) {
                    metaEth = ethAny.providers.find((p: any) => p.isMetaMask) || metaEth;
                }
                if (metaEth) {
                    const mmProvider = new ethers.BrowserProvider(metaEth);
                    try {
                        signer = await mmProvider.getSigner(rpcAccounts[0]);
                        if (typeof (signer as any).sendTransaction === 'function') {
                            console.log('Switched to MetaMask signer');
                        } else {
                            console.warn('MetaMask signer still does not support sendTransaction');
                        }
                    } catch (e) {
                        console.warn('Failed to get signer from MetaMask provider', e);
                    }
                }
            }

            setStatus('Connecting to contracts...');
            const MiniSwap = new ethers.Contract(MiniSwap_ADDRESS, MiniSwap_ABI, signer);
            // Use a JsonRpcProvider (network RPC) for reliable read operations
            const tokenARead = new ethers.Contract(tokenA, ERC20_ABI, readProvider as any);
            const tokenBRead = new ethers.Contract(tokenB, ERC20_ABI, readProvider as any);
            // Use signer-bound contracts for write operations (ensure runner supports sending txs)
            const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, signer as any);
            const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, signer as any);
            console.log('contracts initialized (read via RPC, write via signer)');

            // Check allowances and request approvals if necessary
            setStatus('Checking allowances...');
            let allowanceA: bigint = 0n;
            try {
                allowanceA = await withTimeout(tokenARead.allowance(account, MiniSwap_ADDRESS));
                console.log('allowanceA', allowanceA.toString());
            } catch (e: any) {
                throw new Error(`Failed to read allowance for token A: ${e?.message || e}`);
            }

            if (allowanceA < amountWei) {
                setStatus('Approving Token A...');
                const txA = await tokenAContract.approve(MiniSwap_ADDRESS, amountWei);
                console.log('approveA tx', txA.hash);
                setStatus(`Sent approve for Token A: ${txA.hash}. Waiting for confirm...`);
                await withTimeout(txA.wait(), 120000);
                setStatus('Token A approved');
            }

            let allowanceB: bigint = 0n;
            try {
                allowanceB = await withTimeout(tokenBRead.allowance(account, MiniSwap_ADDRESS));
                console.log('allowanceB', allowanceB.toString());
            } catch (e: any) {
                throw new Error(`Failed to read allowance for token B: ${e?.message || e}`);
            }

            if (allowanceB < amountWei) {
                setStatus('Approving Token B...');
                // Ensure signer supports sending txs
                if (typeof (tokenBContract as any).approve !== 'function' || typeof (signer as any).sendTransaction !== 'function') {
                    throw new Error('Connected wallet cannot send transactions; please use MetaMask or another EVM wallet');
                }
                const txB = await tokenBContract.approve(MiniSwap_ADDRESS, amountWei);
                console.log('approveB tx', txB.hash);
                setStatus(`Sent approve for Token B: ${txB.hash}. Waiting for confirm...`);
                await withTimeout(txB.wait(), 120000);
                setStatus('Token B approved');
            }

            setStatus('Submitting Add Liquidity transaction...');
            if (typeof (MiniSwap as any).addLiquidity !== 'function' || typeof (signer as any).sendTransaction !== 'function') {
                throw new Error('Connected wallet cannot send transactions; please use MetaMask or another EVM wallet');
            }
            const tx = await MiniSwap.addLiquidity(tokenA, tokenB, amountWei);
            console.log('addLiquidity tx', tx.hash);
            setStatus(`Tx submitted: ${tx.hash}. Waiting for confirmation...`);
            const receipt = await withTimeout(tx.wait(), 180000);
            console.log('addLiquidity receipt', receipt);
            if (receipt && (receipt as any).status === 1) {
                setStatus('Liquidity Added!');
            } else {
                setStatus('Transaction failed or reverted');
            }
        } catch (err: any) {
            console.error(err);
            // Better user-facing error messages for common cases: handle MetaMask/user denied consistently
            const msg = err?.message || '';
            if (
                err?.code === 'ACTION_REJECTED' ||
                /user denied|user rejected|denied transaction signature|rejected transaction signature|ethers-user-denied/i.test(msg)
            ) {
                setStatus('Failed: transaction rejected by user');
            } else {
                setStatus(`Failed: ${msg || String(err)}`);
            }
        }
    };

    const handleRemoveLiquidity = async () => {
        setStatus('Removing Liquidity...');
        try {
            const signer = await provider.getSigner();
            const MiniSwap = new ethers.Contract(MiniSwap_ADDRESS, MiniSwap_ABI, signer);
            const amountWei = ethers.parseEther(amount);

            setStatus('Submitting Remove Liquidity transaction...');
            const tx = await MiniSwap.removeLiquidity(
                tokenA,
                tokenB,
                amountWei
            );
            await tx.wait();
            setStatus('Liquidity Removed!');
        } catch (err: any) {
            console.error(err);
            setStatus(`Failed: ${err.message}`);
        }
    };

    return (
        <div className="card">
            <h2>Liquidity</h2>
            <div className="tabs">
                <button className={mode === 'add' ? 'active' : ''} onClick={() => setMode('add')}>Add</button>
                <button className={mode === 'remove' ? 'active' : ''} onClick={() => setMode('remove')}>Remove</button>
            </div>

            <div className="input-group">
                <label>Token A Address</label>
                <input placeholder="0x..." value={tokenA} onChange={(e) => setTokenA(e.target.value)} />
                <div className="token-balance">Balance: {balanceA ?? '—'}</div>
            </div>
            <div className="input-group">
                <label>Token B Address</label>
                <input placeholder="0x..." value={tokenB} onChange={(e) => setTokenB(e.target.value)} />
                <div className="token-balance">Balance: {balanceB ?? '—'}</div>
            </div>

            {mode === 'add' && (
                <>
                    <div className="input-group">
                        <label>TokenAmount</label>
                        <input placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <button onClick={handleAddLiquidity}>Add Liquidity</button>
                </>
            )}

            {mode === 'remove' && (
                <>
                    <div className="input-group">
                        <label>Token Amount</label>
                        <input placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <button onClick={handleRemoveLiquidity}>Remove Liquidity</button>
                </>
            )}

            {status && <p className="status-msg">{status}</p>}
        </div>
    );
};
