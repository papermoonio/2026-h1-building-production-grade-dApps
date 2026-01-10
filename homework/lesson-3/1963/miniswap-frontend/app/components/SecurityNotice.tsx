"use client";

import { CONTRACT_ADDRESSES } from "../config";

export function SecurityNotice() {
  return (
    <div className="glass rounded-2xl p-3 border-2 border-pink-200/50 bg-pink-50/30">
      <div className="flex items-start gap-2">
        <span className="text-pink-600 text-lg">🔒</span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-pink-700 mb-1">About the Approval Message</p>
          <p className="text-[10px] text-pink-600 leading-relaxed">
            MetaMask shows "You're giving someone else permission to spend this amount" - this is <strong>normal and expected</strong> for ERC20 token approvals. We cannot change this message as it's part of MetaMask's interface.
          </p>
          <p className="text-[10px] text-pink-600 leading-relaxed mt-1">
            <strong>✅ Safe because:</strong> We only approve the exact amount needed (not unlimited), and the approval goes to your verified MiniSwap contract at {CONTRACT_ADDRESSES.MINISWAP.slice(0, 6)}...{CONTRACT_ADDRESSES.MINISWAP.slice(-4)}.
          </p>
          <p className="text-[10px] text-pink-600/80 mt-1">
            This is how all DEXs (Uniswap, SushiSwap, etc.) work - it's the standard ERC20 approval flow.
          </p>
        </div>
      </div>
    </div>
  );
}
