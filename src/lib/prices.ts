import { ethers } from 'ethers';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';
import { Address } from 'viem';
import { logger } from './logger';

// Type definitions
interface WalletClient {
  transport: {
    request: (params: { method: string; params?: unknown[] }) => Promise<unknown>;
  };
}

interface ContractError extends Error {
  reason?: string;
  code?: string;
  data?: unknown;
}

export async function getCurrentPrice(
  walletClient: WalletClient,
  vaultId: Address
): Promise<number>  {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();

    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

    // Get current price directly from contract
    const rawPrice: bigint = await poolContract.getCurrentPrice();
    // rawPrice is uint256 with 18 decimals from contract
    return Number(ethers.formatUnits(rawPrice, 18));
  } catch (err) {
    const contractError = err as ContractError;
    logger.error('Error in getCurrentPrice:', undefined, {
      message: contractError.message,
      reason: contractError.reason,
      code: contractError.code,
      data: contractError.data
    });

    if (contractError.code === 'CALL_EXCEPTION') {
      throw new Error('Contract call failed - check oracle configuration');
    }

    throw new Error(contractError.reason || contractError.message || 'Failed to fetch current price');
  }
}
