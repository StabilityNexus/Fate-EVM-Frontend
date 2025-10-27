// Factory addresses for deployed Fate Protocol contracts
// Update these with actual deployed contract addresses when available
export const FatePoolFactories = {
  1: "0x0000000000000000000000000000000000000000", // Ethereum Mainnet - TODO: Deploy contract
  137: "0x0000000000000000000000000000000000000000", // Polygon - TODO: Deploy contract
  56: "0x0000000000000000000000000000000000000000", // BSC - TODO: Deploy contract
  8453: "0x0000000000000000000000000000000000000000", // Base - TODO: Deploy contract
  11155111: "0x5fae23ab9c0b36f30bb4c6ab1d7b9c8cdbef8d18", // Sepolia Testnet - Deployed
  61: "0x6eb2eec7bcc4096e35d7bc467e411a505c7db202", // Ethereum Classic - Deployed
} as {
  [key: number]: `0x${string}`;
};

export const ChainlinkAdapterFactories = {
  1: "0x0000000000000000000000000000000000000000", // Ethereum Mainnet - TODO: Deploy contract
  137: "0x0000000000000000000000000000000000000000", // Polygon - TODO: Deploy contract
  56: "0x0000000000000000000000000000000000000000", // BSC - TODO: Deploy contract
  8453: "0x0000000000000000000000000000000000000000", // Base - TODO: Deploy contract
  11155111: "0x2cbd9e1ec213f5ef2c8f0703514254ff7288723e", // Sepolia Testnet - Deployed
} as {
  [key: number]: `0x${string}`;
};

export const HebeswapAdapterFactories = {
  61: "0x017cdc5ed9ba47a6a5c4414e8c66e7d7e967a83a", // Ethereum Classic 
} as {
  [key: number]: `0x${string}`;
};