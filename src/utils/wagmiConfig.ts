import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";
import { createConfig, http } from "wagmi";

import { ethereumClassic } from "./chains/EthereumClassic";

// Memoize the config to prevent recreation
let memoizedConfig: ReturnType<typeof getDefaultConfig> | ReturnType<typeof createConfig> | null = null;

export const config = (() => {
  if (memoizedConfig) {
    return memoizedConfig;
  }

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  if (!projectId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Reown Project ID is missing. WalletConnect will be disabled. Set NEXT_PUBLIC_PROJECT_ID in your .env file.\n" +
        "Get one for free at https://cloud.reown.com"
      );
    }

    memoizedConfig = createConfig({
      chains: [
        sepolia, // 11155111 - Sepolia Testnet
        ethereumClassic, // 61 - Ethereum Classic
      ],
      connectors: [injected()],
      transports: {
        [ethereumClassic.id]: http(),
        [sepolia.id]: http(),
      },
      ssr: true,
    });

    return memoizedConfig;
  }

  memoizedConfig = getDefaultConfig({
    appName: "Fate Protocol",
    projectId,
    chains: [
      sepolia, // 11155111 - Sepolia Testnet
      ethereumClassic, // 61 - Ethereum Classic
    ],
    transports: {
      [ethereumClassic.id]: http(),
      [sepolia.id]: http(),
    },
    ssr: true,
  });

  return memoizedConfig;
})();
