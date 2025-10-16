export const FatePoolFactories = {
  1: "0x0000000000000000000000000000000000000000", // Ethereum Mainnet - Update with actual address
  137: "0x0000000000000000000000000000000000000000", // Polygon - Update with actual address
  56: "0x0000000000000000000000000000000000000000", // BSC - Update with actual address
  8453: "0x0000000000000000000000000000000000000000", // Base - Update with actual address
  11155111: "0x5fae23ab9c0b36f30bb4c6ab1d7b9c8cdbef8d18", // Sepolia Testnet - Updated with initialDeposit support
  61: "0x0000000000000000000000000000000000000000", // Ethereum Classic - Update with actual address
} as {
  [key: number]: `0x${string}`;
};

export const ChainlinkAdapterFactories = {
  1: "0x0000000000000000000000000000000000000000", // Ethereum Mainnet - Update with actual address
  137: "0x0000000000000000000000000000000000000000", // Polygon - Update with actual address
  56: "0x0000000000000000000000000000000000000000", // BSC - Update with actual address
  8453: "0x0000000000000000000000000000000000000000", // Base - Update with actual address
  11155111: "0x2cbd9e1ec213f5ef2c8f0703514254ff7288723e", // Sepolia Testnet - Updated with initialDeposit support
} as {
  [key: number]: `0x${string}`;
};

export const HebeswapAdapterFactories = {
  61: "0x0000000000000000000000000000000000000000", // Ethereum Classic - Update with actual address
} as {
  [key: number]: `0x${string}`;
};