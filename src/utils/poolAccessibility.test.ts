import { describe, expect, it } from "vitest";
import type { Pool } from "@/lib/types";
import { poolActionLabel } from "@/utils/poolAccessibility";

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
