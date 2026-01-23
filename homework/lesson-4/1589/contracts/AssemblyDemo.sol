// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AssemblyDemo
 * @dev Demonstrates various uses of inline assembly in Solidity
 */
contract AssemblyDemo {
    uint256 public value;
    uint256[] public numbers;

    /**
     * @dev Set value using assembly (more gas efficient)
     */
    function setValue(uint256 _value) public {
        assembly {
            // Store _value at storage slot 0 (value)
            sstore(0, _value)
        }
    }

    /**
     * @dev Get value using assembly
     */
    function getValue() public view returns (uint256) {
        uint256 result;
        assembly {
            // Load value from storage slot 0
            result := sload(0)
        }
        return result;
    }

    /**
     * @dev Add two numbers using assembly
     */
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 result;
        assembly {
            result := add(a, b)
        }
        return result;
    }

    /**
     * @dev Multiply two numbers using assembly
     */
    function multiply(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 result;
        assembly {
            result := mul(a, b)
        }
        return result;
    }

    /**
     * @dev Get the size of a dynamic array using assembly
     */
    function getArrayLength() public view returns (uint256) {
        uint256 length;
        assembly {
            // Load array length from storage slot 1 (numbers)
            length := sload(1)
        }
        return length;
    }

    /**
     * @dev Push to array using assembly
     */
    function pushNumber(uint256 _number) public {
        uint256 length;
        assembly {
            // Get current length
            length := sload(1)
            // Calculate storage slot for new element
            let slot := add(keccak256(0x20, 0x20), length)
            // Store the number
            sstore(slot, _number)
            // Increment length
            sstore(1, add(length, 1))
        }
    }

    /**
     * @dev Get array element using assembly
     */
    function getNumber(uint256 index) public view returns (uint256) {
        uint256 result;
        assembly {
            // Calculate storage slot
            let slot := add(keccak256(0x20, 0x20), index)
            result := sload(slot)
        }
        return result;
    }

    /**
     * @dev Get contract balance using assembly
     */
    function getBalance() public view returns (uint256) {
        uint256 thisBalance;
        assembly {
            thisBalance := selfbalance()
        }
        return thisBalance;
    }

    /**
     * @dev Get caller address using assembly
     */
    function getCaller() public view returns (address) {
        address thisCaller;
        assembly {
            thisCaller := caller()
        }
        return thisCaller;
    }

    /**
     * @dev Get block number using assembly
     */
    function getBlockNumber() public view returns (uint256) {
        uint256 blockNum;
        assembly {
            blockNum := number()
        }
        return blockNum;
    }

    /**
     * @dev Low-level call using assembly
     */
    function lowLevelCall(
        address target,
        bytes memory data
    ) public returns (bool success, bytes memory returnData) {
        assembly {
            // Call the target contract
            success := call(
                gas(), // Forward all gas
                target, // Target address
                0, // Value (wei)
                add(data, 0x20), // Data pointer (skip length)
                mload(data), // Data length
                0, // Return data offset
                0 // Return data size (we'll get it later)
            )

            // Get return data size
            let returnSize := returndatasize()

            // Allocate memory for return data
            returnData := mload(0x40)
            mstore(returnData, returnSize)
            let returnDataPtr := add(returnData, 0x20)

            // Copy return data
            returndatacopy(returnDataPtr, 0, returnSize)

            // Update free memory pointer
            mstore(0x40, add(returnDataPtr, returnSize))
        }
    }
}
