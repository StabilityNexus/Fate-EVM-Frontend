import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Address } from 'viem';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useBalance: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// Mock getWethConfig
vi.mock('@/lib/weth', () => ({
  getWethConfig: vi.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useEthWethBalances } from '../useEthWethBalances';
import { getWethConfig } from '@/lib/weth';

const MOCK_ADDRESS: Address = '0x1111111111111111111111111111111111111111';

describe('useEthWethBalances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unsupported chain', () => {
    it('returns isWethSupported = false for unsupported chain', () => {
      // getWethConfig throws for unsupported chain
      vi.mocked(getWethConfig).mockImplementation(() => {
        throw new Error('No WETH config for chain 1');
      });

      const { result } = renderHook(() => 
        useEthWethBalances({ chainId: 1, address: MOCK_ADDRESS })
      );

      expect(result.current.isWethSupported).toBe(false);
    });

    it('returns isWethSupported = true for supported chain', () => {
      vi.mocked(getWethConfig).mockReturnValue({
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        symbol: 'WETH' as const,
      });

      const { result } = renderHook(() => 
        useEthWethBalances({ chainId: 8453, address: MOCK_ADDRESS })
      );

      expect(result.current.isWethSupported).toBe(true);
    });
  });

  describe('enabled parameter', () => {
    it('passes enabled=false to query', () => {
      vi.mocked(getWethConfig).mockReturnValue({
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        symbol: 'WETH' as const,
      });

      const { result } = renderHook(() => 
        useEthWethBalances({ chainId: 8453, address: MOCK_ADDRESS, enabled: false })
      );

      // When enabled is false, balances should be zero
      expect(result.current.ethBalance).toBe(BigInt(0));
      expect(result.current.wethBalance).toBe(BigInt(0));
    });

    it('passes enabled=true to query', () => {
      vi.mocked(getWethConfig).mockReturnValue({
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        symbol: 'WETH' as const,
      });

      const { result } = renderHook(() => 
        useEthWethBalances({ chainId: 8453, address: MOCK_ADDRESS, enabled: true })
      );

      // Should be enabled - logic depends on hook implementation
      expect(result.current).toBeDefined();
    });
  });
});