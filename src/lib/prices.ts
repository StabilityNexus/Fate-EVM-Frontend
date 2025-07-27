import { ethers } from 'ethers';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';

const BTC_USD_PRICE_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
const PYTH_HERMES_ENDPOINT = 'https://hermes.pyth.network';

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

interface PythError extends Error {
  response?: {
    data?: unknown;
  };
  stack?: string;
}

interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  gasUsed: bigint;
  status: number;
  [key: string]: unknown;
}

export async function fetchPythPriceUpdateData(): Promise<string[]> {
  try {
    const connection = new EvmPriceServiceConnection(PYTH_HERMES_ENDPOINT);
    const priceFeeds = await connection.getPriceFeedsUpdateData([BTC_USD_PRICE_ID]);

    console.log('✅ Received price update data:', {
      length: priceFeeds.length,
      preview: priceFeeds[0]?.slice(0, 20) + '...'
    });

    if (!priceFeeds || priceFeeds.length === 0) {
      throw new Error('No price update data received from Pyth');
    }

    return priceFeeds;
  } catch (err) {
    const pythError = err as PythError;
    console.error('❌ Pyth fetch error:', {
      message: pythError.message,
      stack: pythError.stack,
      response: pythError.response?.data
    });
    throw new Error('Failed to fetch price update data from Pyth: ' + pythError.message);
  }
}

export async function getCurrentPrice(walletClient: WalletClient, vaultId: string): Promise<number> {
  try {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();

    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

    // 1. Try getting current price (no args now)
    try {
      const rawPrice: bigint = await poolContract.getCurrentPrice();
      // rawPrice is uint256 with 18 decimals from contract
      return Number(ethers.formatUnits(rawPrice, 18));
    } catch (initialPriceError) {
      console.warn('⚠️ Initial fetch failed. Likely no price pushed yet.', initialPriceError);
    }

    // 2. Fetch price update data
    const priceUpdateData = await fetchPythPriceUpdateData();

    // 3. Query update fee
    const PYTH_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_PYTH_ORACLE_ADDRESS!;
    const pythOracleABI = [
      "function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount)"
    ];
    const pythOracleContract = new ethers.Contract(
      PYTH_ORACLE_ADDRESS,
      pythOracleABI,
      signer
    );

    const updateFee: bigint = await pythOracleContract.getUpdateFee(priceUpdateData);

    const feeWithBuffer = updateFee + (updateFee / BigInt(10));

    // 4. Estimate gas
    try {
      console.log('⛽ Estimating gas for updatePriceAndDistributeOutcome...');
      const gasEstimate: bigint = await poolContract.updatePriceAndDistributeOutcome.estimateGas(
        priceUpdateData,
        { value: feeWithBuffer }
      );
      const gasWithBuffer = gasEstimate + (gasEstimate / BigInt(5));

      // 5. Send transaction
      const tx = await poolContract.updatePriceAndDistributeOutcome(
        priceUpdateData,
        {
          value: feeWithBuffer,
          gasLimit: gasWithBuffer
        }
      );
      await tx.wait();
      console.log('✅ Transaction confirmed.');
    } catch (txError) {
      const contractError = txError as ContractError;
      console.error('❌ Transaction error during updatePriceAndDistributeOutcome:', {
        message: contractError.message,
        reason: contractError.reason,
        code: contractError.code,
        data: contractError.data
      });
      throw new Error(`Failed to update price: ${contractError.reason || contractError.message}`);
    }

    // 6. Try fetching again (no args)
    const updatedPrice: bigint = await poolContract.getCurrentPrice();

    return Number(ethers.formatUnits(updatedPrice, 18));

  } catch (err) {
    const contractError = err as ContractError;
    console.error('❌ Final error in getCurrentPrice:', {
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
 * Calls updatePriceAndDistributeOutcome on the pool contract,
 * handling fetching price data, fees, gas estimation, and sending tx.
 * Returns the transaction receipt.
 */
export async function updatePriceAndDistribute(walletClient: WalletClient, vaultId: string): Promise<TransactionReceipt> {
  const provider = new ethers.BrowserProvider(walletClient.transport);
  const signer = await provider.getSigner();

  const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

  const priceUpdateData = await fetchPythPriceUpdateData();

  // Get update fee from PYTH oracle contract (not pool contract)
  const PYTH_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_PYTH_ORACLE_ADDRESS!;
  const pythOracleABI = [
    "function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount)"
  ];
  const pythOracleContract = new ethers.Contract(
    PYTH_ORACLE_ADDRESS,
    pythOracleABI,
    signer
  );

  const updateFee: bigint = await pythOracleContract.getUpdateFee(priceUpdateData);

  const feeWithBuffer = updateFee + updateFee / BigInt(10); // 10% buffer

  // Estimate gas
  const gasEstimate: bigint = await poolContract.updatePriceAndDistributeOutcome.estimateGas(
    priceUpdateData,
    { value: feeWithBuffer }
  );
  const gasWithBuffer = gasEstimate + gasEstimate / BigInt(5); // 20% buffer

  // Send transaction
  const tx = await poolContract.updatePriceAndDistributeOutcome(priceUpdateData, {
    value: feeWithBuffer,
    gasLimit: gasWithBuffer,
  });

  const receipt = await tx.wait();

  return receipt as TransactionReceipt;
}