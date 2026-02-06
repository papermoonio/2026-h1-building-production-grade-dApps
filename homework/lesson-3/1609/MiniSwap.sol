// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * MiniSwap - Simplified AMM Implementation
 * 
 * Features:
 * - Add/Remove liquidity with 1:1 token ratio
 * - Swap between token pairs
 * - LP token rewards (simplified - not implemented in basic version)
 * - No trading fees in basic version
 */
contract MiniSwap {
    // Liquidity pool storage
    struct Pool {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalLiquidity;
    }

    // Pool mapping: keccak256(token0, token1) => Pool
    mapping(bytes32 => Pool) public pools;
    // LP token mapping: keccak256(token0, token1) => (user => balance)
    mapping(bytes32 => mapping(address => uint256)) public lpTokens;

    event LiquidityAdded(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event LiquidityRemoved(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event Swapped(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /**
     * Get pool ID for two tokens (always sorted)
     */
    function getPoolId(address tokenA, address tokenB) internal pure returns (bytes32) {
        require(tokenA != tokenB, "Identical address");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }

    /**
     * Add liquidity to a pool
     * Simplified: 1:1 ratio required
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "Amount must be > 0");

        bytes32 poolId = getPoolId(tokenA, tokenB);
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        // Reorder amounts if needed
        (uint256 amount0, uint256 amount1) = tokenA == token0 
            ? (amountA, amountB) 
            : (amountB, amountA);

        Pool storage pool = pools[poolId];

        // Initialize pool if first time
        if (pool.reserve0 == 0 && pool.reserve1 == 0) {
            pool.token0 = token0;
            pool.token1 = token1;
            liquidity = amount0; // Simplification: liquidity = amount of first token
        } else {
            // For existing pools, require proportional amounts
            require(
                amount0 * pool.reserve1 == amount1 * pool.reserve0,
                "Unproportional amounts"
            );
            liquidity = (amount0 * pool.totalLiquidity) / pool.reserve0;
        }

        // Transfer tokens to contract
        require(
            IERC20(token0).transferFrom(msg.sender, address(this), amount0),
            "Transfer token0 failed"
        );
        require(
            IERC20(token1).transferFrom(msg.sender, address(this), amount1),
            "Transfer token1 failed"
        );

        // Update pool state
        pool.reserve0 += amount0;
        pool.reserve1 += amount1;
        pool.totalLiquidity += liquidity;
        lpTokens[poolId][msg.sender] += liquidity;

        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);

        return liquidity;
    }

    /**
     * Remove liquidity from a pool
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity
    ) external returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "Liquidity must be > 0");

        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        
        require(lpTokens[poolId][msg.sender] >= liquidity, "Insufficient LP tokens");
        require(pool.totalLiquidity > 0, "Pool empty");

        // Calculate amounts
        uint256 amount0 = (liquidity * pool.reserve0) / pool.totalLiquidity;
        uint256 amount1 = (liquidity * pool.reserve1) / pool.totalLiquidity;

        // Update pool state
        pool.reserve0 -= amount0;
        pool.reserve1 -= amount1;
        pool.totalLiquidity -= liquidity;
        lpTokens[poolId][msg.sender] -= liquidity;

        // Transfer tokens back
        require(
            IERC20(pool.token0).transfer(msg.sender, amount0),
            "Transfer token0 failed"
        );
        require(
            IERC20(pool.token1).transfer(msg.sender, amount1),
            "Transfer token1 failed"
        );

        // Reorder output if needed
        (amountA, amountB) = tokenA == pool.token0 
            ? (amount0, amount1) 
            : (amount1, amount0);

        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);

        return (amountA, amountB);
    }

    /**
     * Swap tokens
     * Simplified: 1:1 ratio between any token pair
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        require(tokenIn != tokenOut, "Same token");

        bytes32 poolId = getPoolId(tokenIn, tokenOut);
        Pool storage pool = pools[poolId];

        // Simplified swap: 1:1 ratio (in production, use proper AMM formula)
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "Pool not initialized");

        // Determine pool positions
        bool isToken0In = tokenIn == pool.token0;
        
        if (isToken0In) {
            // Swap token0 for token1
            require(pool.reserve1 >= amountIn, "Insufficient liquidity");
            amountOut = amountIn; // 1:1 ratio
            
            // Transfer tokens
            require(
                IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
                "Transfer in failed"
            );
            require(
                IERC20(tokenOut).transfer(msg.sender, amountOut),
                "Transfer out failed"
            );

            pool.reserve0 += amountIn;
            pool.reserve1 -= amountOut;
        } else {
            // Swap token1 for token0
            require(pool.reserve0 >= amountIn, "Insufficient liquidity");
            amountOut = amountIn; // 1:1 ratio
            
            // Transfer tokens
            require(
                IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
                "Transfer in failed"
            );
            require(
                IERC20(tokenOut).transfer(msg.sender, amountOut),
                "Transfer out failed"
            );

            pool.reserve1 += amountIn;
            pool.reserve0 -= amountOut;
        }

        emit Swapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

        return amountOut;
    }

    /**
     * Get pool info
     */
    function getPoolInfo(address tokenA, address tokenB)
        external
        view
        returns (uint256 reserve0, uint256 reserve1, uint256 totalLiquidity)
    {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        return (pool.reserve0, pool.reserve1, pool.totalLiquidity);
    }

    /**
     * Get user's LP token balance
     */
    function getLpTokenBalance(address tokenA, address tokenB, address user)
        external
        view
        returns (uint256)
    {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        return lpTokens[poolId][user];
    }
}
