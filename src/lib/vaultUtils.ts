import { ethers } from 'ethers';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';
import { Address } from 'viem';
import { logger } from './logger';

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

interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  gasUsed: bigint;
  status: number;
  [key: string]: unknown;
}

/**
 * Fetches the current live price from Chainlink oracle
 */
export async function getCurrentPrice(
  walletClient: WalletClient,
  vaultId: Address,
): Promise<number> {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();

    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);
    const currentPrice: bigint = await poolContract.getCurrentPrice();
    return Number(ethers.formatUnits(currentPrice, 18));
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

/**
 * Fetches the stored previous price from the contract
 */
export async function getPreviousPrice(
  walletClient: WalletClient,
  vaultId: Address,
): Promise<number> {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();

    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);
    const rawPrice: bigint = await poolContract.previousPrice();
    return Number(ethers.formatUnits(rawPrice, 18));
  } catch (err) {
    const contractError = err as ContractError;
    logger.error('Error in getPreviousPrice:', undefined, {
      message: contractError.message,
      reason: contractError.reason,
      code: contractError.code,
      data: contractError.data
    });

    throw new Error(contractError.reason || contractError.message || 'Failed to fetch previous price');
  }
}

/**
 * Fetches both current and previous prices in a single call
 */
export async function getBothPrices(
  walletClient: WalletClient,
  vaultId: Address,
): Promise<{ currentPrice: number; previousPrice: number }> {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

    const [currentPrice, previousPrice] = await Promise.all([
      poolContract.getCurrentPrice(),
      poolContract.previousPrice()
    ]);

    return {
      currentPrice: Number(ethers.formatUnits(currentPrice, 18)),
      previousPrice: Number(ethers.formatUnits(previousPrice, 18))
    };
  } catch (err) {
    logger.error('Error in getBothPrices:', err instanceof Error ? err : undefined);
    throw new Error('Failed to fetch price data');
  }
}


export async function rebalancePool(
  walletClient: WalletClient,
  vaultId: Address,
): Promise<TransactionReceipt> {
  const provider = new ethers.BrowserProvider(walletClient.transport);
  const signer = await provider.getSigner();

  const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

  // Estimate gas with buffer
  const gasEstimate: bigint = await poolContract.rebalance.estimateGas();
  const gasWithBuffer = gasEstimate + gasEstimate / BigInt(5); // 20% buffer

  const tx = await poolContract.rebalance({
    gasLimit: gasWithBuffer,
  });

  const receipt = await tx.wait();
  return receipt as TransactionReceipt;
}

/**
 * Fetches the oracle address from the pool contract.
 */
export async function getOracleInfo(
  walletClient: WalletClient,
  vaultId: Address,
): Promise<{ oracleAddress: Address }> {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, provider);

    const oracleAddress = await poolContract.oracle();

    return {
      oracleAddress: oracleAddress as Address,
    };
  } catch (err) {
    const contractError = err as ContractError;
    logger.error('Error in getOracleInfo:', undefined, {
      message: contractError.message,
      reason: contractError.reason,
      code: contractError.code,
      data: contractError.data,
    });
    throw new Error(contractError.reason || contractError.message || 'Failed to fetch oracle info');
  }
}

/**
 * Updates the oracle address on the PredictionPool contract.
 * This is an owner-only function.
 */
export async function updateOracle(
  walletClient: WalletClient,
  vaultId: Address,
  newOracleAddress: Address,
): Promise<TransactionReceipt> {
  const provider = new ethers.BrowserProvider(walletClient.transport);
  const signer = await provider.getSigner();

  const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

  // Estimate gas for the transaction
  const gasEstimate: bigint = await poolContract.updateOracle.estimateGas(newOracleAddress);
  const gasWithBuffer = gasEstimate + gasEstimate / BigInt(5); // 20% buffer

  const tx = await poolContract.updateOracle(newOracleAddress, {
    gasLimit: gasWithBuffer,
  });

  const receipt = await tx.wait();
  return receipt as TransactionReceipt;
}

/**
 * Gets pool statistics including reserves, total value, and prices
 */
export async function getPoolStats(
  walletClient: WalletClient,
  vaultId: Address,
): Promise<{
  bullReserves: number;
  bearReserves: number;
  totalReserves: number;
  currentPrice: number;
  lastPrice: number;
}> {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, provider);

    const stats = await poolContract.getPoolStats();
    
    return {
      bullReserves: Number(ethers.formatUnits(stats[0], 18)),
      bearReserves: Number(ethers.formatUnits(stats[1], 18)),
      totalReserves: Number(ethers.formatUnits(stats[2], 18)),
      currentPrice: Number(ethers.formatUnits(stats[3], 18)),
      lastPrice: Number(ethers.formatUnits(stats[4], 18)),
    };
  } catch (err) {
    const contractError = err as ContractError;
    logger.error('Error in getPoolStats:', undefined, {
      message: contractError.message,
      reason: contractError.reason,
      code: contractError.code,
      data: contractError.data,
    });
    throw new Error(contractError.reason || contractError.message || 'Failed to fetch pool stats');
  }
}

/**
 * Checks if the pool has been initialized
 */
export async function isPoolInitialized(
  walletClient: WalletClient,
  vaultId: Address,
): Promise<boolean> {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, provider);

    const initialized: boolean = await poolContract.initialized();
    return initialized;
  } catch (err) {
    const contractError = err as ContractError;
    logger.error('Error in isPoolInitialized:', undefined, {
      message: contractError.message,
      reason: contractError.reason,
      code: contractError.code,
      data: contractError.data,
    });
    throw new Error(contractError.reason || contractError.message || 'Failed to check initialization status');
  }
}

/**
 * Initializes a pool with initial deposit
 * This should be called by the pool creator after pool creation
 */
export async function initializePool(
  walletClient: WalletClient,
  vaultId: Address,
  initialDeposit: bigint,
): Promise<TransactionReceipt> {
  const provider = new ethers.BrowserProvider(walletClient.transport);
  const signer = await provider.getSigner();

  const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

  // Estimate gas for the transaction
  const gasEstimate: bigint = await poolContract.initialize.estimateGas(initialDeposit);
  const gasWithBuffer = gasEstimate + gasEstimate / BigInt(5); // 20% buffer

  const tx = await poolContract.initialize(initialDeposit, {
    gasLimit: gasWithBuffer,
  });

  const receipt = await tx.wait();
  return receipt as TransactionReceipt;
}