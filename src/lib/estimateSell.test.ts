import { describe, expect, it } from "vitest";
import { DENOMINATOR, feeRoundingInflated } from "@/lib/estimateBuy";
import { estimateSell, type SellQuoteInput } from "@/lib/estimateSell";

const E18 = BigInt(10) ** BigInt(18);
const E6 = BigInt(10) ** BigInt(6);

// A balanced pool: 100 base on each side, 100 coins out, so priceSell is exactly 1.0.
const balanced: SellQuoteInput = {
  amountIn: BigInt(10) * E18,
  isBull: true,
  bullReserve: BigInt(100) * E18,
  bearReserve: BigInt(100) * E18,
  totalSupply: BigInt(100) * E18,
  previousPrice: E18,
  oraclePrice: E18,
  burnFee: BigInt(400),      // 0.4%
  treasuryFee: BigInt(300),  // 0.3%
  creatorFee: BigInt(200),   // 0.2%
  baseDecimals: 18,
};

function ok(input: SellQuoteInput) {
  const result = estimateSell(input);
  if (!result.ok) throw new Error(`expected a quote, got ${result.reason}`);
  return result.quote;
}

describe("estimateSell", () => {
  it("takes the fees off the output at burnFee, after converting at priceSell", () => {
    const q = ok(balanced);
    expect(q.price).toBe(DENOMINATOR);
    expect(q.amountBeforeFees).toBe(BigInt(10) * E18);
    expect(q.vaultAmount).toBe(BigInt(4) * E18 / BigInt(100));      // 0.4% of 10
    expect(q.treasuryAmount).toBe(BigInt(3) * E18 / BigInt(100));
    expect(q.creatorAmount).toBe(BigInt(2) * E18 / BigInt(100));
    expect(q.totalFees).toBe(BigInt(9) * E18 / BigInt(100));
    expect(q.amountOut).toBe(BigInt(991) * E18 / BigInt(100));       // 9.91
    expect(q.effectivePrice).toBe(BigInt(99100));
    expect(q.effectiveFeeRate).toBe(BigInt(900));
    expect(q.feeRoundingInflated).toBe(false);
  });

  it("prices off the post-rebalance reserve, not the stored one", () => {
    // Oracle doubled since the last rebalance: bull side goes 100 -> 160.
    const q = ok({ ...balanced, oraclePrice: BigInt(2) * E18 });
    expect(q.price).toBe(BigInt(160000));
    expect(q.amountBeforeFees).toBe(BigInt(16) * E18);
  });

  it("refuses to sell the whole supply, and allows one wei less", () => {
    expect(estimateSell({ ...balanced, amountIn: balanced.totalSupply })).toEqual({
      ok: false, reason: "supply-would-be-zero",
    });
    expect(estimateSell({ ...balanced, amountIn: balanced.totalSupply - BigInt(1) }).ok).toBe(true);
  });

  it("fails when the rounded-up fees exceed the output", () => {
    // 1 wei of coin is worth 1 wei of base; three fees each round up to 1 wei.
    expect(estimateSell({ ...balanced, amountIn: BigInt(1) })).toEqual({
      ok: false, reason: "amount-below-fees",
    });
  });

  it("flags fee rounding on small amounts", () => {
    // 150 wei owes 1.35 wei nominally; each fee rounds up to 1, so 3 wei is paid.
    const q = ok({ ...balanced, amountIn: BigInt(150) });
    expect(q.totalFees).toBe(BigInt(3));
    expect(q.amountOut).toBe(BigInt(147));
    expect(q.feeRoundingInflated).toBe(true);
  });

  it("scales a 6-decimal base token down once, before the fees", () => {
    const q = ok({
      ...balanced,
      bullReserve: BigInt(100) * E6,
      bearReserve: BigInt(100) * E6,
      baseDecimals: 6,
    });
    expect(q.price).toBe(DENOMINATOR);
    expect(q.amountBeforeFees).toBe(BigInt(10) * E6);
    expect(q.amountOut).toBe(BigInt(9_910_000));
  });

  it("refuses an amount that rounds to nothing in base decimals", () => {
    expect(estimateSell({
      ...balanced,
      bullReserve: BigInt(100) * E6,
      bearReserve: BigInt(100) * E6,
      baseDecimals: 6,
      amountIn: BigInt(10) ** BigInt(11), // worth 1e11 WAD, below one base unit of 1e12
    })).toEqual({ ok: false, reason: "rounds-to-zero" });
  });

  it("passes the value through untouched on a fee-free pool", () => {
    const q = ok({ ...balanced, burnFee: BigInt(0), treasuryFee: BigInt(0), creatorFee: BigInt(0) });
    expect(q.totalFees).toBe(BigInt(0));
    expect(q.amountOut).toBe(q.amountBeforeFees);
    expect(q.effectiveFeeRate).toBe(BigInt(0));
    expect(q.feeRoundingInflated).toBe(false);
  });

  it("refuses to quote against an empty reserve", () => {
    expect(estimateSell({ ...balanced, bullReserve: BigInt(0) })).toEqual({
      ok: false, reason: "cannot-quote",
    });
  });
});

describe("feeRoundingInflated", () => {
  it("trips only when rounding pushes the fee more than 10% over nominal", () => {
    expect(feeRoundingInflated(BigInt(3), BigInt(150), BigInt(900))).toBe(true);
    expect(feeRoundingInflated(BigInt(9), BigInt(1000), BigInt(900))).toBe(false);
    expect(feeRoundingInflated(BigInt(0), BigInt(0), BigInt(900))).toBe(false);
  });
});
