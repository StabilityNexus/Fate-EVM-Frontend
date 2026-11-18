import { describe, expect, it, vi } from "vitest";
import type { Pool } from "@/lib/types";
import { handlePoolActivation, poolActionLabel } from "@/utils/poolAccessibility";

const pool = {
  name: "ETH/USD",
  bullToken: { symbol: "BULL" },
  bearToken: { symbol: "BEAR" },
} as Pool;

describe("poolActionLabel", () => {
  it("identifies the pool and its token pair", () => {
    expect(poolActionLabel(pool)).toBe("Open pool ETH/USD (BULL/BEAR)");
  });

  it("falls back to the token pair when the pool has no name", () => {
    expect(poolActionLabel({ ...pool, name: "" })).toBe("Open pool BULL/BEAR");
  });
});

describe("handlePoolActivation", () => {
  it("stops row propagation and opens the selected pool once", () => {
    const stopPropagation = vi.fn();
    const onUsePool = vi.fn();

    handlePoolActivation({ stopPropagation }, onUsePool, "pool-1");

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onUsePool).toHaveBeenCalledTimes(1);
    expect(onUsePool).toHaveBeenCalledWith("pool-1");
  });
});
