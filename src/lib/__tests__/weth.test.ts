import { describe, it, expect } from 'vitest';
import { getWethConfig, getGasBufferForChain, WETH_ABI } from '../weth';
import { parseUnits } from 'viem';

describe('weth', () => {
  const supportedChains = [
    { chainId: 11155111, name: 'Sepolia' },
    { chainId: 8453, name: 'Base Mainnet' },
    { chainId: 84532, name: 'Base Sepolia' },
    { chainId: 42161, name: 'Arbitrum One' },
    { chainId: 421614, name: 'Arbitrum Sepolia' },
    { chainId: 10, name: 'Optimism' },
    { chainId: 11155420, name: 'Optimism Sepolia' },
  ];

  describe('getWethConfig', () => {
    supportedChains.forEach(({ chainId, name }) => {
      it(`returns correct config for ${name} (chain ${chainId})`, () => {
        const config = getWethConfig(chainId);
        expect(config).toBeDefined();
        expect(config.decimals).toBe(18);
        expect(config.symbol).toBe('WETH');
        expect(config.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      });
    });

    it('throws for unsupported chain ID', () => {
      expect(() => getWethConfig(1)).toThrow('No WETH config for chain 1');
      expect(() => getWethConfig(56)).toThrow('No WETH config for chain 56');
      expect(() => getWethConfig(137)).toThrow('No WETH config for chain 137');
    });
  });

  describe('WETH_ABI', () => {
    it('has deposit function', () => {
      const deposit = WETH_ABI.find(fn => fn.name === 'deposit');
      expect(deposit).toBeDefined();
      expect(deposit?.type).toBe('function');
      expect(deposit?.stateMutability).toBe('payable');
    });

    it('has withdraw function', () => {
      const withdraw = WETH_ABI.find(fn => fn.name === 'withdraw');
      expect(withdraw).toBeDefined();
      expect(withdraw?.type).toBe('function');
      expect(withdraw?.stateMutability).toBe('nonpayable');
    });

    it('has balanceOf function', () => {
      const balanceOf = WETH_ABI.find(fn => fn.name === 'balanceOf');
      expect(balanceOf).toBeDefined();
      expect(balanceOf?.type).toBe('function');
      expect(balanceOf?.stateMutability).toBe('view');
    });
  });
});

describe('getGasBufferForChain', () => {
  const l2Chains = [8453, 84532, 42161, 421614, 10, 11155420];
  const mainnetLikeChains = [11155111]; // Sepolia is testnet but not L2

  l2Chains.forEach(chainId => {
    it(`returns smaller buffer (0.0001) for L2 chain ${chainId}`, () => {
      const buffer = getGasBufferForChain(chainId);
      expect(buffer).toBe(parseUnits('0.0001', 18));
    });
  });

  mainnetLikeChains.forEach(chainId => {
    it(`returns larger buffer (0.002) for non-L2 chain ${chainId}`, () => {
      const buffer = getGasBufferForChain(chainId);
      expect(buffer).toBe(parseUnits('0.002', 18));
    });
  });
});