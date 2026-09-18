import { Address } from "viem";

// Factory addresses for deployed Fate Protocol contracts
// Update these with actual deployed contract addresses when available
export const FatePoolFactories: Record<number, Address> = {
  11155111: "0xc0becbba8ee6ba4efcedae6958ddcdba7d2540fb", // Sepolia Testnet - Deployed 2026-09-16 (tag sepolia-2026-09-16)
  61: "0x6eb2eec7bcc4096e35d7bc467e411a505c7db202", // Ethereum Classic - Deployed
};

export const ChainlinkAdapterFactories: Record<number, Address> = {
  11155111: "0xe1e12da062e778c44d4518de88f9ad95273de0b8", // Sepolia Testnet - Deployed 2026-09-16 (tag sepolia-2026-09-16)
};

export const HebeswapAdapterFactories: Record<number, Address> = {
  61: "0x017cdc5ed9ba47a6a5c4414e8c66e7d7e967a83a", // Ethereum Classic
};

// No pool can exist before its factory, so scans start here instead of guessing. ETC is
// missing because its RPCs cannot read old state; those chains fall back to a block window.
export const FactoryDeploymentBlocks: Record<number, bigint> = {
  11155111: BigInt(11_715_454),
};