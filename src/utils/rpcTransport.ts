import { http, fallback, type Transport } from "viem";

// Keyless public RPC lists per chain.
const DEFAULT_RPC_URLS: Record<number, string[]> = {
  11155111: [
    "https://sepolia.drpc.org",
    "https://sepolia.gateway.tenderly.co",
  ],
};

// User RPCs (prepended, take priority); filled later by the settings page.
const USER_RPC_URLS: Record<number, string[]> = {};
const getUserRpcUrls = (chainId: number): string[] => USER_RPC_URLS[chainId] ?? [];

// fallback() covers node outages, not getLogs range-cap rejections.
export const getTransport = (chainId: number): Transport => {
  const urls = [...getUserRpcUrls(chainId), ...(DEFAULT_RPC_URLS[chainId] ?? [])];
  if (urls.length === 0) {
    return http(); // unknown chain: viem's built-in default
  }
  return fallback(urls.map((url) => http(url)));
};

// A scan sends hundreds of calls, so viem's default retries multiplied it by ~10. Retries are
// off here only; normal reads still want them.
export const getScanTransport = (chainId: number): Transport => {
  const urls = [...getUserRpcUrls(chainId), ...(DEFAULT_RPC_URLS[chainId] ?? [])];
  if (urls.length === 0) {
    return http(undefined, { retryCount: 0 });
  }
  return fallback(
    urls.map((url) => http(url, { retryCount: 0, timeout: 20_000 })),
    { retryCount: 0 }
  );
};

// Every provider in a chain's list must accept the chunk, so use the smallest limit.
// Measured 2026-07-29: drpc 10k, tenderly 1M.
const SCAN_CHUNK_SIZE: Record<number, bigint> = {
  11155111: BigInt(10_000),
};

const DEFAULT_SCAN_CHUNK_SIZE = BigInt(2_000);

export const getScanChunkSize = (chainId: number): bigint =>
  SCAN_CHUNK_SIZE[chainId] ?? DEFAULT_SCAN_CHUNK_SIZE;

export const isRateLimitError = (error: unknown): boolean => {
  const err = error as { status?: number; message?: string };
  if (err?.status === 429) return true;
  const message = err?.message?.toLowerCase() ?? "";
  return message.includes("429") || message.includes("rate limit") || message.includes("too many requests");
};

export const isRangeOrResultCapError = (error: unknown): boolean => {
  const message = (error as { message?: string })?.message?.toLowerCase() ?? "";
  return (
    message.includes("ranges over") ||
    message.includes("max results") ||
    message.includes("too many logs") ||
    message.includes("query returned more than") ||
    message.includes("log response size exceeded")
  );
};
