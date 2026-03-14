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
      setStatus('error');
      toast.error("WETH wrapping not supported on this chain");
      return;
    }

    if (amountWei <= BigInt(0)) {
      setStatus('error');
      toast.error("Amount must be greater than zero");
      return;
    }

    if (status === 'pending') {
      toast.info("A wrapping transaction is already in progress");
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

      const receipt = await waitForTransactionReceipt(config, { hash, chainId });
      if (receipt.status !== 'success') {
        throw new Error('Wrap transaction reverted');
      }

      setStatus('success');
      toast.success("Successfully wrapped ETH to WETH");
      try {
        onSuccess?.();
      } catch (callbackError) {
        logger.error('wrap-eth-to-weth-success-callback-failed', callbackError instanceof Error ? callbackError : undefined);
      }
    } catch (e) {
      setStatus('error');
      logger.error('wrap-eth-to-weth-failed', e instanceof Error ? e : undefined);
      
      let errorMessage = "Failed to wrap ETH";
      if ((e as { code?: number })?.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (e instanceof Error) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("user rejected") || lowerMessage.includes("rejected transaction")) {
          errorMessage = "Transaction rejected by user";
        } else if (lowerMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds";
        } else if (lowerMessage.includes("revert")) {
          errorMessage = "Transaction failed on-chain";
        }
      }
      toast.error(errorMessage);
    } finally {
      if (loadingToast !== undefined) {
        toast.dismiss(loadingToast);
      }
    }
  }

  return { wrap, status };
}
