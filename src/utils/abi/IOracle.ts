export const IOracleABI = [
  {
    "type": "function",
    "name": "getLatestPrice",
    "inputs": [],
    "outputs": [
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLatestRoundData",
    "inputs": [],
    "outputs": [
      { "name": "roundId", "type": "uint80", "internalType": "uint80" },
      { "name": "answer", "type": "int256", "internalType": "int256" },
      { "name": "startedAt", "type": "uint256", "internalType": "uint256" },
      { "name": "updatedAt", "type": "uint256", "internalType": "uint256" },
      { "name": "answeredInRound", "type": "uint80", "internalType": "uint80" }
    ],
    "stateMutability": "view"
  }
];
