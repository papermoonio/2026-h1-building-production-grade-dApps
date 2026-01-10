"use client";

import { useWallet } from "../hooks/useWallet";
import { Spinner } from "./Spinner";

export function WalletButton() {
  const { wallet, connect, disconnect, isLoading, error } = useWallet();

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-400/50 text-white rounded-2xl cursor-not-allowed text-sm font-medium flex items-center gap-2"
      >
        <Spinner size="sm" color="white" />
        <span>Loading...</span>
      </button>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-xs max-w-[200px]">
        {error}
        {error.includes("OKX") && (
          <div className="mt-1 text-[10px] opacity-80">
            Tip: Disable OKX extension or select MetaMask in browser popup
          </div>
        )}
      </div>
    );
  }

  if (wallet.isConnected && wallet.account) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl shadow-lg shadow-pink-500/30 text-xs font-semibold">
          {wallet.account.slice(0, 4)}...{wallet.account.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-3 py-1.5 glass rounded-2xl text-pink-600 hover:bg-pink-50/50 transition text-xs font-semibold active:scale-95"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg shadow-pink-500/30 text-sm font-semibold active:scale-95"
    >
      Connect
    </button>
  );
}