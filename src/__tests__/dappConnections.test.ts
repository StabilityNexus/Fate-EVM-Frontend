import { describe, expect, it, beforeEach, vi } from "vitest";

import { SUPPORTED_CHAINS } from "@/lib/chains";
import { getChainConfig } from "@/utils/chainConfig";
import { validateChainId } from "@/lib/validation";

describe("dApp connection wiring", () => {
  it("has stable supported chain IDs", () => {
    const ids = SUPPORTED_CHAINS.map((c) => c.id).sort((a, b) => a - b);
    expect(ids).toEqual([61, 11155111]);
  });

  it("getChainConfig returns chain + display name", () => {
    const sepoliaConfig = getChainConfig(11155111);
    expect(sepoliaConfig).not.toBeNull();
    expect(sepoliaConfig?.chain.id).toBe(11155111);
    expect(sepoliaConfig?.name).toBe("Sepolia");

    const etcConfig = getChainConfig(61);
    expect(etcConfig).not.toBeNull();
    expect(etcConfig?.chain.id).toBe(61);
    expect(etcConfig?.name).toBe("Ethereum Classic");

    expect(getChainConfig(999999)).toBeNull();
  });

  it("validateChainId accepts supported ids and rejects unsupported", () => {
    expect(validateChainId(61)).toBe(61);
    expect(validateChainId("0x3d")).toBe(61);
    expect(validateChainId(11155111)).toBe(11155111);
    expect(() => validateChainId(999999)).toThrow(/Unsupported chain ID/i);
  });
});

describe("ethers provider contract initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_RPC_URL;
    delete process.env.NEXT_PUBLIC_PREDICTION_POOL_ADDRESS;
  });

  it("throws a friendly error when env vars are missing", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { getPredictionPoolContract } =
      await import("@/utils/ethersProvider");
    expect(() => getPredictionPoolContract()).toThrow(
      /Unable to initialize prediction pool contract/,
    );
    consoleErrorSpy.mockRestore();
  });

  it("creates a contract instance when env vars are present", async () => {
    process.env.NEXT_PUBLIC_RPC_URL = "http://localhost:8545";
    process.env.NEXT_PUBLIC_PREDICTION_POOL_ADDRESS =
      "0x0000000000000000000000000000000000000001";

    const { getPredictionPoolContract } =
      await import("@/utils/ethersProvider");
    const contract = getPredictionPoolContract();

    // ethers v6 contracts expose `target` (preferred), and some code may still use `address`
    const target = (
      contract as unknown as { target?: string; address?: string }
    ).target;
    const address = (
      contract as unknown as { target?: string; address?: string }
    ).address;

    expect(target ?? address).toBe(
      "0x0000000000000000000000000000000000000001",
    );
  });
});
