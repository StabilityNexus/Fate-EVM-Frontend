export const SLIPPAGE_TOLERANCE_BPS = BigInt(50);
export const SLIPPAGE_LABEL = "0.5%";

const BPS = BigInt(10_000);

export const applySlippage = (amount: bigint): bigint =>
  (amount * (BPS - SLIPPAGE_TOLERANCE_BPS)) / BPS;

export const isSlippageError = (err: unknown): boolean => {
  const e = err as { message?: string; shortMessage?: string } | undefined;
  return `${e?.shortMessage ?? ""} ${e?.message ?? ""}`.includes("SlippageExceeded");
};

export const SLIPPAGE_MESSAGE =
  `The price moved by more than ${SLIPPAGE_LABEL} before your trade confirmed, so it was cancelled and nothing was traded. Try again.`;
