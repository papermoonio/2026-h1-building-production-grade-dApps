// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC20.sol";

contract MiniSwap {
    address public token0;
    address public token1;
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalSupply;
    mapping(address => uint256) public balance;
    
    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }
    
    function addLiquidity(uint256 _amount0, uint256 _amount1) external returns (uint256 shares) {
    ERC20(token0).transferFrom(msg.sender, address(this), _amount0);
    ERC20(token1).transferFrom(msg.sender, address(this), _amount1);
    
    if (totalSupply == 0) {
        shares = _sqrt(_amount0 * _amount1);
    } else {
        shares = _min(
            (_amount0 * totalSupply) / reserve0,
            (_amount1 * totalSupply) / reserve1
        );
    }
    
    require(shares > 0, "Insufficient liquidity");
    balance[msg.sender] += shares;
    totalSupply += shares;
    reserve0 += _amount0;
    reserve1 += _amount1;
}
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
        z = y;
        uint256 x = y / 2 + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    } else if (y != 0) {
        z = 1;
    }
}

function _min(uint256 x, uint256 y) internal pure returns (uint256) {
    return x < y ? x : y;
}
    
    function removeLiquidity(uint256 _shares) external returns (uint256 amount0, uint256 amount1) {
    require(balance[msg.sender] >= _shares, "Insufficient shares");
    
    amount0 = (_shares * reserve0) / totalSupply;
    amount1 = (_shares * reserve1) / totalSupply;
    
    require(amount0 > 0 && amount1 > 0, "Insufficient liquidity");
    
    balance[msg.sender] -= _shares;
    totalSupply -= _shares;
    reserve0 -= amount0;
    reserve1 -= amount1;
    
    ERC20(token0).transfer(msg.sender, amount0);
    ERC20(token1).transfer(msg.sender, amount1);
}
    
    function swap(address _tokenIn, uint256 _amountIn) external returns (uint256 amountOut) {
    require(_tokenIn == token0 || _tokenIn == token1, "Invalid token");
    require(_amountIn > 0, "Amount must be greater than 0");
    
    bool isToken0 = _tokenIn == token0;
    (uint256 _reserve0, uint256 _reserve1) = isToken0 
        ? (reserve0, reserve1) 
        : (reserve1, reserve0);
    
    ERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
    
    uint256 _amountInWithFee = _amountIn * 997; // 0.3% fee
    amountOut = (_amountInWithFee * _reserve1) / ((_reserve0 * 1000) + _amountInWithFee);
    
    require(amountOut > 0, "Insufficient output");
    require(amountOut < _reserve1, "Insufficient liquidity"); // Ensure we don't exceed reserve
    
    if (isToken0) {
        reserve0 += _amountIn;
        reserve1 -= amountOut;
        ERC20(token1).transfer(msg.sender, amountOut);
    } else {
        reserve1 += _amountIn;
        reserve0 -= amountOut;
        ERC20(token0).transfer(msg.sender, amountOut);
    }
}
    
    function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1) {
        return (reserve0, reserve1);
    }
}