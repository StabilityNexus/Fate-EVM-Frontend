// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IFateOracle {
    /// @notice Returns latest price only
    function getLatestPrice() external view returns (int256);

    /// @notice Returns Chainlink-style round data
    function getLatestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}