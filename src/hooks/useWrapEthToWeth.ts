import { useState } from 'react';
import { useWriteContract, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { getWethConfig, WETH_ABI } from '@/lib/weth';
import { logger } from "@/lib/logger";
import { toast } from 'sonner';

export function useWrapEthToWeth(chainId: number, onSuccess?: () => void) {
  let wethAddress: `0x${string}` | undefined;
  try {
    const weth = getWethConfig(chainId);
    wethAddress = weth.address;
  } catch (e) {
    // Supported chain is optional
  }

  const { writeContractAsync } = useWriteContract();
  const config = useConfig();
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  async function wrap(amountWei: bigint) {
    if (!wethAddress) {
      toast.error("WETH wrapping not supported on this chain");
      return;
    }

    setStatus('pending');
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading("Confirm wrapping in wallet...");
      const hash = await writeContractAsync({
        address: wethAddress,
        abi: WETH_ABI,
        functionName: 'deposit',
        value: amountWei,
      });

      toast.dismiss(loadingToast);
      loadingToast = toast.loading("Wrapping ETH to WETH...");

      await waitForTransactionReceipt(config, { hash, chainId });

      setStatus('success');
      toast.success("Successfully wrapped ETH to WETH");
      onSuccess?.();
    } catch (e) {
      setStatus('error');
      logger.error('wrap-eth-to-weth-failed', e instanceof Error ? e : undefined);
      toast.error("Failed to wrap ETH");
      throw e;
    } finally {
      if (loadingToast !== undefined) {
        toast.dismiss(loadingToast);
      }
    }
  }

  return { wrap, status };
}
