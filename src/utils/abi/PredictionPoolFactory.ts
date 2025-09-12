export const PredictionPoolFactoryABI = [
  {
    "type": "function",
    "name": "createPool",
    "inputs": [
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "baseToken",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "oracle",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "bullName",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bullSymbol",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bearName",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bearSymbol",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "mintFee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "burnFee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "creatorFee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "treasuryFee",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAllPools",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPoolCount",
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
    "name": "isValidOracle",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
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
    "name": "registerOracle",
    "inputs": [
      {
        "name": "oracle",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "poolsByCreator",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "allPools",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "type": "event",
    "name": "PoolCreated",
    "inputs": [
      {
        "name": "pool",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "bullCoin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "bearCoin",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "creator",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "oracle",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InvalidFeeConfiguration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAddress",
    "inputs": []
  }
];

