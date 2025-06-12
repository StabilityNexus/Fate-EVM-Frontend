import { defineChain } from 'viem'

export const milkomeda = defineChain({
  id: 2001, 
  name: 'Milkomeda',
  network: 'milkomeda',
  nativeCurrency: {
    name: 'MilkADA',
    symbol: 'mADA',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet-cardano-evm.c1.milkomeda.com'],
    },
    public: {
      http: ['https://rpc-mainnet-cardano-evm.c1.milkomeda.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Milkomeda Explorer',
      url: 'https://explorer-mainnet-cardano-evm.c1.milkomeda.com',
    },
  },
})
