import { http, fallback, createPublicClient, type Transport } from "viem";

// Keyless public RPC lists per chain.
const DEFAULT_RPC_URLS: Record<number, string[]> = {
  11155111: [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.gateway.tenderly.co",
  ],
};

// localStorage, not IndexedDB: keeps the URL (often with an API key) out of export and clear-cache.
const USER_RPC_PREFIX = "fateRpc";
const userRpcKey = (chainId: number): string => `${USER_RPC_PREFIX}:${chainId}`;

export const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

// A trailing slash is the usual difference between two pastes of the same URL.
export const isSameRpcUrl = (a: string, b: string): boolean =>
  a.replace(/\/+$/, "") === b.replace(/\/+$/, "");

export const isDefaultRpcUrl = (chainId: number, url: string): boolean =>
  (DEFAULT_RPC_URLS[chainId] ?? []).some((defaultUrl) => isSameRpcUrl(defaultUrl, url));

export const readSavedUserRpcUrl = (chainId: number): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const url = window.localStorage.getItem(userRpcKey(chainId));
    return url && isHttpsUrl(url) ? url : null;
  } catch {
    return null;
  }
};

export const saveUserRpcUrl = (chainId: number, url: string): void => {
  window.localStorage.setItem(userRpcKey(chainId), url);
};

export const removeUserRpcUrl = (chainId: number): void => {
  window.localStorage.removeItem(userRpcKey(chainId));
};

// Read once, like wagmi's transport, so every client switches RPC together on reload.
const USER_RPC_URLS: Record<number, string[]> = Object.fromEntries(
  Object.keys(DEFAULT_RPC_URLS)
    .map(Number)
    .flatMap((chainId) => {
      const url = readSavedUserRpcUrl(chainId);
      return url ? [[chainId, [url]]] : [];
    })
);
const getUserRpcUrls = (chainId: number): string[] => USER_RPC_URLS[chainId] ?? [];

export const getActiveUserRpcUrl = (chainId: number): string | null =>
  getUserRpcUrls(chainId)[0] ?? null;

export const fetchRpcChainId = (url: string): Promise<number> =>
  createPublicClient({ transport: http(url, { retryCount: 0, timeout: 10_000 }) }).getChainId();

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
// Measured: tenderly 1M (2026-07-29), publicnode 50k (2026-09-28).
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
