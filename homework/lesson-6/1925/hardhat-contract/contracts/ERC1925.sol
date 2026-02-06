// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ERC1925 {
  string public constant VERSION = "MY_UNIQUE_ERC1925_V1"; 

  uint public x;
  event Increment(uint by);

  function inc() public {
    x++;
    emit Increment(1);
  }

  function incBy(uint by) public {
    require(by > 0, "incBy: increment should be positive");
    x += by;
    emit Increment(by);
  }
}