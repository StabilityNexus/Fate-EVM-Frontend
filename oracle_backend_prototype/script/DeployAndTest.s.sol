// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/mocks/MockPool.sol";
import "../src/FateOracle.sol";

contract DeployAndTest is Script {
    function run() external {
        vm.startBroadcast();

        MockPool pool = new MockPool();
        FateOracle oracle = new FateOracle(address(pool));

        pool.setState(
            2000, // bull reserve
            1000, // bear reserve
            100,  // bull supply
            100,  // bear supply
            800,  // bull volume
            200   // bear volume
        );

        oracle.updatePrice();
        int256 price = oracle.getLatestPrice();

        console.log("Oracle Price:", price);

        vm.stopBroadcast();
    }
}