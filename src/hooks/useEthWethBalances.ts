import { useBalance } from 'wagmi';
import { getWethConfig } from '@/lib/weth';

export function useEthWethBalances({ chainId, address, enabled }: { chainId: number; address?: `0x${string}`; enabled?: boolean }) {
  let wethAddress: `0x${string}` | undefined;
  try {
    const weth = getWethConfig(chainId);
    wethAddress = weth.address;
  } catch (e) {
    // Unsupported chain, wethAddress remains undefined
  }

  const eth = useBalance({ 
    address, 
    chainId,
    query: {
      enabled: enabled && !!address,
    }
  });
  
  const wethBal = useBalance({ 
    address, 
    token: wethAddress, 
    chainId,
    query: {
      enabled: enabled && !!address && !!wethAddress,
    }
  });

  return {
    ethBalance: eth.data?.value ?? BigInt(0),
    wethBalance: wethBal.data?.value ?? BigInt(0),
    isLoading: eth.isLoading || wethBal.isLoading,
    error: eth.error ?? wethBal.error ?? null,
    refetch: async () => {
      await Promise.all([eth.refetch(), wethBal.refetch()]);
    }
  };
}
