import {
  sepolia,
  polygon,
} from "wagmi/chains";
import { createWalletLinkConfig } from "@stability-nexus/walletlink";
import { getTransport } from "./rpcTransport";

// Wallet connection is handled in-browser via EIP-6963 discovery: no
// WalletConnect relay and no projectId. Created once at module load.
export const config = createWalletLinkConfig({
  chains: [
    sepolia,    // 11155111 - Sepolia Testnet
    polygon,    // 137 - Polygon
  ],
  transports: {
    [sepolia.id]: getTransport(sepolia.id),
    [polygon.id]: getTransport(polygon.id),
  },
  ssr: true, // Enable SSR for proper hydration
});
