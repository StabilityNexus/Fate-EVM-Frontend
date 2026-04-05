import type { Chain } from "viem";
import { SUPPORTED_CHAINS, getChainMeta } from "@/lib/chains";

export interface ChainConfig {
  chain: Chain;
  name: string;
}

export const getChainConfig = (chainId: number): ChainConfig | null => {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  if (!chain) return null;

  const meta = getChainMeta(chainId);
  return {
    chain,
    name: meta?.name ?? chain.name,
  };
};
