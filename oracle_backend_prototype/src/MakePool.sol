// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract MockPool {
    // =========================
    // STATE VARIABLES
    // =========================

    address public owner;
    uint256 public bullReserve; // total funds in bull vault
    uint256 public bearReserve; // total funds in bear vault
    uint256 public bullSupply; // total supply of bull tokens
    uint256 public bearSupply; // total supply of bear tokens
    uint256 public bullVolume; // total volume of bull trades
    uint256 public bearVolume; // total volume of bear trades
    uint256 public lastUpdated; // timestamp of last update

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor() {
        owner = msg.sender;
   }

    // =========================
    // MODIFIERS
    // =========================

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // =========================
    // EVENTS
    // =========================

    event StateUpdated(uint256 bullReserve, uint256 bearReserve, uint256 bullSupply, uint256 bearSupply, uint256 bullVolume, uint256 bearVolume, uint256 timestamp);

    event TradeExecuted(bool isBull, uint256 amount, uint256 newReserve, uint256 newSupply, uint256 totalVolume);

    // =========================
    // CORE FUNCTIONS
    // =========================

    function setState(uint256 _bullReserve, uint256 _bearReserve, uint256 _bullSupply, uint256 _bearSupply, uint256 _bullVolume, uint256 _bearVolume) external onlyOwner {
        require(_bullSupply > 0 && _bearSupply > 0, "Invalid supply");

        bullReserve = _bullReserve;
        bearReserve = _bearReserve;
        bullSupply = _bullSupply;
        bearSupply = _bearSupply;
        bullVolume = _bullVolume;
        bearVolume = _bearVolume;
        lastUpdated = block.timestamp;

        emit StateUpdated(_bullReserve, _bearReserve, _bullSupply, _bearSupply, _bullVolume, _bearVolume, block.timestamp);
    }

    // =========================
    // SIMULATED TRADING
    // =========================

    function buyBull(uint256 amount) external {
        require(amount > 0, "Invalid amount");

        bullReserve += amount;
        bullSupply += amount;
        bullVolume += amount;
        lastUpdated = block.timestamp;

        emit TradeExecuted(true, amount, bullReserve, bullSupply, bullVolume);
    }

    function buyBear(uint256 amount) external {
        require(amount > 0, "Invalid amount");

        bearReserve += amount;
        bearSupply += amount;
        bearVolume += amount;
        lastUpdated = block.timestamp;

        emit TradeExecuted(false, amount, bearReserve, bearSupply, bearVolume);
    }

    // =========================
    // VIEW FUNCTIONS
    // =========================

    function getState() external view returns (uint256 _bullReserve, uint256 _bearReserve, uint256 _bullSupply, uint256 _bearSupply, uint256 _bullVolume, uint256 _bearVolume)
    {
        return (bullReserve, bearReserve, bullSupply, bearSupply, bullVolume, bearVolume);
    }

    function getBullPrice() public view returns (uint256) {
        require(bullSupply > 0, "No supply");
        return bullReserve / bullSupply;
    }

    function getBearPrice() public view returns (uint256) {
        require(bearSupply > 0, "No supply");
        return bearReserve / bearSupply;
    }
}