import { Address } from "viem";

// Factory addresses for deployed Fate Protocol contracts
// Update these with actual deployed contract addresses when available
export const FatePoolFactories: Record<number, Address> = {
  11155111: "0x5882604e18a295bbc904316e0ca872463b48f9ed", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
};

export const ChainlinkAdapterFactories: Record<number, Address> = {
  11155111: "0xe6afb97bab25bb9623246cc18ce624a9821cc2bd", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
};

// No pool can exist before its factory, so scans start here instead of guessing. Chains
// without an entry fall back to a block window.
export const FactoryDeploymentBlocks: Record<number, bigint> = {
  11155111: BigInt(11_912_904),
};