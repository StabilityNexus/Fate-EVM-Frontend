import { Chain } from "viem";
import { mainnet, polygon, sepolia, base, bsc } from "viem/chains";

export interface ChainConfig {
  chain: Chain;
  name: string;
}

export const getChainConfig = (chainId: number): ChainConfig | null => {
  switch (chainId) {
    case mainnet.id:
      return { chain: mainnet, name: "Ethereum Mainnet" };
    case polygon.id:
      return { chain: polygon, name: "Polygon" };
    case sepolia.id:
      return { chain: sepolia, name: "Sepolia Testnet" };
    case base.id:
      return { chain: base, name: "Base Mainnet" };
    case bsc.id:
      return { chain: bsc, name: "BSC Mainnet" };
    default:
      return null;
  }
};