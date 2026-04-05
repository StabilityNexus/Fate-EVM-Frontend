import { getChainMeta } from "@/lib/chains";

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const getExplorerBaseUrl = (chainId: number): string | null => {
  const meta = getChainMeta(chainId);
  if (!meta) return null;

  const baseUrl = meta.blockExplorers?.default?.url ?? meta.explorerBaseUrl;
  if (!baseUrl) return null;

  return stripTrailingSlashes(baseUrl);
};

/**
 * Returns the block-explorer URL for a transaction hash on the given chain,
 * or `null` if the chain is not in the supported list.
 *
 * Callers must handle the `null` case (e.g. hide the link).
 */
export const getExplorerUrl = (
  hash: `0x${string}`,
  chainId: number,
): string | null => {
  const baseUrl = getExplorerBaseUrl(chainId);
  if (!baseUrl) return null;
  return `${baseUrl}/tx/${hash}`;
};

/**
 * Returns the block-explorer URL for an address on the given chain,
 * or `null` if the chain is not in the supported list.
 *
 * Callers must handle the `null` case (e.g. hide the link).
 */
export const getAddressExplorerUrl = (
  address: `0x${string}`,
  chainId: number,
: string => {
  const baseUrl = getExplorerBaseUrl(chainId);
  if (!baseUrl) {
    throw new Error(`Unsupported chain for explorer url: ${chainId}`);
  }
  return `${baseUrl}/address/${address}`;
};
