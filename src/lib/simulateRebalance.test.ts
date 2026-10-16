import { describe, expect, it } from "vitest";
import { simulateRebalance } from "@/lib/estimateBuy";
import { REBALANCE_VECTORS } from "@/lib/wadVectors.test-data";

const E18 = BigInt(10) ** BigInt(18);

describe("simulateRebalance", () => {
  it("matches the reserves a real pool ends up with, on every vector", () => {
    for (const [leverage, oldPrice, newPrice, bull, bear, wantBull, wantBear] of REBALANCE_VECTORS) {
      const got = simulateRebalance(BigInt(bull), BigInt(bear), BigInt(oldPrice), BigInt(newPrice), BigInt(leverage));
      const label = `leverage ${leverage}, ${oldPrice} -> ${newPrice}, reserves ${bull}/${bear}`;
      expect(got.bull, label).toBe(BigInt(wantBull));
      expect(got.bear, label).toBe(BigInt(wantBear));
    }
  });

  it("keeps the reserves when both sides round to zero", () => {
    // 1 unit each side, a 1e6x move at 10x: the bear side rounds to nothing, the bull side to 1.
    const got = simulateRebalance(BigInt(1), BigInt(1), E18, E18 * BigInt(1_000_000), BigInt(10) * E18);
    expect(got.bull + got.bear).toBe(BigInt(2));
    expect(got.bear).toBe(BigInt(1));
  });

  it("leaves a zero-priced or unchanged move alone", () => {
    expect(simulateRebalance(E18, E18, BigInt(0), E18, E18)).toEqual({ bull: E18, bear: E18 });
    expect(simulateRebalance(E18, E18, E18, E18, BigInt(2) * E18)).toEqual({ bull: E18, bear: E18 });
  });
});
