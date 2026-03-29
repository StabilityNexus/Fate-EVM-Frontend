import { useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { logWalletEvent, WalletEvent } from '@/lib/walletLogger';
import { getChainMeta, isSupportedChain } from '@/lib/chains';
import { config } from '../utils/wagmiConfig';

export function useChainChangeWatcher() {
  const { isConnected } = useAccount();
  const rawChainId = useChainId();
  
  const lastEventRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!isConnected || typeof window === 'undefined') return;

    let parsedChainId: number | null = null;
    if (typeof rawChainId === 'number') {
      parsedChainId = rawChainId;
    } else if (typeof rawChainId === 'string') {
      const val = rawChainId as string;
      parsedChainId = val.startsWith('0x') ? parseInt(val, 16) : parseInt(val, 10);
    }

    if (parsedChainId === null || isNaN(parsedChainId)) return;

    if (lastEventRef.current === parsedChainId) {
      const now = Date.now();
      if (now - lastTimestampRef.current < 500) {
        return;
      }
    }

    lastEventRef.current = parsedChainId;
    lastTimestampRef.current = Date.now();

    const meta = getChainMeta(parsedChainId);
    const isSupported = isSupportedChain(parsedChainId);

    logWalletEvent(WalletEvent.CHAIN_CHANGED_WALLET, { chainId: parsedChainId });

    let classified = false;

    if (meta === null) {
      logWalletEvent(WalletEvent.CHAIN_UNKNOWN, {
        chainId: parsedChainId,
      });
      classified = true;
    }

    if (!classified && !isSupported) {
      logWalletEvent(WalletEvent.CHAIN_UNSUPPORTED, {
        chainId: parsedChainId,
        chainName: meta?.name ?? 'Unknown',
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      if (meta === null && config.chains.some(c => c.id === parsedChainId)) {
        console.error(
          "[WALLET][INVARIANT_BROKEN] Supported chain missing metadata",
          { chainId: parsedChainId }
        );
      }

      if (meta !== null && typeof meta.id !== "number") {
        console.error(
          "[WALLET][INVARIANT_BROKEN] Invalid ChainMeta structure",
          meta
        );
      }
    }
  }, [isConnected, rawChainId]);
}
