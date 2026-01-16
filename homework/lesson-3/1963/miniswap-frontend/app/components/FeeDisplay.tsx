"use client";

interface FeeDisplayProps {
  amountIn: string;
  showFee?: boolean;
}

export function FeeDisplay({ amountIn, showFee = true }: FeeDisplayProps) {
  if (!amountIn || parseFloat(amountIn) === 0 || !showFee) {
    return null;
  }

  const amount = parseFloat(amountIn);
  const feeAmount = amount * 0.003; // 0.3% fee
  const amountAfterFee = amount - feeAmount;

  return (
    <div className="text-xs text-gray-500 space-y-0.5">
      <div className="flex justify-between">
        <span>Fee (0.3%):</span>
        <span className="text-pink-600">{feeAmount.toFixed(6)}</span>
      </div>
      <div className="flex justify-between text-gray-400">
        <span>After fee:</span>
        <span>{amountAfterFee.toFixed(6)}</span>
      </div>
    </div>
  );
}