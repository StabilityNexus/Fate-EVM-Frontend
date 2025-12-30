import {
  mainnet,
  polygon,
  sepolia,
  base,
  bsc,
} from "wagmi/chains";
import { ethereumClassic } from "./chains/EthereumClassic";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

// const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID ?? "DEFAULT_PROJECT_ID";

// Memoize the config to prevent recreation
let memoizedConfig: ReturnType<typeof getDefaultConfig> | null = null;

export const config = (() => {
  if (memoizedConfig) {
    return memoizedConfig;
  }

  memoizedConfig = getDefaultConfig({
    appName: "Fate Protocol",
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? "DEFAULT_PROJECT_ID",
    chains: [
      ethereumClassic, // 61 - Ethereum Classic
      sepolia,    // 11155111 - Sepolia Testnet
    ],
    transports: {
      [ethereumClassic.id]: http(),
      [sepolia.id]: http(),
    },
    ssr: false, // Disable SSR to prevent wallet disconnection issues
    // Add connection persistence
    // enableAnalytics: false, // Disable analytics to prevent connection issues
  });

  return memoizedConfig;
})();
