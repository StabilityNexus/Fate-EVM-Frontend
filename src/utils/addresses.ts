import { Address } from "viem";

// Factory addresses for deployed Fate Protocol contracts
// Update these with actual deployed contract addresses when available
export const FatePoolFactories: Record<number, Address> = {
  11155111: "0x5882604e18a295bbc904316e0ca872463b48f9ed", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
};

export const ChainlinkAdapterFactories: Record<number, Address> = {
  11155111: "0xe6afb97bab25bb9623246cc18ce624a9821cc2bd", // Sepolia Testnet - Deployed 2026-10-14 (tag sepolia-2026-10-14)
};

// The chain's wrapped native token (WETH9 or a copy). Only pools on it get the native toggle.
export const WrappedNatives: Record<number, Address> = {
  11155111: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Sepolia Testnet WETH9
};

// Filled after the deploy. No entry, no toggle.
export const NativeHelpers: Record<number, Address> = {};

// Gas the Max button keeps back for one buy and one later sell through the helper.
export const NATIVE_BUY_GAS = BigInt(300_000);
export const NATIVE_SELL_GAS = BigInt(300_000);

// No pool can exist before its factory, so scans start here instead of guessing. Chains
// without an entry fall back to a block window.
export const FactoryDeploymentBlocks: Record<number, bigint> = {
  11155111: BigInt(11_912_904),
};