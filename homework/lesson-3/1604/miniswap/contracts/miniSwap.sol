//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MiniSwap {
    using SafeERC20 for IERC20;

    // Mapping to store liquidity pools for each token pair
    mapping(bytes32 => uint) public liquidityPools;
    
    // Mapping to store user's liquidity shares
    mapping(bytes32 => mapping(address => uint)) public userLiquidity;
    
    // Total liquidity shares for each pool
    mapping(bytes32 => uint) public totalLiquidityShares;

    event LiquidityAdded(address indexed tokenA, address indexed tokenB, address indexed user, uint amountA, uint amountB);
    event LiquidityRemoved(address indexed tokenA, address indexed tokenB, address indexed user, uint amountA, uint amountB, uint sharesRemoved);
    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, address indexed user, uint amountIn, uint amountOut);

    function getTokenPairKey(address tokenA, address tokenB) internal pure returns (bytes32) {
        // Ensure consistent ordering of token addresses to create unique pool identifier
        if (tokenA < tokenB) {
            return keccak256(abi.encodePacked(tokenA, tokenB));
        } else {
            return keccak256(abi.encodePacked(tokenB, tokenA));
        }
    }

    function addLiquidity(address tokenA, address tokenB, uint amount) external {
        require(tokenA != tokenB, "Tokens must be different");
        require(amount > 0, "Amount must be greater than 0");
        
        bytes32 poolKey = getTokenPairKey(tokenA, tokenB);
        
        // Transfer tokens from user to contract
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate liquidity shares to mint
        uint sharesToMint;
        if (totalLiquidityShares[poolKey] == 0) {
            // First liquidity provider gets initial shares
            sharesToMint = amount;
        } else {
            // Calculate shares based on existing pool size
            uint existingPoolAmount = liquidityPools[poolKey];
            sharesToMint = (amount * totalLiquidityShares[poolKey]) / existingPoolAmount;
        }
        
        // Update state
        liquidityPools[poolKey] += amount;
        userLiquidity[poolKey][msg.sender] += sharesToMint;
        totalLiquidityShares[poolKey] += sharesToMint;
        
        emit LiquidityAdded(tokenA, tokenB, msg.sender, amount, amount);
    }

    function removeLiquidity(address tokenA, address tokenB, uint sharesToRemove) external {
        require(tokenA != tokenB, "Tokens must be different");
        require(sharesToRemove > 0, "Shares amount must be greater than 0");
        
        bytes32 poolKey = getTokenPairKey(tokenA, tokenB);
        
        uint userShares = userLiquidity[poolKey][msg.sender];
        require(userShares >= sharesToRemove, "Insufficient liquidity shares");
        
        // Calculate actual token amounts to return
        uint totalShares = totalLiquidityShares[poolKey];
        uint poolAmount = liquidityPools[poolKey];
        
        uint amountA = (sharesToRemove * poolAmount) / totalShares;
        uint amountB = amountA; // 1:1 ratio
        
        // Update state
        liquidityPools[poolKey] -= amountA;
        userLiquidity[poolKey][msg.sender] -= sharesToRemove;
        totalLiquidityShares[poolKey] -= sharesToRemove;
        
        // Transfer tokens back to user
        IERC20(tokenA).safeTransfer(msg.sender, amountA);
        IERC20(tokenB).safeTransfer(msg.sender, amountB);
        
        emit LiquidityRemoved(tokenA, tokenB, msg.sender, amountA, amountB, sharesToRemove);
    }

    function swap(address tokenIn, address tokenOut, uint amount) external {
        require(tokenIn != tokenOut, "Tokens must be different");
        require(amount > 0, "Amount must be greater than 0");
        
        bytes32 poolKey = getTokenPairKey(tokenIn, tokenOut);
        uint poolAmount = liquidityPools[poolKey];
        require(poolAmount > 0, "Pool does not exist or has no liquidity");
        
        // Since all pairs trade at 1:1 ratio, output amount equals input amount
        uint outputAmount = amount; 
        
        // Transfer input token from user to contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer output token from contract to user
        IERC20(tokenOut).safeTransfer(msg.sender, outputAmount);
        
        emit SwapExecuted(tokenIn, tokenOut, msg.sender, amount, outputAmount);
    }
}