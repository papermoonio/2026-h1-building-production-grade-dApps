//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface MiniSwap {
    function addLiquidity(address tokenA, address tokenB, uint amount) external;

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint amount
    ) external;

    function swap(address tokenIn, address tokenOut, uint amount) external;
}
