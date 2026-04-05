import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import {
  ValidationError,
  checkRateLimit,
  stopRateLimitCleanup,
  validateAddress,
  validateAmount,
  validateChainId,
  validateFee,
  validatePoolId,
  validatePoolName,
  validateTokenSymbol,
} from "@/lib/validation";

afterAll(() => {
  // Prevent open handles from the module-level setInterval
  stopRateLimitCleanup();
});

describe("validation: amounts", () => {
  it("rejects empty/whitespace amounts", () => {
    expect(() => validateAmount("")).toThrow(ValidationError);
    expect(() => validateAmount("   ")).toThrow(/cannot be empty/i);
  });

  it("rejects invalid numeric formats that would break parseUnits", () => {
    expect(() => validateAmount(".")).toThrow(/valid number/i);
    expect(() => validateAmount("1.")).toThrow(/valid number/i);
    expect(() => validateAmount("-1")).toThrow(/valid number/i);
    expect(() => validateAmount("1..0")).toThrow(/valid number/i);
  });

  it("rejects zero amounts", () => {
    expect(() => validateAmount("0")).toThrow(/positive/i);
    expect(() => validateAmount("0.0")).toThrow(/positive/i);
    expect(() => validateAmount("00.000")).toThrow(/positive/i);
  });

  it("enforces max decimals", () => {
    expect(validateAmount("1.23", 2)).toBe("1.23");
    expect(() => validateAmount("1.234", 2)).toThrow(/decimal places/i);
  });
});

describe("validation: addresses and ids", () => {
  const addr = "0x0000000000000000000000000000000000000001";

  it("checksums addresses and rejects invalid ones", () => {
    expect(validateAddress(addr)).toBe(addr);
    expect(() => validateAddress("not-an-address")).toThrow(/Invalid address/i);
  });

  it("validates pool ids as addresses", () => {
    expect(validatePoolId(addr)).toBe(addr);
    expect(() => validatePoolId("0x123")).toThrow(/Invalid pool ID/i);
  });

  it("validates supported chain ids only", () => {
    expect(validateChainId(61)).toBe(61);
    expect(() => validateChainId(999999)).toThrow(/Unsupported chain ID/i);
  });
});

describe("validation: symbols, names, fees", () => {
  it("normalizes token symbols and rejects invalid ones", () => {
    expect(validateTokenSymbol("eth")).toBe("ETH");
    expect(() => validateTokenSymbol("")).toThrow(/required/i);
    expect(() => validateTokenSymbol("TOO-LONG-SYMBOL")).toThrow(
      /1-10 characters/i,
    );
    expect(() => validateTokenSymbol("A B")).toThrow(/letters and numbers/i);
  });

  it("validates pool names", () => {
    expect(validatePoolName("My Pool 1")).toBe("My Pool 1");
    expect(() => validatePoolName("ab")).toThrow(/3-50/i);
    expect(() => validatePoolName("Bad<>Name")).toThrow(/invalid characters/i);
  });

  it("validates fees", () => {
    expect(validateFee("1.5")).toBe(1.5);
    expect(() => validateFee(-1)).toThrow(/negative/i);
    expect(() => validateFee(101, 100)).toThrow(/exceed/i);
  });
});

describe("validation: rate limiting", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("limits within a window and resets after window passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const key = "user:0xabc";
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(() => checkRateLimit(key, 2, 1000)).toThrow(/Rate limit exceeded/i);

    // Advance beyond window → should reset
    vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
  });
});

