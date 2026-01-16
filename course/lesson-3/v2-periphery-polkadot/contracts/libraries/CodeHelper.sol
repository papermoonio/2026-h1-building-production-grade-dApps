pragma solidity ^0.8.0;

import "@uniswap/v2-core/contracts/UniswapV2Pair.sol";

contract CodeHelper {
    function pairCodeHash() public view returns (bytes32) {
        return bytes32(type(UniswapV2Pair).creationCode);
    }
}