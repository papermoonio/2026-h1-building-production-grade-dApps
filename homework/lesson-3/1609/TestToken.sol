// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * TestToken - Simple ERC20 for testing
 * Can be minted by anyone for testing purposes
 */
contract TestToken is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    /**
     * Mint tokens for testing
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /**
     * Burn tokens
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
