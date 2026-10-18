// Quote for Coin.buy(), in bigint so rounding matches the chain. BigInt(0) rather than 0n
// because the build target is ES2017.

import { expWad, lnWad } from './wadMath';

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);
const WAD_DECIMALS = BigInt(18);

export const DENOMINATOR = BigInt(100000);

// Warn when rounding pushes the fee more than 10% above the normal rate. Only tiny amounts do that.
const ROUNDING_WARN_NUM = BigInt(11);
const ROUNDING_WARN_DEN = BigInt(10);

export function divUp(a: bigint, b: bigint): bigint {
  return (a + b - ONE) / b;
}

export function scaleUp(a: bigint, baseDecimals: bigint): bigint {
  return a * TEN ** (WAD_DECIMALS - baseDecimals);
}

export function scaleDown(a: bigint, baseDecimals: bigint): bigint {
  return a / TEN ** (WAD_DECIMALS - baseDecimals);
}

export function feeRoundingInflated(totalFees: bigint, amount: bigint, nominalFeeRate: bigint): boolean {
  return (
    amount > ZERO &&
    nominalFeeRate > ZERO &&
    totalFees * DENOMINATOR * ROUNDING_WARN_DEN > amount * nominalFeeRate * ROUNDING_WARN_NUM
  );
}

export type RebalanceTargets = {
  bull: bigint;
  bear: bigint;
};

const WAD = BigInt(10) ** BigInt(18);
const WAD_SQUARED = WAD * WAD;
const MAX_EXPONENT = BigInt(20) * WAD;

// (newPrice / oldPrice) ^ leverage in WAD, with the contract's clamps so it never throws.
function leveragedRatio(oldPrice: bigint, newPrice: bigint, leverage: bigint): bigint {
  let ratio = (newPrice * WAD) / oldPrice;
  if (ratio === ZERO) ratio = ONE;
  if (ratio > WAD_SQUARED) ratio = WAD_SQUARED;
  if (leverage === WAD) return ratio;
  const lev = leverage > WAD_SQUARED ? WAD_SQUARED : leverage;

  let exponent = (lev * lnWad(ratio)) / WAD;
  if (exponent > MAX_EXPONENT) exponent = MAX_EXPONENT;
  if (exponent < -MAX_EXPONENT) exponent = -MAX_EXPONENT;
  return expWad(exponent);
}

// Reserves after rebalance(). Mirrors PredictionPool._rebalance line for line; it never
// reverts on chain, so this never returns null.
export function simulateRebalance(
  bull: bigint,
  bear: bigint,
  oldPrice: bigint,
  newPrice: bigint,
  leverage: bigint,
): RebalanceTargets {
  if (newPrice === ZERO || oldPrice === ZERO) return { bull, bear };

  const total = bull + bear;
  if (total === ZERO) return { bull: ZERO, bear: ZERO };

  if (newPrice === oldPrice) return { bull, bear };

  const ratio = leveragedRatio(oldPrice, newPrice, leverage);
  const adjustedBull = (bull * ratio) / WAD;
  const adjustedBear = (bear * WAD) / ratio;
  const denominator = adjustedBull + adjustedBear;

  let targetBull = denominator === ZERO ? bull : (total * adjustedBull) / denominator;
  // A side that holds reserve keeps at least one unit.
  if (targetBull === ZERO && bull !== ZERO) targetBull = ONE;
  else if (targetBull === total && bear !== ZERO) targetBull = total - ONE;
  return { bull: targetBull, bear: total - targetBull };
}

export type BuyQuoteInput = {
  amountIn: bigint;
  isBull: boolean;
  bullReserve: bigint;
  bearReserve: bigint;
  totalSupply: bigint;
  previousPrice: bigint;     // oracle price at the last rebalance
  oraclePrice: bigint;       // oracle price now
  leverage: bigint;          // WAD, 1e18 is 1x
  mintFee: bigint;
  treasuryFee: bigint;
  creatorFee: bigint;
  baseDecimals: number;
};

export type BuyQuote = {
  amountIn: bigint;
  vaultAmount: bigint;
  treasuryAmount: bigint;
  creatorAmount: bigint;
  totalFees: bigint;
  amountAfterFees: bigint;
  coinsOut: bigint;          // WAD
  effectivePrice: bigint;    // DENOMINATOR terms
  nominalFeeRate: bigint;    // DENOMINATOR terms
  effectiveFeeRate: bigint;  // DENOMINATOR terms
  feeRoundingInflated: boolean;
};

// cannot-quote groups the cases the user can do nothing about.
export type BuyQuoteFailure = 'cannot-quote' | 'amount-below-fees';

export type BuyQuoteResult =
  | { ok: true; quote: BuyQuote }
  | { ok: false; reason: BuyQuoteFailure };

// buy() rebalances first, so the price comes from the reserve after that rebalance.
export function estimateBuy(input: BuyQuoteInput): BuyQuoteResult {
  const {
    amountIn, isBull, bullReserve, bearReserve, totalSupply,
    previousPrice, oraclePrice, leverage, mintFee, treasuryFee, creatorFee, baseDecimals,
  } = input;

  if (baseDecimals < 0 || baseDecimals > 18) return { ok: false, reason: 'cannot-quote' };
  const decimals = BigInt(baseDecimals);

  const targets = simulateRebalance(bullReserve, bearReserve, previousPrice, oraclePrice, leverage);
  const reserve = isBull ? targets.bull : targets.bear;

  // Each fee rounds up on its own, so a tiny amount can owe more than it is worth.
  const vaultAmount = divUp(amountIn * mintFee, DENOMINATOR);
  const treasuryAmount = divUp(amountIn * treasuryFee, DENOMINATOR);
  const creatorAmount = divUp(amountIn * creatorFee, DENOMINATOR);
  const totalFees = vaultAmount + treasuryAmount + creatorAmount;
  if (totalFees > amountIn) return { ok: false, reason: 'amount-below-fees' };

  const amountAfterFees = amountIn - totalFees;

  // Compared cross-multiplied so nothing is lost to division.
  const nominalFeeRate = mintFee + treasuryFee + creatorFee;
  const effectiveFeeRate =
    amountIn === ZERO ? ZERO : (totalFees * DENOMINATOR) / amountIn;
  const roundingInflated = feeRoundingInflated(totalFees, amountIn, nominalFeeRate);

  const price =
    totalSupply === ZERO
      ? DENOMINATOR
      : divUp(scaleUp(reserve, decimals) * DENOMINATOR, totalSupply);
  if (price === ZERO) return { ok: false, reason: 'cannot-quote' };

  const coinsOut = divUp(DENOMINATOR * scaleUp(amountAfterFees, decimals), price);
  const effectivePrice =
    coinsOut === ZERO ? ZERO : divUp(scaleUp(amountIn, decimals) * DENOMINATOR, coinsOut);

  return {
    ok: true,
    quote: {
      amountIn, vaultAmount, treasuryAmount, creatorAmount,
      totalFees, amountAfterFees, coinsOut, effectivePrice,
      nominalFeeRate, effectiveFeeRate, feeRoundingInflated: roundingInflated,
    },
  };
}
