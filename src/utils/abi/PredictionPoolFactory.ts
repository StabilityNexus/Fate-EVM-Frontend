export const PredictionPoolFactoryABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_dev",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_devFeeReceiver",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_devFee",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
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
        "name": "initialDeposit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "leverage",
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
    "name": "createPoolWithAdapter",
    "inputs": [
      {
        "name": "adapterFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "adapterParams",
        "type": "bytes",
        "internalType": "bytes"
      },
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
        "name": "initialDeposit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "leverage",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "oracle",
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
    "name": "InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidFeeConfiguration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "function",
    "name": "MAX_DEV_FEE",
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
    "name": "acceptDev",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "dev",
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
    "name": "devFee",
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
    "name": "devFeeReceiver",
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
    "name": "pendingDev",
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
    "name": "proposeDev",
    "inputs": [
      {
        "name": "newDev",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDevFee",
    "inputs": [
      {
        "name": "newFee",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDevFeeReceiver",
    "inputs": [
      {
        "name": "newReceiver",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "DevFeeReceiverUpdated",
    "inputs": [
      {
        "name": "oldReceiver",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newReceiver",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DevFeeUpdated",
    "inputs": [
      {
        "name": "oldFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DevProposed",
    "inputs": [
      {
        "name": "currentDev",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "proposedDev",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DevTransferred",
    "inputs": [
      {
        "name": "oldDev",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newDev",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OnlyDev",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyPendingDev",
    "inputs": []
  }
]
