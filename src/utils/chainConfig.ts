import { Chain } from "viem";
import { polygon, sepolia } from "viem/chains";

export interface ChainConfig {
  chain: Chain;
  name: string;
}

export const getChainConfig = (chainId: number): ChainConfig | null => {
  switch (chainId) {
    case sepolia.id: // 11155111
      return { chain: sepolia, name: "Sepolia Testnet" };
    case polygon.id: // 137
      return { chain: polygon, name: "Polygon" };
    default:
      return null;
  }
};
