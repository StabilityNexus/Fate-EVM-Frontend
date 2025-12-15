import { Address } from "viem";

// Factory addresses for deployed Fate Protocol contracts
// Update these with actual deployed contract addresses when available
export const FatePoolFactories: Record<number, Address> = {
  11155111: "0x5fae23ab9c0b36f30bb4c6ab1d7b9c8cdbef8d18", // Sepolia Testnet - Deployed
  61: "0x6eb2eec7bcc4096e35d7bc467e411a505c7db202", // Ethereum Classic - Deployed
};

export const ChainlinkAdapterFactories: Record<number, Address> = {
  11155111: "0x2cbd9e1ec213f5ef2c8f0703514254ff7288723e", // Sepolia Testnet - Deployed
};

export const HebeswapAdapterFactories: Record<number, Address> = {
  61: "0x017cdc5ed9ba47a6a5c4414e8c66e7d7e967a83a", // Ethereum Classic 
};