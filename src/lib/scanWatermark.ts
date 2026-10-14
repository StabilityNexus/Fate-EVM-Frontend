import { logger } from "@/lib/logger";

// Saves how far a scan got, even when it finds nothing. Without this, a user with no trades
// caches nothing and re-scans every block on every page load.

const PREFIX = "fateScan";

const isAvailable = (): boolean => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

const buildKey = (kind: string, chainId: number, contract: string, subject?: string): string => {
  const scope = subject ? `${contract.toLowerCase()}:${subject.toLowerCase()}` : contract.toLowerCase();
  return `${PREFIX}:${kind}:${chainId}:${scope}`;
};

export const readScanWatermark = (
  kind: string,
  chainId: number,
  contract: string,
  subject?: string
): bigint | null => {
  if (!isAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(buildKey(kind, chainId, contract, subject));
    if (!raw) return null;
    const parsed = BigInt(raw);
    return parsed >= BigInt(0) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearScanWatermarks = (): void => {
  if (!isAvailable()) return;
  try {
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(`${PREFIX}:`));
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    logger.debug("clearScanWatermarks: could not clear watermarks", {
      message: (error as Error)?.message,
    });
  }
};

// Never moves backwards, so a partial scan cannot erase a deeper completed one.
export const writeScanWatermark = (
  kind: string,
  chainId: number,
  contract: string,
  block: bigint,
  subject?: string
): void => {
  if (!isAvailable()) return;
  try {
    const key = buildKey(kind, chainId, contract, subject);
    const existing = readScanWatermark(kind, chainId, contract, subject);
    if (existing !== null && existing >= block) return;
    window.localStorage.setItem(key, block.toString());
  } catch (error) {
    logger.debug("writeScanWatermark: could not persist watermark", {
      kind,
      chainId,
      contract,
      message: (error as Error)?.message,
    });
  }
};
