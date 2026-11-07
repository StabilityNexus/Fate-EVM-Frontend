import { sepolia } from "viem/chains";
import { isChainSupported } from "./supportedChainFeed";

// The chain wagmi reads from when nothing names one. Matches the first chain in wagmiConfig.ts;
// keep the two in sync.
export const DEFAULT_POOL_CHAIN_ID = sepolia.id;

// A pool link names its chain, so the page can read the pool without the wallet on that chain.
export const poolHref = (poolId: string, chainId: number): string =>
  `/pool?id=${poolId}&chainId=${chainId}`;

// The chain to read a pool from. The link's chainId wins. A link without one (older links, an
// address pasted into search) uses wagmi's current chain (useChainId(): the wallet's last supported
// chain, kept after a disconnect), as the page did before links named a chain. null means the link
// names a chain the app does not support.
export const resolvePoolChainId = (
  param: string | null,
  currentChainId: number | undefined,
): number | null => {
  if (param !== null) {
    const chainId = Number(param);
    return String(chainId) === param && isChainSupported(chainId) ? chainId : null;
  }
  return currentChainId !== undefined && isChainSupported(currentChainId)
    ? currentChainId
    : DEFAULT_POOL_CHAIN_ID;
};
