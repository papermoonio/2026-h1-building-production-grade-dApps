"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { Spinner } from "./Spinner";

export function PoolInfo() {
  const { wallet } = useWallet();
  const contracts = useContracts();
  const [reserves, setReserves] = useState<[bigint, bigint] | null>(null);
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [myShares, setMyShares] = useState<string>("0");
  const [token0Name, setToken0Name] = useState<string>("Token0");
  const [token1Name, setToken1Name] = useState<string>("Token1");

  useEffect(() => {
    if (!contracts) return;

    async function loadPoolInfo() {
      try {
        const [reserve0, reserve1] = await contracts.miniswap.getReserves();
        setReserves([reserve0, reserve1]);

        const supply = await contracts.miniswap.totalSupply();
        setTotalSupply(ethers.formatEther(supply));

        if (wallet.account) {
          const shares = await contracts.miniswap.balance(wallet.account);
          setMyShares(ethers.formatEther(shares));
        }

        const name0 = await contracts.token0.name();
        const name1 = await contracts.token1.name();
        setToken0Name(name0);
        setToken1Name(name1);
      } catch (err: any) {
        // Handle CALL_EXCEPTION errors gracefully - contracts may not be deployed
        if (err.code === "CALL_EXCEPTION" || err.code === "UNPREDICTABLE_GAS_LIMIT") {
          console.warn("Contract call failed - contracts may not be deployed:", err.message);
          // Keep reserves as null so UI shows loading state
          return;
        }
        console.error("Error loading pool info:", err);
      }
    }

    loadPoolInfo();
    const interval = setInterval(loadPoolInfo, 5000);
    return () => clearInterval(interval);
  }, [contracts, wallet.account]);

  if (!reserves) {
    return (
      <div className="glass rounded-3xl p-4 text-center flex items-center justify-center gap-2">
        <Spinner size="sm" color="pink" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  const reserve0Formatted = ethers.formatEther(reserves[0]);
  const reserve1Formatted = ethers.formatEther(reserves[1]);
  const price = reserves[1] > 0n 
    ? Number(reserves[1]) / Number(reserves[0])
    : 0;

  return (
    <div className="glass-strong rounded-3xl p-5 space-y-1.5 fade-in">
      <h3 className="text-xs font-semibold text-pink-600 mb-2">Pool Stats</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between items-center py-1 border-b border-pink-100/50">
          <span className="text-[10px] text-gray-600">{token0Name}:</span>
          <span className="text-[10px] font-semibold text-pink-600">{parseFloat(reserve0Formatted).toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-pink-100/50">
          <span className="text-[10px] text-gray-600">{token1Name}:</span>
          <span className="text-[10px] font-semibold text-pink-600">{parseFloat(reserve1Formatted).toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-pink-100/50">
          <span className="text-[10px] text-gray-600">Price:</span>
          <span className="text-[10px] font-semibold text-pink-600">{price.toFixed(4)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1">
          <span className="text-[10px] text-gray-600">LP Supply:</span>
          <span className="text-[10px] font-semibold text-pink-600">{parseFloat(totalSupply).toFixed(2)}</span>
        </div>
        
        {wallet.account && parseFloat(myShares) > 0 && (
          <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-pink-200/50">
            <span className="text-[10px] font-semibold text-gray-700">Your Shares:</span>
            <span className="text-[10px] font-bold text-pink-600">{parseFloat(myShares).toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  );
}