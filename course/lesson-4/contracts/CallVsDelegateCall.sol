// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CallVsDelegateCall
 * @dev Demonstrates the difference between call and delegatecall
 */

contract Storage {
    uint256 public value;
    address public owner;

    function setValue(uint256 _value) public {
        value = _value;
    }

    function setOwner(address _owner) public {
        owner = _owner;
    }
}

contract CallDemo {
    uint256 public value;
    address public owner;

    /**
     * @dev Using call - executes code in the target contract's context
     * Storage is modified in the target contract, not this contract
     */
    function callSetValue(
        address target,
        uint256 _value
    ) public returns (bool) {
        (bool success, ) = target.call(
            abi.encodeWithSignature("setValue(uint256)", _value)
        );
        return success;
    }

    /**
     * @dev Using delegatecall - executes code in this contract's context
     * Storage is modified in this contract, using target contract's logic
     */
    function delegatecallSetValue(
        address target,
        uint256 _value
    ) public returns (bool) {
        (bool success, ) = target.delegatecall(
            abi.encodeWithSignature("setValue(uint256)", _value)
        );
        return success;
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}

contract Library {
    /**
     * @dev Library function that modifies storage
     * When called via delegatecall, it modifies the caller's storage
     */
    function setValue(uint256 _value) public {
        // This will modify storage slot 0 of the calling contract
        assembly {
            sstore(0, _value)
        }
    }

    function setOwner(address _owner) public {
        // This will modify storage slot 1 of the calling contract
        assembly {
            sstore(1, _owner)
        }
    }
}

contract Proxy {
    address public implementation;
    uint256 public value;
    address public owner;

    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }

    /**
     * @dev Fallback function that delegates all calls to implementation
     * This is a simple proxy pattern using delegatecall
     */
    fallback() external {
        address impl = implementation;
        assembly {
            // Copy calldata to memory
            calldatacopy(0, 0, calldatasize())

            // Delegatecall to implementation
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)

            // Copy return data
            returndatacopy(0, 0, returndatasize())

            // Revert or return
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Receive function for receiving ETH
     */
    receive() external payable {}
}
