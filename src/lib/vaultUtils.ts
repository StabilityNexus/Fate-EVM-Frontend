import { ethers } from 'ethers';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';
import { Address } from 'viem';

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
    console.error('Error in getCurrentPrice:', {
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
    console.error('Error in getPreviousPrice:', {
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
    console.error('Error in getBothPrices:', err);
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
    console.error('Error in getOracleInfo:', {
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