import { describe, expect, it } from "vitest";
import { formatNumberDown, formatVolume } from "@/utils/format";

describe("formatVolume", () => {
  it("keeps up to 3 decimals and trims trailing zeros", () => {
    expect(formatVolume(0.0029647130455839, "WETH")).toBe("0.003 WETH");
    expect(formatVolume(1.25, "WETH")).toBe("1.25 WETH");
    expect(formatVolume(12, "WETH")).toBe("12 WETH");
  });

  it("marks a tiny amount instead of showing 0", () => {
    expect(formatVolume(0.0000003, "WETH")).toBe("< 0.001 WETH");
    expect(formatVolume(0, "WETH")).toBe("0 WETH");
  });

  it("steps to K and M at the rounding boundary", () => {
    expect(formatVolume(2500, "USDC")).toBe("2.5K USDC");
    expect(formatVolume(999.9996, "USDC")).toBe("1K USDC");
    expect(formatVolume(3_210_000, "USDC")).toBe("3.21M USDC");
  });
});

describe("formatNumberDown", () => {
  it("truncates without float error", () => {
    expect(formatNumberDown("0.57", 4)).toBe("0.57");
    expect(formatNumberDown("0.999999999999999999", 4)).toBe("0.9999");
  });
});
