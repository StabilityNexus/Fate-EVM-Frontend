export const PredictionPoolFactoryABI=[
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
        "name": "vaultFee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "vaultCreatorFee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "treasuryFee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "oracle",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "priceFeedId",
        "type": "bytes32",
        "internalType": "bytes32"
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
      }
    ],
    "anonymous": false
  }
]
