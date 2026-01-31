// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ERC1963 – contract name for this project
/// @notice Simple state + events for Subgraph indexing
contract ERC1963 {
    uint256 public value;
    address public lastSetter;

    event ValueUpdated(address indexed user, uint256 newValue);

    function setValue(uint256 _value) external {
        value = _value;
        lastSetter = msg.sender;
        emit ValueUpdated(msg.sender, _value);
    }

    function getValue() external view returns (uint256) {
        return value;
    }
}
