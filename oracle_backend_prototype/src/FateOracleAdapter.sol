// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IFateOracle.sol";

contract FateOracleAdapter {
    // =========================
    // STATE VARIABLES
    // =========================

    IFateOracle public oracle;

    uint8 public constant decimals = 8;
    string public constant description = "Fate Oracle Adapter";

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor(address _oracle) {
        require(_oracle != address(0), "Invalid oracle");
        oracle = IFateOracle(_oracle);
    }

    // =========================
    // CHAINLINK FUNCTION
    // =========================

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return oracle.getLatestRoundData();
    }
}