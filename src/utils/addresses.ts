import { Address } from "viem";

// Factory addresses for deployed Fate Protocol contracts
// Update these with actual deployed contract addresses when available
export const FatePoolFactories: Record<number, Address> = {
  11155111: "0x6935432472c180238703805f9809639439b783b6", // Sepolia Testnet - Deployed 2026-10-21 (tag sepolia-2026-10-21)
};

export const ChainlinkAdapterFactories: Record<number, Address> = {
  11155111: "0xe6afb97bab25bb9623246cc18ce624a9821cc2bd", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
};

// The chain's wrapped native token (WETH9 or a copy). Only pools on it get the native toggle.
export const WrappedNatives: Record<number, Address> = {
  11155111: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Sepolia Testnet WETH9
};

// No entry, no toggle.
export const NativeHelpers: Record<number, Address> = {
  11155111: "0x9198c4332845aba314f164be73a00619abb46606", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
};

// Gas the Max button keeps back for one buy and one later sell through the helper. Each measured
// 0.5M to 0.7M on Sepolia after Glamsterdam (2026-10-16).
export const NATIVE_BUY_GAS = BigInt(1_000_000);
export const NATIVE_SELL_GAS = BigInt(1_000_000);

// No pool can exist before its factory, so scans start here instead of guessing. Chains
// without an entry fall back to a block window.
export const FactoryDeploymentBlocks: Record<number, bigint> = {
  11155111: BigInt(11_962_715),
};