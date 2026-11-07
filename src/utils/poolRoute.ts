import { isAddress } from "viem";
import { getChainConfig } from "./chainConfig";
import { isChainSupported } from "./supportedChainFeed";

export type NetworkChoice = { chainId: number; name: string; href: string };

export const poolHref = (poolId: string, chainId: number): string =>
  `/pool?id=${poolId}&chainId=${chainId}`;

export const resolvePoolChainId = (param: string | null): number | null => {
  if (param === null) return null;
  const chainId = Number(param);
  return String(chainId) === param && isChainSupported(chainId) ? chainId : null;
};

export const isWrongNetwork = (walletChainId: number | undefined, poolChainId: number | null): boolean =>
  walletChainId !== undefined && poolChainId !== null && walletChainId !== poolChainId;

// A valid address with no chain (old links, the address search) asks the user to pick the network.
export const poolPageView = (idParam: string | null, chainParam: string | null): "pick-network" | "pool" =>
  !chainParam && idParam !== null && isAddress(idParam) ? "pick-network" : "pool";

export const networkChoices = (poolId: string, chainIds: readonly number[]): NetworkChoice[] =>
  chainIds.filter(isChainSupported).map((chainId) => ({
    chainId,
    name: getChainConfig(chainId)?.name ?? `Chain ${chainId}`,
    href: poolHref(poolId, chainId),
  }));
