"use client";

import { useMemo } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "../config";
import { useWallet } from "./useWallet";


const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const MINISWAP_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint256, uint256)",
  "function totalSupply() view returns (uint256)",
  "function balance(address) view returns (uint256)",
  "function addLiquidity(uint256, uint256) returns (uint256)",
  "function removeLiquidity(uint256) returns (uint256, uint256)",
  "function swap(address tokenIn, uint256 amountIn) returns (uint256)",
];

export function useContracts() {
  const { wallet } = useWallet();

  const contracts = useMemo(() => {
    if (!wallet.provider || !wallet.signer) {
      return null;
    }

    try {
      const token0 = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN0,
        ERC20_ABI,
        wallet.signer
      );

      const token1 = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN1,
        ERC20_ABI,
        wallet.signer
      );

      const miniswap = new ethers.Contract(
        CONTRACT_ADDRESSES.MINISWAP,
        MINISWAP_ABI,
        wallet.signer
      );

      return { token0, token1, miniswap };
    } catch (error) {
      console.error("Error creating contracts:", error);
      return null;
    }
  }, [wallet.provider, wallet.signer]);

  return contracts;
}