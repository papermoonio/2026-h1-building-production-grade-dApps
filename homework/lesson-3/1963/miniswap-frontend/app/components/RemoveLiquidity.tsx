"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { Spinner } from "./Spinner";

export function RemoveLiquidity() {
  const { wallet } = useWallet();
  const contracts = useContracts();
  const [lpShares, setLpShares] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myLpShares, setMyLpShares] = useState<string>("0");
  const [reserves, setReserves] = useState<[bigint, bigint] | null>(null);
  const [totalSupply, setTotalSupply] = useState<string>("0");

  useEffect(() => {
    if (!contracts || !wallet.account) return;

    async function loadData() {
      try {
        const shares = await contracts.miniswap.balance(wallet.account!);
        setMyLpShares(ethers.formatEther(shares));

        const [reserve0, reserve1] = await contracts.miniswap.getReserves();
        setReserves([reserve0, reserve1]);

        const supply = await contracts.miniswap.totalSupply();
        setTotalSupply(ethers.formatEther(supply));
        setError(null); // Clear errors on success
      } catch (err: any) {
        // Handle CALL_EXCEPTION errors gracefully
        if (err.code === "CALL_EXCEPTION" || err.code === "UNPREDICTABLE_GAS_LIMIT") {
          console.warn("Contract call failed - contracts may not be deployed:", err.message);
          return;
        }
        if (!err.message?.includes("missing revert data")) {
          setError(err.message);
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [contracts, wallet.account]);

  // Calculate amounts to receive
  const [amount0Out, amount1Out] = (() => {
    if (!lpShares || !reserves || !totalSupply || totalSupply === "0") {
      return ["0", "0"];
    }

    try {
      const sharesWei = ethers.parseEther(lpShares);
      const supplyWei = ethers.parseEther(totalSupply);
      const [reserve0, reserve1] = reserves;

      const amount0 = (sharesWei * reserve0) / supplyWei;
      const amount1 = (sharesWei * reserve1) / supplyWei;

      return [ethers.formatEther(amount0), ethers.formatEther(amount1)];
    } catch {
      return ["0", "0"];
    }
  })();

  async function handleRemoveLiquidity() {
    if (!contracts || !wallet.account || !wallet.provider || !lpShares) {
      setError("Please enter LP shares to remove");
      return;
    }

    try {
      setError(null);
      setIsRemoving(true);

      // Always refresh signer to ensure it matches the current account
      const freshSigner = await wallet.provider.getSigner();
      const signerAddress = await freshSigner.getAddress();
      
      if (signerAddress?.toLowerCase() !== wallet.account?.toLowerCase()) {
        throw new Error(`Address mismatch! Connected: ${wallet.account}, Signer: ${signerAddress}. Please disconnect and reconnect your wallet.`);
      }
      
      // Update contract to use fresh signer (cast to proper types)
      const miniswapWithFreshSigner = contracts.miniswap.connect(freshSigner) as typeof contracts.miniswap;

      const sharesWei = ethers.parseEther(lpShares);
      // Try with minimal gas first (1 gwei), fallback if node rejects it
      let tx;
      try {
        tx = await miniswapWithFreshSigner.removeLiquidity(sharesWei, {
          gasPrice: ethers.parseUnits("1", "gwei"), // 1 gwei = minimal fee
          gasLimit: 100000,
        });
      } catch (gasError: any) {
        // If explicit gas fails, try without gas settings (node will handle it)
        console.log("  ⚠️  Node rejected explicit gas, using automatic gas...");
        tx = await miniswapWithFreshSigner.removeLiquidity(sharesWei);
      }
      await tx.wait();

      setLpShares("");
      
      // Refresh data
      const shares = await contracts.miniswap.balance(wallet.account);
      setMyLpShares(ethers.formatEther(shares));

      const [reserve0, reserve1] = await contracts.miniswap.getReserves();
      setReserves([reserve0, reserve1]);

      const supply = await contracts.miniswap.totalSupply();
      setTotalSupply(ethers.formatEther(supply));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRemoving(false);
    }
  }

  if (!wallet.isConnected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500">Please connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-5 space-y-3 fade-in">
      <h2 className="text-lg font-bold text-pink-600 mb-1">Remove Liquidity</h2>
      
      {error && (
        <div className="bg-red-100/80 backdrop-blur-sm border border-red-300 text-red-700 px-3 py-2 rounded-2xl text-xs">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* LP Shares Input */}
        <div className="glass rounded-2xl p-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">LP Shares</span>
            <span className="text-xs text-pink-600 font-medium">Your: {myLpShares}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={lpShares}
                onChange={(e) => setLpShares(e.target.value)}
                placeholder="0.0"
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
                disabled={isRemoving}
              />
            </div>
            <button
              onClick={() => setLpShares(myLpShares)}
              className="px-3 py-1.5 glass rounded-xl text-pink-600 hover:bg-pink-50/50 text-xs font-semibold active:scale-95"
            >
              Max
            </button>
          </div>
        </div>

        {/* Preview of what you'll receive */}
        {lpShares && amount0Out !== "0" && (
          <div className="glass rounded-2xl p-3 border-2 border-pink-200/50">
            <p className="text-xs text-pink-700 mb-1.5 font-semibold">You will receive:</p>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-pink-600">{parseFloat(amount0Out).toFixed(4)} Token0</p>
              <p className="text-xs font-bold text-pink-600">{parseFloat(amount1Out).toFixed(4)} Token1</p>
            </div>
          </div>
        )}

        {reserves && (
          <div className="glass rounded-2xl p-2 text-xs text-center text-pink-600/80">
            Pool: {ethers.formatEther(reserves[0])} T0 / {ethers.formatEther(reserves[1])} T1
          </div>
        )}

        <button
          onClick={handleRemoveLiquidity}
          disabled={!lpShares || isRemoving}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-2xl hover:from-pink-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/30 font-semibold text-base active:scale-95 flex items-center justify-center gap-2"
        >
          {isRemoving ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Removing...</span>
            </>
          ) : (
            "Remove Liquidity"
          )}
        </button>
      </div>
    </div>
  );
}