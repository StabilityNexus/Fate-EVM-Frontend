// Quote for Coin.sell(). Not a mirror of the buy quote: fees come off the base-token output
// after priceSell() converts, and at burnFee.

import {
  DENOMINATOR, divUp, feeRoundingInflated, scaleDown, scaleUp, simulateRebalance,
} from './estimateBuy';

const ZERO = BigInt(0);

export type SellQuoteInput = {
  amountIn: bigint;          // WAD
  isBull: boolean;
  bullReserve: bigint;
  bearReserve: bigint;
  totalSupply: bigint;
  previousPrice: bigint;     // oracle price at the last rebalance
  oraclePrice: bigint;       // oracle price now
  burnFee: bigint;
  treasuryFee: bigint;
  creatorFee: bigint;
  baseDecimals: number;
};

export type SellQuote = {
  amountIn: bigint;          // WAD
  price: bigint;             // DENOMINATOR terms
  amountBeforeFees: bigint;  // base decimals
  vaultAmount: bigint;       // goes to the other coin's reserve
  treasuryAmount: bigint;
  creatorAmount: bigint;
  totalFees: bigint;
  amountOut: bigint;         // base decimals
  effectivePrice: bigint;    // DENOMINATOR terms
  nominalFeeRate: bigint;
  effectiveFeeRate: bigint;
  feeRoundingInflated: boolean;
};

// rounds-to-zero is not a revert: the chain would burn the coins and pay nothing, so it is
// refused here. cannot-quote groups the cases the user can do nothing about.
export type SellQuoteFailure =
  | 'cannot-quote'
  | 'rounds-to-zero'
  | 'supply-would-be-zero'
  | 'amount-below-fees';

export type SellQuoteResult =
  | { ok: true; quote: SellQuote }
  | { ok: false; reason: SellQuoteFailure };

export function estimateSell(input: SellQuoteInput): SellQuoteResult {
  const {
    amountIn, isBull, bullReserve, bearReserve, totalSupply,
    previousPrice, oraclePrice, burnFee, treasuryFee, creatorFee, baseDecimals,
  } = input;

  if (baseDecimals < 0 || baseDecimals > 18) return { ok: false, reason: 'cannot-quote' };
  const decimals = BigInt(baseDecimals);

  // sell() rebalances first, so the price comes from the reserve after that rebalance.
  const targets = simulateRebalance(bullReserve, bearReserve, previousPrice, oraclePrice);
  if (targets === null) return { ok: false, reason: 'cannot-quote' };
  const reserve = isBull ? targets.bull : targets.bear;

  if (totalSupply <= amountIn) return { ok: false, reason: 'supply-would-be-zero' };

  // priceSell() rounds down where priceBuy() rounds up.
  const price = (scaleUp(reserve, decimals) * DENOMINATOR) / totalSupply;
  if (price === ZERO) return { ok: false, reason: 'cannot-quote' };

  // The value is scaled to base decimals once, then each fee rounds up on its own.
  const amountBeforeFees = scaleDown((amountIn * price) / DENOMINATOR, decimals);
  if (amountBeforeFees === ZERO) return { ok: false, reason: 'rounds-to-zero' };

  const vaultAmount = divUp(amountBeforeFees * burnFee, DENOMINATOR);
  const treasuryAmount = divUp(amountBeforeFees * treasuryFee, DENOMINATOR);
  const creatorAmount = divUp(amountBeforeFees * creatorFee, DENOMINATOR);
  const totalFees = vaultAmount + treasuryAmount + creatorAmount;
  if (totalFees > amountBeforeFees) return { ok: false, reason: 'amount-below-fees' };

  const amountOut = amountBeforeFees - totalFees;
  const nominalFeeRate = burnFee + treasuryFee + creatorFee;
  const effectiveFeeRate = (totalFees * DENOMINATOR) / amountBeforeFees;
  const effectivePrice = (scaleUp(amountOut, decimals) * DENOMINATOR) / amountIn;

  return {
    ok: true,
    quote: {
      amountIn, price, amountBeforeFees, vaultAmount, treasuryAmount, creatorAmount,
      totalFees, amountOut, effectivePrice, nominalFeeRate, effectiveFeeRate,
      feeRoundingInflated: feeRoundingInflated(totalFees, amountBeforeFees, nominalFeeRate),
    },
  };
}
