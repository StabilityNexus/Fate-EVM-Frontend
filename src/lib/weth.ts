import { type Address } from 'viem';

export const WETH_BY_CHAIN_ID: Record<number, { address: Address; decimals: 18; symbol: 'WETH' }> = {
  11155111: { // Sepolia
    address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    decimals: 18,
    symbol: 'WETH',
  },
  8453: { // Base Mainnet
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    symbol: 'WETH',
  },
  84532: { // Base Sepolia
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    symbol: 'WETH',
  },
  42161: { // Arbitrum One
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    decimals: 18,
    symbol: 'WETH',
  },
  421614: { // Arbitrum Sepolia
    address: '0x980B62Da83eFf3D4576C647993b0c1D7faf1711A',
    decimals: 18,
    symbol: 'WETH',
  },
  10: { // Optimism
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    symbol: 'WETH',
  },
  11155420: { // Optimism Sepolia
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    symbol: 'WETH',
  },
};

export function getWethConfig(chainId: number) {
  const cfg = WETH_BY_CHAIN_ID[chainId];
  if (!cfg) throw new Error(`No WETH config for chain ${chainId}`);
  return cfg;
}

export const WETH_ABI = [
  { type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [] },
  { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{ name: 'wad', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;
