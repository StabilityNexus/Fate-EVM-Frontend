// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IFateOracle.sol";

interface IPool {
    function getState() external view returns (uint256 bullReserve, uint256 bearReserve, uint256 bullSupply, uint256 bearSupply, uint256 bullVolume, uint256 bearVolume);
}

contract FateOracle is IFateOracle {
    // =========================
    // STATE VARIABLES
    // =========================

    address public pool;

    struct RoundData {
        uint80 roundId;
        int256 price;
        uint256 timestamp;
    }

    mapping(uint80 => RoundData) public rounds;
    uint80 public latestRoundId;

    uint256 public constant STALE_TIME = 1 hours;

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor(address _pool) {
        require(_pool != address(0), "Invalid pool");
        pool = _pool;
    }

    // =========================
    // CORE LOGIC
    // =========================

    function computePrice() public view returns (int256) {
        (uint256 bullReserve, uint256 bearReserve, uint256 bullSupply, uint256 bearSupply, uint256 bullVolume, uint256 bearVolume) = IPool(pool).getState();

        require(bullSupply > 0 && bearSupply > 0, "Invalid supply");
        require(bullReserve > 0 && bearReserve > 0, "No liquidity");

        uint256 bullPrice = bullReserve / bullSupply;
        uint256 bearPrice = bearReserve / bearSupply;

        uint256 totalVolume = bullVolume + bearVolume;

        uint256 bullWeight = totalVolume == 0 ? 50 : (bullVolume * 100) / totalVolume;

        uint256 bearWeight = 100 - bullWeight;

        uint256 weightedPrice = (bullPrice * bullWeight + bearPrice * bearWeight) / 100;

        return int256(weightedPrice);
    }

    // =========================
    // UPDATE PRICE
    // =========================

    function updatePrice() external {
        int256 price = computePrice();

        latestRoundId++;

        rounds[latestRoundId] = RoundData({
            roundId: latestRoundId,
            price: price,
            timestamp: block.timestamp
        });
    }

    // =========================
    // VIEW FUNCTIONS
    // =========================

    function getLatestPrice() external view override returns (int256) {
        require(latestRoundId > 0, "No data");

        return rounds[latestRoundId].price;
    }

    function getLatestRoundData() external view override returns (uint80, int256, uint256, uint256, uint80) {
        require(latestRoundId > 0, "No data");

        RoundData memory r = rounds[latestRoundId];

        require(block.timestamp - r.timestamp <= STALE_TIME, "Stale price");

        return (r.roundId, r.price, r.timestamp, r.timestamp, r.roundId);
    }
}