import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock wagmi core before importing the hook
vi.mock('@wagmi/core', () => ({
  waitForTransactionReceipt: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WriteContractMockReturn = any;

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useWriteContract: vi.fn((): WriteContractMockReturn => ({
    writeContractAsync: vi.fn(),
    writeContract: vi.fn(),
    isLoading: false,
    isSuccess: false,
    pending: false,
  })),
  useConfig: vi.fn(() => ({})),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn().mockReturnValue(1),
    dismiss: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { renderHook, waitFor } from '@testing-library/react';
import { useWrapEthToWeth } from '../useWrapEthToWeth';
import * as wagmiCore from '@wagmi/core';
import * as wagmi from 'wagmi';

describe('useWrapEthToWeth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bug 1: Reverted transaction handling', () => {
    it('sets status to error when receipt.status is "reverted"', async () => {
      const mockWriteContractAsync = vi.fn().mockResolvedValue('0xhash');
      
      // Use direct mock implementation
      vi.mocked(wagmi.useWriteContract).mockImplementation(() => ({
        writeContractAsync: mockWriteContractAsync,
      } as any));

      vi.mocked(wagmiCore.waitForTransactionReceipt).mockResolvedValue({
        status: 'reverted',
        blockNumber: 12345,
        transactionHash: '0xhash',
      } as any);

      vi.mocked(wagmi.useConfig).mockReturnValue({} as any);

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useWrapEthToWeth(11155111, onSuccess));

      // Act
      await result.current.wrap(BigInt(1000000000000000000));

      // Assert
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });

    it('calls toast.error when transaction reverts', async () => {
      const { toast } = await import('sonner');
      
      const mockWriteContractAsync = vi.fn().mockResolvedValue('0xhash');
      vi.mocked(wagmi.useWriteContract).mockImplementation(() => ({
        writeContractAsync: mockWriteContractAsync,
      } as any));

      vi.mocked(wagmiCore.waitForTransactionReceipt).mockResolvedValue({
        status: 'reverted',
      } as any);

      vi.mocked(wagmi.useConfig).mockReturnValue({} as any);

      const { result } = renderHook(() => useWrapEthToWeth(11155111));

      await result.current.wrap(BigInt(1000000000000000000));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('does NOT call toast.success when transaction reverts', async () => {
      const { toast } = await import('sonner');
      
      const mockWriteContractAsync = vi.fn().mockResolvedValue('0xhash');
      vi.mocked(wagmi.useWriteContract).mockImplementation(() => ({
        writeContractAsync: mockWriteContractAsync,
      } as any));

      vi.mocked(wagmiCore.waitForTransactionReceipt).mockResolvedValue({
        status: 'reverted',
      } as any);

      vi.mocked(wagmi.useConfig).mockReturnValue({} as any);

      const { result } = renderHook(() => useWrapEthToWeth(11155111));

      await result.current.wrap(BigInt(1000000000000000000));

      await waitFor(() => {
        expect(toast.success).not.toHaveBeenCalled();
      });
    });

    it('does NOT call onSuccess callback when transaction reverts', async () => {
      const onSuccess = vi.fn();
      
      const mockWriteContractAsync = vi.fn().mockResolvedValue('0xhash');
      vi.mocked(wagmi.useWriteContract).mockImplementation(() => ({
        writeContractAsync: mockWriteContractAsync,
      } as any));

      vi.mocked(wagmiCore.waitForTransactionReceipt).mockResolvedValue({
        status: 'reverted',
      } as any);

      vi.mocked(wagmi.useConfig).mockReturnValue({} as any);

      const { result } = renderHook(() => useWrapEthToWeth(11155111, onSuccess));

      await result.current.wrap(BigInt(1000000000000000000));

      await waitFor(() => {
        expect(onSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Bug 2a: Stale pending state / Wallet rejection', () => {
    it('allows retry after wallet rejection (code 4001)', async () => {
      // First call rejects with user rejection
      const mockWriteContractAsync = vi.fn()
        .mockRejectedValueOnce({ code: 4001, message: 'User rejected' })
        .mockResolvedValueOnce('0xhash2'); // Second call succeeds
      
      vi.mocked(wagmi.useWriteContract).mockImplementation(() => ({
        writeContractAsync: mockWriteContractAsync,
      } as any));

      // First waitForTransactionReceipt rejects, second succeeds
      vi.mocked(wagmiCore.waitForTransactionReceipt)
        .mockRejectedValueOnce({ code: 4001 })
        .mockResolvedValueOnce({ status: 'success' } as any);

      vi.mocked(wagmi.useConfig).mockReturnValue({} as any);

      const { result } = renderHook(() => useWrapEthToWeth(11155111));

      // First attempt - should fail with wallet rejection
      await result.current.wrap(BigInt(1000000000000000000));

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      // Second attempt - should succeed (not blocked by "in progress")
      await result.current.wrap(BigInt(2000000000000000000));

      // Verify the second writeContractAsync was called
      expect(mockWriteContractAsync).toHaveBeenCalledTimes(2);
    });

    it('resets inFlightRef after wallet rejection', async () => {
      const mockWriteContractAsync = vi.fn()
        .mockRejectedValueOnce({ code: 4001 });
      
      vi.mocked(wagmi.useWriteContract).mockImplementation(() => ({
        writeContractAsync: mockWriteContractAsync,
      } as any));

      vi.mocked(wagmiCore.waitForTransactionReceipt)
        .mockRejectedValueOnce({ code: 4001 });

      vi.mocked(wagmi.useConfig).mockReturnValue({} as any);

      const { result } = renderHook(() => useWrapEthToWeth(11155111));

      // First attempt fails
      await result.current.wrap(BigInt(1000000000000000000));

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      // Verify inFlightRef is reset (can make another call)
      const { toast } = await import('sonner');
      
      // The second call should attempt to execute, not show "in progress" message
      await result.current.wrap(BigInt(2000000000000000000));
      
      expect(toast.info).not.toHaveBeenCalledWith(expect.stringContaining('already in progress'));
    });
  });

  describe('Unsupported chain', () => {
    it('sets status to error for unsupported chain', async () => {
      const { result } = renderHook(() => useWrapEthToWeth(1)); // Chain 1 not supported

      await result.current.wrap(BigInt(1000000000000000000));

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });

  describe('Invalid amount', () => {
    it('sets status to error for zero amount', async () => {
      const { result } = renderHook(() => useWrapEthToWeth(11155111));

      await result.current.wrap(BigInt(0));

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });

    it('sets status to error for negative amount', async () => {
      const { result } = renderHook(() => useWrapEthToWeth(11155111));

      await result.current.wrap(BigInt(-1));

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });
});