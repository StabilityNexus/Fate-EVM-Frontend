import { Chain } from "viem";
import { sepolia } from "viem/chains";

export interface ChainConfig {
  chain: Chain;
  name: string;
}

export const getChainConfig = (chainId: number): ChainConfig | null => {
  switch (chainId) {
    case sepolia.id: // 11155111
      return { chain: sepolia, name: "Sepolia Testnet" };
    default:
      return null;
  }
};