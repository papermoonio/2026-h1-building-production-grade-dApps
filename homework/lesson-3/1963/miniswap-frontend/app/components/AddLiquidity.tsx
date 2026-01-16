"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { SecurityNotice } from "./SecurityNotice";
import { CONTRACT_ADDRESSES } from "../config";
import { Spinner } from "./Spinner";

export function AddLiquidity() {
  const { wallet } = useWallet();
  const contracts = useContracts();
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token0Balance, setToken0Balance] = useState<string>("0");
  const [token1Balance, setToken1Balance] = useState<string>("0");
  const [reserves, setReserves] = useState<[bigint, bigint] | null>(null);

  useEffect(() => {
    if (!contracts || !wallet.account) return;

    async function loadBalances() {
      try {
        if (!contracts || !wallet.account) return;
        const balance0 = await contracts.token0.balanceOf(wallet.account);
        const balance1 = await contracts.token1.balanceOf(wallet.account);
        setToken0Balance(ethers.formatEther(balance0));
        setToken1Balance(ethers.formatEther(balance1));

        const [reserve0, reserve1] = await contracts.miniswap.getReserves();
        setReserves([reserve0, reserve1]);
        setError(null); // Clear errors on success
      } catch (err: any) {
        // Handle CALL_EXCEPTION errors gracefully
        if (err.code === "CALL_EXCEPTION" || err.code === "UNPREDICTABLE_GAS_LIMIT") {
          console.warn("Contract call failed - contracts may not be deployed:", err.message);
          return;
        }
        console.error("Error loading balances:", err);
        if (!err.message?.includes("missing revert data")) {
          setError(err.message);
        }
      }
    }

    loadBalances();
  }, [contracts, wallet.account]);

  async function handleAddLiquidity() {
    if (!contracts || !wallet.account || !wallet.provider || !amount0 || !amount1) {
      setError("Please enter amounts");
      return;
    }

    try {
      setError(null);
      setIsAdding(true);

      // Always refresh signer to ensure it matches the current account
      const freshSigner = await wallet.provider.getSigner();
      const signerAddress = await freshSigner.getAddress();
      
      if (signerAddress?.toLowerCase() !== wallet.account?.toLowerCase()) {
        throw new Error(`Address mismatch! Connected: ${wallet.account}, Signer: ${signerAddress}. Please disconnect and reconnect your wallet.`);
      }
      
      // Update contracts to use fresh signer (cast to proper types)
      const token0WithFreshSigner = contracts.token0.connect(freshSigner) as typeof contracts.token0;
      const token1WithFreshSigner = contracts.token1.connect(freshSigner) as typeof contracts.token1;
      const miniswapWithFreshSigner = contracts.miniswap.connect(freshSigner) as typeof contracts.miniswap;

      // Validate and parse amounts
      const amount0Num = parseFloat(amount0);
      const amount1Num = parseFloat(amount1);
      
      if (isNaN(amount0Num) || amount0Num <= 0) {
        throw new Error("Invalid amount for Token0");
      }
      
      if (isNaN(amount1Num) || amount1Num <= 0) {
        throw new Error("Invalid amount for Token1");
      }
      
      const amount0Wei = ethers.parseEther(amount0);
      const amount1Wei = ethers.parseEther(amount1);
      
      console.log("💰 Amounts to add:");
      console.log("  Token0:", amount0, "=", amount0Wei.toString(), "wei");
      console.log("  Token1:", amount1, "=", amount1Wei.toString(), "wei");

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
        console.log("🔒 SECURITY: Verified MiniSwap contract address:", expectedMiniSwapAddress);
      }

      // Check and approve token0 using fresh signer
      const allowance0 = await token0WithFreshSigner.allowance(
        wallet.account,
        contracts.miniswap.target
      );
      if (allowance0 < amount0Wei) {
        try {
          console.log("✅ Approving Token0 - Only approving exact amount needed for security");
          // Try with minimal gas first (1 gwei), fallback if node rejects it
          let approve0Tx;
          try {
            approve0Tx = await token0WithFreshSigner.approve(
              contracts.miniswap.target,
              amount0Wei,
              {
                gasPrice: ethers.parseUnits("1", "gwei"), // 1 gwei = minimal fee
                gasLimit: 50000,
              }
            );
          } catch (gasError: any) {
            // If explicit gas fails, try without gas settings (node will handle it)
            console.log("  ⚠️  Node rejected explicit gas, using automatic gas...");
            approve0Tx = await token0WithFreshSigner.approve(
              contracts.miniswap.target,
              amount0Wei
            );
          }
          await approve0Tx.wait();
          console.log("  ✅ Token0 approval confirmed");
        } catch (err: any) {
          console.error("Approve token0 error:", err);
          throw new Error(`Failed to approve Token0: ${err.message}`);
        }
      } else {
        console.log("  ✅ Token0 has sufficient allowance");
      }

      // Check and approve token1 using fresh signer
      const allowance1 = await token1WithFreshSigner.allowance(
        wallet.account,
        contracts.miniswap.target
      );
      if (allowance1 < amount1Wei) {
        try {
          console.log("✅ Approving Token1 - Only approving exact amount needed for security");
          // Try with minimal gas first (1 gwei), fallback if node rejects it
          let approve1Tx;
          try {
            approve1Tx = await token1WithFreshSigner.approve(
              contracts.miniswap.target,
              amount1Wei,
              {
                gasPrice: ethers.parseUnits("1", "gwei"), // 1 gwei = minimal fee
                gasLimit: 50000,
              }
            );
          } catch (gasError: any) {
            // If explicit gas fails, try without gas settings (node will handle it)
            console.log("  ⚠️  Node rejected explicit gas, using automatic gas...");
            approve1Tx = await token1WithFreshSigner.approve(
              contracts.miniswap.target,
              amount1Wei
            );
          }
          await approve1Tx.wait();
          console.log("  ✅ Token1 approval confirmed");
        } catch (err: any) {
          console.error("Approve token1 error:", err);
          throw new Error(`Failed to approve Token1: ${err.message}`);
        }
      } else {
        console.log("  ✅ Token1 has sufficient allowance");
      }

      // Add liquidity using fresh signer
      console.log("🔄 Adding liquidity...");
      // Let MetaMask and the node handle gas automatically - no explicit gas settings
      // This prevents "value out-of-bounds" errors from gas estimation
      const tx = await miniswapWithFreshSigner.addLiquidity(amount0Wei, amount1Wei);
      console.log("  Transaction hash:", tx.hash);
      await tx.wait();
      console.log("  ✅ Liquidity added successfully");

      // Clear inputs
      setAmount0("");
      setAmount1("");
      
      // Refresh balances
      const balance0 = await contracts.token0.balanceOf(wallet.account);
      const balance1 = await contracts.token1.balanceOf(wallet.account);
      setToken0Balance(ethers.formatEther(balance0));
      setToken1Balance(ethers.formatEther(balance1));

      const [reserve0, reserve1] = await contracts.miniswap.getReserves();
      setReserves([reserve0, reserve1]);
    } catch (err: any) {
      console.error("❌ Add Liquidity error:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        error: err.error,
        reason: err.reason
      });
      
      // Better error messages
      let errorMessage = err.message || "Transaction failed";
      
      if (err.message?.includes("Internal JSON-RPC error") || err.code === -32603) {
        errorMessage = "Node RPC Error: Your local Substrate node may have an issue. Please check that your local node is running.";
      } else if (err.message?.includes("insufficient funds") || err.message?.includes("insufficient balance")) {
        errorMessage = "Insufficient ETH for gas fees. Please run: npx hardhat run scripts/fund-account.js --network localhost";
      } else if (err.message?.includes("user rejected") || err.code === 4001) {
        errorMessage = "Transaction was rejected in MetaMask. Please try again.";
      } else if (err.message?.includes("revert") || err.message?.includes("execution reverted")) {
        errorMessage = `Transaction reverted: ${err.reason || err.message}. Check console for details.`;
      }
      
      setError(errorMessage);
    } finally {
      setIsAdding(false);
    }
  }

  if (!wallet.isConnected) {
    return (
      <div className="glass rounded-3xl p-6 text-center">
        <p className="text-gray-500">Please connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-5 space-y-3 fade-in">
      <h2 className="text-lg font-bold text-pink-600 mb-1">Add Liquidity</h2>
      
      {error && (
        <div className="bg-red-100/80 backdrop-blur-sm border border-red-300 text-red-700 px-3 py-2 rounded-2xl text-xs">
          {error}
        </div>
      )}

      {/* Security Notice - Show when user enters amounts */}
      {amount0 && amount1 && parseFloat(amount0) > 0 && parseFloat(amount1) > 0 && (
        <SecurityNotice />
      )}

      <div className="space-y-3">
        {/* Token0 Input */}
        <div className="glass rounded-2xl p-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">Token0</span>
            <span className="text-xs text-pink-600 font-medium">Balance: {token0Balance}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                placeholder="0.0"
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
                disabled={isAdding}
              />
            </div>
            <div className="bg-pink-100/50 px-3 py-1.5 rounded-xl font-semibold text-pink-600 text-sm">
              T0
            </div>
          </div>
        </div>

        {/* Token1 Input */}
        <div className="glass rounded-2xl p-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">Token1</span>
            <span className="text-xs text-pink-600 font-medium">Balance: {token1Balance}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                placeholder="0.0"
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
                disabled={isAdding}
              />
            </div>
            <div className="bg-pink-100/50 px-3 py-1.5 rounded-xl font-semibold text-pink-600 text-sm">
              T1
            </div>
          </div>
        </div>

        {reserves && (
          <div className="glass rounded-2xl p-2 text-xs text-center text-pink-600/80">
            Pool: {ethers.formatEther(reserves[0])} T0 / {ethers.formatEther(reserves[1])} T1
          </div>
        )}

        <button
          onClick={handleAddLiquidity}
          disabled={!amount0 || !amount1 || isAdding || !wallet.isConnected}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-2xl hover:from-pink-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/30 font-semibold text-base active:scale-95 flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Adding...</span>
            </>
          ) : (
            "Add Liquidity"
          )}
        </button>
      </div>
    </div>
  );
}