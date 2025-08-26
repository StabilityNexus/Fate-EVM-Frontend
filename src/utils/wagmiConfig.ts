import {
  mainnet,
  polygon,
  sepolia,
} from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { ethereumClassic } from "@/utils/chains/EthereumClassic";
import { base } from "@/utils/chains/Base";
import { bsc } from "@/utils/chains/BNBSmartChain";
import { http } from "wagmi";

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID ?? "DEFAULT_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "Fate Protocol",
  projectId: PROJECT_ID,
  chains: [
    polygon,
    mainnet,
    ethereumClassic,
    base,
    bsc,
    sepolia,
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [ethereumClassic.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});
