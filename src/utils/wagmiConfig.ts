import { createConfig, http } from "wagmi";
import type { Chain } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { SUPPORTED_CHAINS } from "@/lib/chains";

const transports: Record<number, ReturnType<typeof http>> = {};
for (const chain of SUPPORTED_CHAINS) {
  transports[chain.id] = http();
}

const configuredChains = SUPPORTED_CHAINS as [Chain, ...Chain[]];

export const config = createConfig({
  chains: configuredChains,
  connectors: [
    injected(),
  ],
  transports,
  ssr: true,
});
