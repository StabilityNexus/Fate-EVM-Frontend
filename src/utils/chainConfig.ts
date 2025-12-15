import { Chain } from "viem";
import { sepolia } from "viem/chains";
import { ethereumClassic } from "./chains/EthereumClassic";

export interface ChainConfig {
  chain: Chain;
  name: string;
}

export const getChainConfig = (chainId: number): ChainConfig | null => {
  switch (chainId) {
    case sepolia.id: // 11155111
      return { chain: sepolia, name: "Sepolia Testnet" };
    case 61: // Ethereum Classic
      return { chain: ethereumClassic, name: "Ethereum Classic" };
    default:
      return null;
  }
};