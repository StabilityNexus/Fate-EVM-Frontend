export const ChainlinkAdapterFactoryABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_poolFactory",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "poolFactory",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract PredictionPoolFactory"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "priceFeedToAdapter",
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
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createAdapter",
    "inputs": [
      {
        "name": "priceFeed",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "adapter",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAdapter",
    "inputs": [
      {
        "name": "priceFeed",
        "type": "address",
        "internalType": "address"
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
    "name": "AdapterCreated",
    "inputs": [
      {
        "name": "priceFeed",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "adapter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  }
];

