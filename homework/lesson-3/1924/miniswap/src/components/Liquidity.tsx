import { useState } from 'react';
import { ethers } from 'ethers';
import { MiniSwap_ADDRESS, MiniSwap_ABI, ERC20_ABI } from '../constants';

interface LiquidityProps {
    provider: ethers.BrowserProvider;
    account: string;
}

export const Liquidity = ({ provider, account }: LiquidityProps) => {
    const [mode, setMode] = useState<'add' | 'remove'>('add');
    const [tokenA, setTokenA] = useState('');
    const [tokenB, setTokenB] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');

    const handleAddLiquidity = async () => {
        setStatus('Adding Liquidity...');
        try {
            const signer = await provider.getSigner();
            const MiniSwap = new ethers.Contract(MiniSwap_ADDRESS, MiniSwap_ABI, signer);
            const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, signer);
            const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, signer);

            const amountWei = ethers.parseEther(amount);

            // Approve Token A
            const allowanceA = await tokenAContract.allowance(account, MiniSwap_ADDRESS);
            if (allowanceA < amountWei) {
                setStatus('Approving Token A...');
                const txA = await tokenAContract.approve(MiniSwap_ADDRESS, amountWei);
                await txA.wait();
            }

            // Approve Token B
            const allowanceB = await tokenBContract.allowance(account, MiniSwap_ADDRESS);
            if (allowanceB < amountWei) {
                setStatus('Approving Token B...');
                const txB = await tokenBContract.approve(MiniSwap_ADDRESS, amountWei);
                await txB.wait();
            }

            setStatus('Submitting Add Liquidity transaction...');
            const tx = await MiniSwap.addLiquidity(
                tokenA,
                tokenB,
                amountWei,
            );
            await tx.wait();
            setStatus('Liquidity Added!');
        } catch (err: any) {
            console.error(err);
            setStatus(`Failed: ${err.message}`);
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
            </div>
            <div className="input-group">
                <label>Token B Address</label>
                <input placeholder="0x..." value={tokenB} onChange={(e) => setTokenB(e.target.value)} />
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
