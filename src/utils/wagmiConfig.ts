import {
  sepolia,
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

  if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
    console.warn(
      '⚠️ Reown Project ID is missing. Please set NEXT_PUBLIC_PROJECT_ID in your .env file.\n' +
      'Get one for free at https://cloud.reown.com'
    );
  }

  memoizedConfig = getDefaultConfig({
    appName: "Fate Protocol",
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "DEFAULT_PROJECT_ID",
    chains: [
      ethereumClassic, // 61 - Ethereum Classic
      sepolia,    // 11155111 - Sepolia Testnet
    ],
    transports: {
      [ethereumClassic.id]: http(),
      [sepolia.id]: http(),
    },
    ssr: true, // Enable SSR for proper hydration
    // Add connection persistence
    // enableAnalytics: false, // Disable analytics to prevent connection issues
  });

  return memoizedConfig;
})();
