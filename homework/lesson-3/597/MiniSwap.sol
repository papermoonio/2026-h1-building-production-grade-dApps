// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title MiniSwap
 */
contract MiniSwap {
    // 交易对池子
    struct Pool {
        address token0; 
        address token1; 
        uint256 reserve0; 
        uint256 reserve1; 
        uint256 totalSupply; 
    }

    // 所有池子
    mapping(bytes32 => Pool) public pools;

    // 池子中的 LP 份额: poolKey => user => balance
    mapping(bytes32 => mapping(address => uint256)) public liquidityBalance;

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    event LiquidityAdded(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amount,
        uint256 liquidity
    );

    event LiquidityRemoved(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 liquidity,
        uint256 amountA,
        uint256 amountB
    );

    event Swapped(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // 获取交易对的唯一 Key (对两个地址排序后哈希)
    function _getPoolKey(
        address tokenA,
        address tokenB
    ) internal pure returns (bytes32) {
        require(tokenA != address(0) && tokenB != address(0), "ZERO_ADDRESS");
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }

    // 获取池子引用 (只读)
    function _getPoolStorage(
        address tokenA,
        address tokenB
    ) internal view returns (Pool storage) {
        bytes32 key = _getPoolKey(tokenA, tokenB);
        return pools[key];
    }

    // 初始化池子 
    function _initializePool(address tokenA, address tokenB) internal {
        bytes32 key = _getPoolKey(tokenA, tokenB);
        Pool storage pool = pools[key];

        if (pool.token0 == address(0) && pool.token1 == address(0)) {
            (pool.token0, pool.token1) = tokenA < tokenB
                ? (tokenA, tokenB)
                : (tokenB, tokenA);
        }
    }

    /**
     * @notice 添加流动性 (1:1)
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @param amount 添加的数量 (表示同时添加 amount 的 A 和 amount 的 B)
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amount
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        _initializePool(tokenA, tokenB);

        bytes32 key = _getPoolKey(tokenA, tokenB);
        Pool storage pool = pools[key];

        // 保存旧的储备量用于计算
        uint256 oldReserve0 = pool.reserve0;

        // 计算并铸造 LP Token (在状态更新之前)
        uint liquidity;
        if (pool.totalSupply == 0) {
            liquidity = amount;
        } else {
            // 按比例计算：份额 = (存入量 / 原储备量) * 总份额
            // 因为是 1:1 添加，用哪个 reserve 计算都一样
            require(oldReserve0 > 0, "Invalid reserve state");
            liquidity = (amount * pool.totalSupply) / oldReserve0;
        }

        require(liquidity > 0, "Liquidity too low");

        pool.totalSupply += liquidity;
        liquidityBalance[key][msg.sender] += liquidity;
        pool.reserve0 += amount;
        pool.reserve1 += amount;

        IERC20(tokenA).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amount);

        emit LiquidityAdded(msg.sender, tokenA, tokenB, amount, liquidity);
    }

    /**
     * @notice 移除流动性
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @param amount 要移除的 LP Token 数量
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint amount
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        bytes32 key = _getPoolKey(tokenA, tokenB);
        Pool storage pool = pools[key];

        // 检查池子是否存在
        require(pool.token0 != address(0), "Pool does not exist");
        require(pool.totalSupply > 0, "Pool is empty");

        // 检查用户份额
        uint userBalance = liquidityBalance[key][msg.sender];
        require(userBalance >= amount, "Insufficient LP balance");

        // 计算可赎回的 Token 数量 (按比例)
        uint amount0Out = (amount * pool.reserve0) / pool.totalSupply;
        uint amount1Out = (amount * pool.reserve1) / pool.totalSupply;

        require(
            amount0Out > 0 && amount1Out > 0,
            "Insufficient liquidity in pool"
        );

        liquidityBalance[key][msg.sender] -= amount;
        pool.totalSupply -= amount;
        pool.reserve0 -= amount0Out;
        pool.reserve1 -= amount1Out;

        // 需要根据 tokenA 实际是 token0 还是 token1 来决定转出哪个
        if (tokenA == pool.token0) {
            IERC20(pool.token0).transfer(msg.sender, amount0Out);
            IERC20(pool.token1).transfer(msg.sender, amount1Out);
            emit LiquidityRemoved(
                msg.sender,
                tokenA,
                tokenB,
                amount,
                amount0Out,
                amount1Out
            );
        } else {
            IERC20(pool.token1).transfer(msg.sender, amount0Out);
            IERC20(pool.token0).transfer(msg.sender, amount1Out);
            emit LiquidityRemoved(
                msg.sender,
                tokenA,
                tokenB,
                amount,
                amount1Out,
                amount0Out
            );
        }
    }

    /**
     * @notice 兑换 (1:1 无滑点)
     * @param tokenIn 卖出的 Token
     * @param tokenOut 买入的 Token
     * @param amount 卖出的数量
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint amount
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        bytes32 key = _getPoolKey(tokenIn, tokenOut);
        Pool storage pool = pools[key];

        require(pool.token0 != address(0), "Pool does not exist");

        uint amountOut = amount; // 1:1 兑换

        if (tokenIn == pool.token0 && tokenOut == pool.token1) {
            // 用 Token0 换 Token1
            require(
                pool.reserve1 >= amountOut,
                "Insufficient liquidity in output token"
            );

            pool.reserve0 += amount;
            pool.reserve1 -= amountOut;
        } else if (tokenIn == pool.token1 && tokenOut == pool.token0) {
            // 用 Token1 换 Token0
            require(
                pool.reserve0 >= amountOut,
                "Insufficient liquidity in output token"
            );

            pool.reserve1 += amount;
            pool.reserve0 -= amountOut;
        } else {
            revert("Invalid pair for swap");
        }

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        emit Swapped(msg.sender, tokenIn, tokenOut, amount, amountOut);
    }

    /**
     * @notice 查询用户的 LP 余额
     */
    function getUserLiquidity(
        address tokenA,
        address tokenB,
        address user
    ) external view returns (uint) {
        bytes32 key = _getPoolKey(tokenA, tokenB);
        return liquidityBalance[key][user];
    }

    /**
     * @notice 查询池子储备量
     */
    function getReserves(
        address tokenA,
        address tokenB
    ) external view returns (uint reserveA, uint reserveB) {
        Pool storage pool = _getPoolStorage(tokenA, tokenB);

        // 如果池子不存在，返回 (0, 0)
        if (pool.token0 == address(0)) {
            return (0, 0);
        }

        // 需要判断输入参数的顺序与池子内部 token0/token1 的顺序，以便正确返回
        if (tokenA == pool.token0 && tokenB == pool.token1) {
            return (pool.reserve0, pool.reserve1);
        } else if (tokenA == pool.token1 && tokenB == pool.token0) {
            return (pool.reserve1, pool.reserve0);
        }
        return (0, 0);
    }

    /**
     * @notice 查询池子的 LP 总供应量
     */
    function getPoolTotalSupply(
        address tokenA,
        address tokenB
    ) external view returns (uint) {
        bytes32 key = _getPoolKey(tokenA, tokenB);
        return pools[key].totalSupply;
    }
}
