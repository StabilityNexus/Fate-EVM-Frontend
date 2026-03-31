// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/mocks/MockPool.sol";
import "../src/FateOracle.sol";

contract FateOracleTest is Test {
    MockPool pool;
    FateOracle oracle;

    function setUp() public {
        pool = new MockPool();
        oracle = new FateOracle(address(pool));
    }

    // =========================
    // BASIC TESTS
    // =========================

    function testBasicPrice() public {
        pool.setState(1000, 1000, 100, 100, 500, 500);

        oracle.updatePrice();

        int256 price = oracle.getLatestPrice();

        assertEq(price, 10);
    }

    function testBullishSentiment() public {
        pool.setState(2000, 1000, 100, 100, 900, 100);

        oracle.updatePrice();

        int256 price = oracle.getLatestPrice();

        assertGt(price, 10);
    }

    function testBearishSentiment() public {
        pool.setState(1000, 2000, 100, 100, 100, 900);

        oracle.updatePrice();

        int256 price = oracle.getLatestPrice();

        assertLt(price, 20);
    }

    function testRevertZeroSupply() public {
        pool.setState(1000, 1000, 0, 100, 500, 500);

        vm.expectRevert();

        oracle.updatePrice();
    }

    function testRevertNoLiquidity() public {
        pool.setState(0, 1000, 100, 100, 500, 500);

        vm.expectRevert();

        oracle.updatePrice();
    }

    function testRoundIncrement() public {
        pool.setState(1000, 1000, 100, 100, 500, 500);

        oracle.updatePrice();
        oracle.updatePrice();

        assertEq(oracle.latestRoundId(), 2);
    }

    function testStalePriceReverts() public {
        pool.setState(1000, 1000, 100, 100, 500, 500);

        oracle.updatePrice();

        vm.warp(block.timestamp + 2 hours);

        vm.expectRevert("Stale price");

        oracle.getLatestRoundData();
    }

    // =========================
    // FUZZ TEST
    // =========================

    function testFuzzPrice(uint256 bullReserve, uint256 bearReserve, uint256 bullSupply, uint256 bearSupply) public {
        bullSupply = bound(bullSupply, 1, 1e18);
        bearSupply = bound(bearSupply, 1, 1e18);

        bullReserve = bound(bullReserve, 1, 1e18);
        bearReserve = bound(bearReserve, 1, 1e18);

        pool.setState(bullReserve, bearReserve, bullSupply, bearSupply, 500, 500);
        oracle.updatePrice();

        int256 price = oracle.getLatestPrice();

        assertGe(price, 0);
    }
}