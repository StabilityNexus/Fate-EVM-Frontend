// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract MockPool {
    uint256 public bullReserve;
    uint256 public bearReserve;
    uint256 public bullSupply;
    uint256 public bearSupply;
    uint256 public bullVolume;
    uint256 public bearVolume;

    function setState( uint256 _bullReserve, uint256 _bearReserve, uint256 _bullSupply, uint256 _bearSupply, uint256 _bullVolume, uint256 _bearVolume) external {
        bullReserve = _bullReserve;
        bearReserve = _bearReserve;
        bullSupply = _bullSupply;
        bearSupply = _bearSupply;
        bullVolume = _bullVolume;
        bearVolume = _bearVolume;
    }

    function getState() external view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return (bullReserve, bearReserve, bullSupply, bearSupply, bullVolume, bearVolume);
    }
}