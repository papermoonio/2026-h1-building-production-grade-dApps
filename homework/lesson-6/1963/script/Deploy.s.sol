// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/ERC1963.sol";

contract Deploy is Script {
    function run() external returns (ERC1963) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        ERC1963 erc1963 = new ERC1963();
        vm.stopBroadcast();

        console.log("ERC1963 deployed to:", address(erc1963));
        console.log("Deployment block (use as startBlock in subgraph):", block.number);
        return erc1963;
    }
}