export const HebeswapOracleABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_pair",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_baseToken",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_quoteToken",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "pair",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IHebeswapPair"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "baseToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quoteToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "token0IsBase",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "baseDecimals",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quoteDecimals",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLatestPrice",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCurrentReserves",
    "inputs": [],
    "outputs": [
      {
        "name": "baseReserve",
        "type": "uint112",
        "internalType": "uint112"
      },
      {
        "name": "quoteReserve",
        "type": "uint112",
        "internalType": "uint112"
      },
      {
        "name": "blockTimestampLast",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "error",
    "name": "InvalidPair",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidTokens",
    "inputs": []
  }
];
