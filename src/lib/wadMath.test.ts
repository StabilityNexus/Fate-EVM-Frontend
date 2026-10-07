import { describe, expect, it } from "vitest";
import { ExpOverflow, LnWadUndefined, expWad, lnWad } from "@/lib/wadMath";
import { EXP_VECTORS, LN_VECTORS } from "@/lib/wadVectors.test-data";

describe("wadMath", () => {
  it("lnWad matches the contract on every vector", () => {
    for (const [x, want] of LN_VECTORS) {
      expect(lnWad(BigInt(x)), `lnWad(${x})`).toBe(BigInt(want));
    }
  });

  it("expWad matches the contract on every vector", () => {
    for (const [x, want] of EXP_VECTORS) {
      expect(expWad(BigInt(x)), `expWad(${x})`).toBe(BigInt(want));
    }
  });

  it("reverts where the contract reverts", () => {
    expect(() => lnWad(BigInt(0))).toThrow(LnWadUndefined);
    expect(() => lnWad(BigInt(-1))).toThrow(LnWadUndefined);
    expect(() => expWad(BigInt("135305999368893231589"))).toThrow(ExpOverflow);
  });
});
