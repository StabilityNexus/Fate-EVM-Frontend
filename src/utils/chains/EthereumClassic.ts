import { defineChain } from 'viem'

export const ethereumClassic = defineChain({
  id: 61,
  name: 'Ethereum Classic',
  network: 'ethereumClassic',
  nativeCurrency: {
    name: 'Ethereum Classic',
    symbol: 'ETC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://etc.rivet.link'],
    },
    public: {
      http: ['https://etc.rivet.link'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BlockScout',
      url: 'https://blockscout.com/etc/mainnet',
    },
  },
})
