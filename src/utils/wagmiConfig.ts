import { sepolia } from "wagmi/chains";
import { ethereumClassic } from "./chains/EthereumClassic";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [
    sepolia,
    ethereumClassic,
  ],
  connectors: [
    injected(),
  ],
  transports: {
    [sepolia.id]: http(),
    [ethereumClassic.id]: http(),
  },
  ssr: true,
});
