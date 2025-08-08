import {
  mainnet,
  polygon,
  citreaTestnet,
  scrollSepolia,
  sepolia,
} from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { milkomeda } from "@/utils/chains/Milkomeda";
import { ethereumClassic } from "@/utils/chains/EthereumClassic";
import { http } from "wagmi";

// Ensure your environment variable is set properly
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_PROJECT_ID environment variable is required");
}

export const config = getDefaultConfig({
  appName: "Fate Protocol",
  projectId: PROJECT_ID,
  chains: [
    scrollSepolia,
    polygon,
    mainnet,
    citreaTestnet,
    ethereumClassic,
    milkomeda,
    sepolia,
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [scrollSepolia.id]: http(),
    [citreaTestnet.id]: http(),
    [ethereumClassic.id]: http(),
    [milkomeda.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});
