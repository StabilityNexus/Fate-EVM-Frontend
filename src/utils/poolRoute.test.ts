import { describe, expect, it } from "vitest";
import { polygon, sepolia } from "viem/chains";
import { poolHref, resolvePoolChainId } from "@/utils/poolRoute";

const POOL = "0x9a89A1eC7BE0c6A5DeC5FB759420CBB230A456Ef";

describe("poolHref", () => {
  it("names the pool's chain in the link", () => {
    expect(poolHref(POOL, polygon.id)).toBe(`/pool?id=${POOL}&chainId=137`);
  });
});

describe("resolvePoolChainId", () => {
  it("reads a Polygon pool from Polygon with no wallet connected", () => {
    expect(resolvePoolChainId("137", undefined)).toBe(polygon.id);
  });

  it("uses the link's chain, not the chain wagmi is on", () => {
    expect(resolvePoolChainId("137", sepolia.id)).toBe(polygon.id);
    expect(resolvePoolChainId("11155111", polygon.id)).toBe(sepolia.id);
  });

  it("falls back to wagmi's current chain for a link without one", () => {
    expect(resolvePoolChainId(null, polygon.id)).toBe(polygon.id);
  });

  it("falls back to Sepolia when neither names a supported chain", () => {
    expect(resolvePoolChainId(null, undefined)).toBe(sepolia.id);
    expect(resolvePoolChainId(null, 1)).toBe(sepolia.id);
  });

  it("rejects a chain the app does not support or cannot parse", () => {
    for (const param of ["1", "0", "", "abc", "137abc", " 137", "0137", "137.0", "-137", "1e2", "0x89", "Infinity", "11155111000000000001"]) {
      expect(resolvePoolChainId(param, polygon.id), JSON.stringify(param)).toBeNull();
    }
  });
});
