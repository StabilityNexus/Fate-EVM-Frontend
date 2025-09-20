import { Chain } from "viem";
import { mainnet, polygon, sepolia, base, bsc } from "viem/chains";
import { ethereumClassic } from "./chains/EthereumClassic";

export interface ChainConfig {
  chain: Chain;
  name: string;
}

export const getChainConfig = (chainId: number): ChainConfig | null => {
  switch (chainId) {
    case mainnet.id: // 1
      return { chain: mainnet, name: "Ethereum Mainnet" };
    case polygon.id: // 137
      return { chain: polygon, name: "Polygon" };
    case bsc.id: // 56
      return { chain: bsc, name: "BSC Mainnet" };
    case base.id: // 8453
      return { chain: base, name: "Base Mainnet" };
    case sepolia.id: // 11155111
      return { chain: sepolia, name: "Sepolia Testnet" };
    case 61: // Ethereum Classic
      return { chain: ethereumClassic, name: "Ethereum Classic" };
    default:
      return null;
  }
};