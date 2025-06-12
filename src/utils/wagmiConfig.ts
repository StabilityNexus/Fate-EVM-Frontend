import {
    arbitrum,
    base,
    mainnet,
    optimism,
    polygon,
    citreaTestnet,
    scrollSepolia,
    sepolia,
    Chain,
} from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { ethereumClassic } from '@/components/chains/EthereumClassic';
import { milkomeda } from '@/components/chains/Milkomeda';
import { http } from 'wagmi';

export const config = getDefaultConfig({
    appName: 'Fate Protocol',
    projectId: 'xyz',
    chains: [
        scrollSepolia,
        polygon,
        mainnet,
        citreaTestnet,
        ethereumClassic,
        milkomeda,
        sepolia
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
    ssr: true,
});