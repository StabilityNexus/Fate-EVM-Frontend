export const IAdapterFactoryABI = [
  {
    "type": "function",
    "name": "createAdapter",
    "inputs": [
      {
        "name": "params",
        "type": "bytes",
        "internalType": "bytes"
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
  }
] as const;

