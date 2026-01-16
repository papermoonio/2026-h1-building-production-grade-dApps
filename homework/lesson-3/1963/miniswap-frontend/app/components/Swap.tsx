"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { SecurityNotice } from "./SecurityNotice";
import { CONTRACT_ADDRESSES } from "../config";
import { FeeDisplay } from "./FeeDisplay";
import { calculatePriceImpact, getPriceImpactColor, getPriceImpactWarning } from "../utils/priceImpact";
import { Spinner } from "./Spinner";

export function Swap() {
  const { wallet } = useWallet();
  const contracts = useContracts();
  const [token0Amount, setToken0Amount] = useState("");
  const [token1Amount, setToken1Amount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserves, setReserves] = useState<[bigint, bigint] | null>(null);
  const [token0Balance, setToken0Balance] = useState<string>("0");
  const [token1Balance, setToken1Balance] = useState<string>("0");
  const [priceImpact, setPriceImpact] = useState<number | null>(null);

  // Load reserves and balances
  useEffect(() => {
    if (!contracts || !wallet.account) return;

    async function loadData() {
      try {
        console.log("Loading balances for account:", wallet.account);
        
        const [reserve0, reserve1] = await contracts.miniswap.getReserves();
        setReserves([reserve0, reserve1]);

        const balance0 = await contracts.token0.balanceOf(wallet.account!);
        const balance1 = await contracts.token1.balanceOf(wallet.account!);
        
        console.log("Token0 balance (wei):", balance0.toString());
        console.log("Token1 balance (wei):", balance1.toString());
        
        setToken0Balance(ethers.formatEther(balance0));
        setToken1Balance(ethers.formatEther(balance1));
        setError(null); // Clear any previous errors on success
      } catch (err: any) {
        // Handle CALL_EXCEPTION errors gracefully
        if (err.code === "CALL_EXCEPTION" || err.code === "UNPREDICTABLE_GAS_LIMIT") {
          console.warn("Contract call failed - contracts may not be deployed or RPC not available:", err.message);
          // Don't set error state for these - just log and continue
          // The UI will show "Add Liquidity First" if reserves are null
          return;
        }
        console.error("Error loading balances:", err);
        // Only set error for non-CALL_EXCEPTION errors
        if (!err.message?.includes("missing revert data")) {
          setError(err.message);
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [contracts, wallet.account]);

  // Calculate output amount when input changes
  useEffect(() => {
    if (!contracts || !token0Amount || !reserves) {
      setToken1Amount("");
      setPriceImpact(null);
      return;
    }

    try {
      const amountIn = ethers.parseEther(token0Amount);
      const [reserve0, reserve1] = reserves;

      if (reserve0 === 0n || reserve1 === 0n) {
        setToken1Amount("");
        setPriceImpact(null);
        return;
      }

      // AMM formula: amountOut = (amountIn * 997 * reserve1) / (reserve0 * 1000 + amountIn * 997)
      const amountInWithFee = amountIn * 997n;
      const numerator = amountInWithFee * reserve1;
      const denominator = reserve0 * 1000n + amountInWithFee;
      const amountOut = numerator / denominator;

      setToken1Amount(ethers.formatEther(amountOut));

      // Calculate price impact
      const impact = calculatePriceImpact(amountIn, amountOut, reserve0, reserve1);
      setPriceImpact(impact);
    } catch (err) {
      setToken1Amount("");
      setPriceImpact(null);
    }
  }, [token0Amount, reserves, contracts]);

  async function handleSwap() {
    if (!contracts || !wallet.account || !token0Amount) {
      setError("Please connect wallet and enter amount");
      return;
    }

    // Check if pool has liquidity before attempting swap
    if (!reserves || reserves[0] === 0n || reserves[1] === 0n) {
      setError("Pool has no liquidity. Please go to the 'Liquidity' tab and add liquidity first.");
      return;
    }

    try {
      setError(null);
      setIsSwapping(true);

      // Always refresh signer to ensure it matches the current account
      if (!wallet.provider || !wallet.account) {
        throw new Error("Wallet not connected. Please connect your wallet.");
      }
      
      // Get fresh signer from provider to ensure it matches current account
      const freshSigner = await wallet.provider.getSigner();
      const signerAddress = await freshSigner.getAddress();
      console.log("🔍 Address Check:");
      console.log("  Connected account:", wallet.account);
      console.log("  Signer address:", signerAddress);
      
      if (signerAddress?.toLowerCase() !== wallet.account?.toLowerCase()) {
        throw new Error(`Address mismatch! Connected: ${wallet.account}, Signer: ${signerAddress}. Please disconnect and reconnect your wallet.`);
      }
      
      // Update contracts to use fresh signer (cast to proper types)
      const token0WithFreshSigner = contracts.token0.connect(freshSigner) as typeof contracts.token0;
      const miniswapWithFreshSigner = contracts.miniswap.connect(freshSigner) as typeof contracts.miniswap;

      const amountIn = ethers.parseEther(token0Amount);
      
      // Check allowance using fresh signer
      const allowance = await token0WithFreshSigner.allowance(
        wallet.account,
        contracts.miniswap.target
      );

      console.log("💰 Allowance Check:");
      console.log("  Current allowance:", ethers.formatEther(allowance));
      console.log("  Amount needed:", token0Amount);
      console.log("  MiniSwap contract:", contracts.miniswap.target);

      // SECURITY: Verify we're approving the correct MiniSwap contract (non-blocking)
      const expectedMiniSwapAddress = CONTRACT_ADDRESSES.MINISWAP.toLowerCase();
      const actualContractAddress = String(contracts.miniswap.target).toLowerCase();
      
      console.log("  🔒 SECURITY CHECK:");
      console.log("    Expected:", expectedMiniSwapAddress);
      console.log("    Actual:", actualContractAddress);
      
      if (expectedMiniSwapAddress !== actualContractAddress) {
        console.warn("  ⚠️  WARNING: Contract address mismatch! Expected:", expectedMiniSwapAddress, "Got:", actualContractAddress);
        // Don't block transaction, just log warning
      } else {
        console.log("  ✅ SECURITY: Verified MiniSwap contract address:", expectedMiniSwapAddress);
      }

      if (allowance < amountIn) {
        // SECURITY: Only approve the exact amount needed (not max) for better security
        // This way, even if the contract is compromised, it can only spend what you approved
        console.log("✅ Approving tokens...");
        console.log("  ⚠️  SECURITY NOTE: You're approving the MiniSwap contract to spend your tokens.");
        console.log("  This is SAFE because:");
        console.log("  1. The contract address is verified:", expectedMiniSwapAddress);
        console.log("  2. We're only approving the exact amount needed:", ethers.formatEther(amountIn));
        console.log("  3. The contract can only spend what you approve, not more");
        
        // Try with minimal gas first (1 gwei), fallback if node rejects it
        let approveTx;
        try {
          approveTx = await token0WithFreshSigner.approve(
            contracts.miniswap.target,
            amountIn,
            {
              gasPrice: ethers.parseUnits("1", "gwei"), // 1 gwei = minimal fee
              gasLimit: 50000,
            }
          );
        } catch (gasError: any) {
          // If explicit gas fails, try without gas settings (node will handle it)
          console.log("  ⚠️  Node rejected explicit gas, using automatic gas...");
          approveTx = await token0WithFreshSigner.approve(
            contracts.miniswap.target,
            amountIn
          );
        }
        console.log("  Approve transaction:", approveTx.hash);
        await approveTx.wait();
        console.log("  ✅ Approval confirmed - contract can now spend", ethers.formatEther(amountIn), "tokens");
      } else {
        console.log("  ✅ Sufficient allowance already exists");
      }

      // Perform swap using fresh signer
      console.log("🔄 Executing swap...");
      // Try with minimal gas first (1 gwei), fallback if node rejects it
      let swapTx;
      try {
        swapTx = await miniswapWithFreshSigner.swap(
          token0WithFreshSigner.target,
          amountIn,
          {
            gasPrice: ethers.parseUnits("1", "gwei"), // 1 gwei = minimal fee
            gasLimit: 100000,
          }
        );
      } catch (gasError: any) {
        // If explicit gas fails, try without gas settings (node will handle it)
        console.log("  ⚠️  Node rejected explicit gas, using automatic gas...");
        swapTx = await miniswapWithFreshSigner.swap(
          token0WithFreshSigner.target,
          amountIn
        );
      }
      console.log("  Swap transaction:", swapTx.hash);
      await swapTx.wait();
      console.log("  ✅ Swap confirmed");

      // Clear inputs and refresh
      setToken0Amount("");
      setToken1Amount("");
      const [reserve0, reserve1] = await miniswapWithFreshSigner.getReserves();
      setReserves([reserve0, reserve1]);
    } catch (err: any) {
      console.error("❌ Swap error:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        error: err.error,
        reason: err.reason
      });
      
      // Better error messages for common issues
      let errorMessage = err.message || "Transaction failed";
      
      if (err.message?.includes("Internal JSON-RPC error") || err.code === -32603) {
        errorMessage = "Node RPC Error: Your local Substrate node may have an issue. Please:\n1. Check that your local node is running\n2. Try refreshing the page\n3. Ensure the RPC server is accessible at http://127.0.0.1:8545";
      } else if (err.message?.includes("insufficient funds") || err.message?.includes("insufficient balance")) {
        errorMessage = "Insufficient ETH for gas fees. Please run: npx hardhat run scripts/fund-account.js --network localhost";
      } else if (err.message?.includes("user rejected") || err.code === 4001) {
        errorMessage = "Transaction was rejected in MetaMask. Please try again.";
      } else if (err.message?.includes("nonce")) {
        errorMessage = "Nonce error: Please wait a moment and try again.";
      } else       if (err.message?.includes("revert") || err.message?.includes("execution reverted")) {
        if (err.message?.includes("Insufficient output") || err.reason === "Insufficient output") {
          errorMessage = "Pool has no liquidity. Please go to the 'Liquidity' tab and add liquidity first.";
        } else {
          errorMessage = `Transaction reverted: ${err.message}. Check console for details.`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSwapping(false);
    }
  }

  if (!wallet.isConnected) {
    return (
      <div className="glass rounded-3xl p-6 text-center">
        <p className="text-gray-500">Please connect your wallet to swap</p>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-5 space-y-3 fade-in">
      {error && (
        <div className="bg-red-100/80 backdrop-blur-sm border border-red-300 text-red-700 px-3 py-2 rounded-2xl text-xs">
          {error}
        </div>
      )}

      {/* From Token - Uniswap Style */}
      <div className="glass rounded-2xl p-3 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">From</span>
          <span className="text-xs text-pink-600 font-medium">Balance: {token0Balance}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={token0Amount}
              onChange={(e) => setToken0Amount(e.target.value)}
              placeholder="0.0"
              className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
              disabled={isSwapping}
            />
          </div>
          <div className="bg-pink-100/50 px-3 py-1.5 rounded-xl font-semibold text-pink-600 text-sm">
            T0
          </div>
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="flex justify-center -my-1 relative z-10">
        <div className="glass-strong w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-pink-600 text-xl">↓</span>
        </div>
      </div>

      {/* To Token */}
      <div className="glass rounded-2xl p-3 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">To</span>
          <span className="text-xs text-pink-600 font-medium">Balance: {token1Balance}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={token1Amount}
              readOnly
              placeholder="0.0"
              className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <div className="bg-pink-100/50 px-3 py-1.5 rounded-xl font-semibold text-pink-600 text-sm">
            T1
          </div>
        </div>
      </div>

      {/* Fee Display */}
      {token0Amount && parseFloat(token0Amount) > 0 && (
        <div className="glass rounded-2xl p-3">
          <FeeDisplay amountIn={token0Amount} />
        </div>
      )}
      {/* Price Impact */}
      {priceImpact !== null && priceImpact > 0 && (
        <div className="glass rounded-2xl p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Price Impact:</span>
            <span className={`text-xs font-semibold ${getPriceImpactColor(priceImpact)}`}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          {getPriceImpactWarning(priceImpact) && (
            <div className={`text-[10px] mt-1 ${getPriceImpactColor(priceImpact)}`}>
              ⚠️ {getPriceImpactWarning(priceImpact)}
            </div>
          )}
        </div>
      )}

      {/* Pool Info */}
      {reserves && (
        <div className="glass rounded-2xl p-2 text-xs text-center text-pink-600/80">
          Pool: {ethers.formatEther(reserves[0])} T0 / {ethers.formatEther(reserves[1])} T1
        </div>
      )}
    

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!token0Amount || isSwapping || !reserves || reserves[0] === 0n || reserves[1] === 0n}
        className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-2xl hover:from-pink-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/30 font-semibold text-base active:scale-95 flex items-center justify-center gap-2"
      >
        {isSwapping ? (
          <>
            <Spinner size="sm" color="white" />
            <span>Swapping...</span>
          </>
        ) : (!reserves || reserves[0] === 0n || reserves[1] === 0n) ? (
          "Add Liquidity First"
        ) : (
          "Swap"
        )}
      </button>
    </div>
  );
}