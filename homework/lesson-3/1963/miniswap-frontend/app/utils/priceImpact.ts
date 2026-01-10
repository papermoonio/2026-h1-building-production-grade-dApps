/**
 * Calculate price impact of a swap
 * @param amountIn - Input amount
 * @param amountOut - Output amount
 * @param reserveIn - Reserve of input token
 * @param reserveOut - Reserve of output token
 * @returns Price impact percentage (0-100)
 */
export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n) return 0;

  // Current price: reserveOut / reserveIn
  const currentPrice = Number(reserveOut) / Number(reserveIn);

  // New price after swap: (reserveOut - amountOut) / (reserveIn + amountIn)
  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = reserveOut - amountOut;
  const newPrice = Number(newReserveOut) / Number(newReserveIn);

  // Price impact = ((newPrice - currentPrice) / currentPrice) * 100
  const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;

  return Math.abs(priceImpact);
}

/**
 * Get price impact color based on severity
 */
export function getPriceImpactColor(impact: number): string {
  if (impact < 1) return "text-green-600";
  if (impact < 3) return "text-yellow-600";
  if (impact < 5) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get price impact warning message
 */
export function getPriceImpactWarning(impact: number): string | null {
  if (impact < 1) return null;
  if (impact < 3) return "Low price impact";
  if (impact < 5) return "Medium price impact";
  return "High price impact - Consider splitting into smaller swaps";
}