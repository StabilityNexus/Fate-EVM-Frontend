import { useCallback } from 'react';
import { useWalletConnection } from './useWalletConnection';
import { logWalletEvent, WalletEvent } from '../lib/walletLogger';
import { toast } from 'sonner';

export function useExecutionGuard() {
  const { isConnected, networkState } = useWalletConnection();

  const guardExecution = useCallback(
    async <T,>(fn: () => Promise<T> | T): Promise<T | void> => {
      if (!isConnected) {
        toast.error('Please connect your wallet first.');
        return;
      }

      if (networkState === 'CONNECTED_UNSUPPORTED') {
        logWalletEvent(WalletEvent.CHAIN_UNSUPPORTED, {
          message: 'Execution blocked: Unsupported chain',
        });
        toast.error('Switch to a supported network before continuing');
        return;
      }

      if (networkState === 'CONNECTED_UNKNOWN') {
        logWalletEvent(WalletEvent.CHAIN_UNKNOWN, {
          message: 'Execution blocked: Unknown chain',
        });
        toast.error('Unknown network detected. Please switch network');
        return;
      }

      try {
        const result = await fn();
        return result;
      } catch (error) {
        // Swallow instead of rethrowing, since we want to avoid uncaught promise rejections
        // and let inner functions handle their own toast notifications.
        return undefined;
      }
    },
    [isConnected, networkState]
  );

  return { guardExecution };
}
