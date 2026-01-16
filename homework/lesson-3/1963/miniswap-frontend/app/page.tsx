"use client";

import { WalletButton } from "./components/WalletButton";
import { Swap } from "./components/Swap";
import { AddLiquidity } from "./components/AddLiquidity";
import { RemoveLiquidity } from "./components/RemoveLiquidity";
import { PoolInfo } from "./components/PoolInfo";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"swap" | "liquidity">("swap");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 relative">
      {/* Floating clouds */}
      <div className="cloud-1"></div>
      <div className="cloud-2"></div>
      <div className="cloud-3"></div>
      
      <div className="iphone-frame">
        <div className="iphone-screen">
          {/* Status Bar Area - Rounded notch */}
          <div className="h-8 flex items-center justify-center pt-1 relative flex-shrink-0">
            <div className="w-28 h-1 bg-gray-900 rounded-full"></div>
          </div>

          {/* Header - moved down 16px */}
          <header className="glass-strong px-5 py-3 mt-4 flex justify-between items-center border-b border-pink-200/30 flex-shrink-0">
            <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
              MiniSwap
            </h1>
            <WalletButton />
          </header>

          {/* Main Content - 20px padding, 24px spacing between components */}
          <main className="flex-1 px-5 py-5 space-y-6 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0, maxHeight: '100%' }}>
            {/* Tabs - Uniswap Style */}
            <div className="glass rounded-3xl p-1.5 flex gap-2 flex-shrink-0">
              <button
                onClick={() => setActiveTab("swap")}
                className={`flex-1 py-2 px-3 rounded-2xl font-semibold transition-all text-xs ${
                  activeTab === "swap"
                    ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 scale-105"
                    : "text-pink-600 hover:bg-pink-50/50"
                }`}
              >
                Swap
              </button>
              <button
                onClick={() => setActiveTab("liquidity")}
                className={`flex-1 py-2 px-3 rounded-2xl font-semibold transition-all text-xs ${
                  activeTab === "liquidity"
                    ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 scale-105"
                    : "text-pink-600 hover:bg-pink-50/50"
                }`}
              >
                Liquidity
              </button>
            </div>

            {/* Pool Info - Compact Card */}
            <div className="flex-shrink-0">
              <PoolInfo />
            </div>

            {/* Swap Tab */}
            {activeTab === "swap" && (
              <div className="flex-shrink-0 pb-1">
                <Swap />
              </div>
            )}

            {/* Liquidity Tab */}
            {activeTab === "liquidity" && (
              <div className="space-y-6 flex-shrink-0 pb-1">
                <AddLiquidity />
                <RemoveLiquidity />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}