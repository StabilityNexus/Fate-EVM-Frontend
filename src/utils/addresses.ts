import { Address } from "viem";

// Factory addresses for deployed Fate Protocol contracts
// Update these with actual deployed contract addresses when available
export const FatePoolFactories: Record<number, Address> = {
  11155111: "0x6935432472c180238703805f9809639439b783b6", // Sepolia Testnet - Deployed 2026-10-21 (tag sepolia-2026-10-21)
  137: "0xeB944f4b7151E1bA2473e85CbeAE944246f17B9e", // Polygon Mainnet - Deployed 2026-10-30 (tag polygon-2026-10-30)
};

export const ChainlinkAdapterFactories: Record<number, Address> = {
  11155111: "0xe6afb97bab25bb9623246cc18ce624a9821cc2bd", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
  137: "0x7CA56fe0f49448641BcE5E6c5777076C7C6E5f8a", // Polygon Mainnet - Deployed 2026-10-30 (tag polygon-2026-10-30)
};

// The chain's wrapped native token (WETH9 or a copy). Only pools on it get the native toggle.
export const WrappedNatives: Record<number, Address> = {
  11155111: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Sepolia Testnet WETH9
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // Polygon Mainnet WPOL
};

// No entry, no toggle.
export const NativeHelpers: Record<number, Address> = {
  11155111: "0x9198c4332845aba314f164be73a00619abb46606", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
  137: "0xa22e1CD0E115368A2E3fEb2b1ea2c08bdf8a38CD", // Polygon Mainnet - Deployed 2026-10-30 (tag polygon-2026-10-30)
};

// Gas the Max button keeps back for one buy and one later sell through the helper. Each measured
// 0.5M to 0.7M on Sepolia after Glamsterdam (2026-10-16).
export const NATIVE_BUY_GAS = BigInt(1_000_000);
export const NATIVE_SELL_GAS = BigInt(1_000_000);

// No pool can exist before its factory, so scans start here instead of guessing. Chains
// without an entry fall back to a block window.
export const FactoryDeploymentBlocks: Record<number, bigint> = {
  11155111: BigInt(11_962_715),
  137: BigInt(96_443_373),
};