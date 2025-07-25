import { ethers } from 'ethers';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';

const BTC_USD_PRICE_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
const PYTH_HERMES_ENDPOINT = 'https://hermes.pyth.network';

export async function fetchPythPriceUpdateData(): Promise<string[]> {
  try {
    console.log(`📡 Fetching price updates for ID: ${BTC_USD_PRICE_ID}`);
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
  } catch (err: any) {
    console.error('❌ Pyth fetch error:', {
      message: err.message,
      stack: err.stack,
      response: err.response?.data
    });
    throw new Error('Failed to fetch price update data from Pyth: ' + err.message);
  }
}

export async function getCurrentPrice(walletClient: any, vaultId: string): Promise<number> {
  try {
    console.log('🔌 Connecting to provider...');
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    console.log('🔑 Signer address:', await signer.getAddress());

    const poolContract = new ethers.Contract(vaultId, PredictionPoolABI, signer);

    // 1. Try getting current price (no args now)
    try {
      console.log('🔍 Trying to fetch current price directly...');
      const rawPrice: bigint = await poolContract.getCurrentPrice();
      console.log('✅ Fetched price directly:', rawPrice.toString());
      // rawPrice is uint256 with 18 decimals from contract
      return Number(ethers.formatUnits(rawPrice, 18));
    } catch (initialPriceError) {
      console.warn('⚠️ Initial fetch failed. Likely no price pushed yet.');
      console.warn('Attempting fallback flow with updatePriceAndDistributeOutcome...');
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

    console.log('💰 Querying update fee...');
    const updateFee: bigint = await pythOracleContract.getUpdateFee(priceUpdateData);
    console.log('💸 Required fee:', updateFee.toString());

    const feeWithBuffer = updateFee + (updateFee / BigInt(10)); // 10% buffer
    console.log('🧮 Fee with buffer:', feeWithBuffer.toString());

    // 4. Estimate gas
    try {
      console.log('⛽ Estimating gas for updatePriceAndDistributeOutcome...');
      const gasEstimate: bigint = await poolContract.updatePriceAndDistributeOutcome.estimateGas(
        priceUpdateData,
        { value: feeWithBuffer }
      );
      const gasWithBuffer = gasEstimate + (gasEstimate / BigInt(5)); // 20% gas buffer
      console.log('📐 Gas estimate:', gasEstimate.toString());
      console.log('📈 Gas with buffer:', gasWithBuffer.toString());

      // 5. Send transaction
      console.log('🚀 Sending transaction...');
      const tx = await poolContract.updatePriceAndDistributeOutcome(
        priceUpdateData,
        {
          value: feeWithBuffer,
          gasLimit: gasWithBuffer
        }
      );

      console.log('📦 Transaction sent. Hash:', tx.hash);
      await tx.wait();
      console.log('✅ Transaction confirmed.');
    } catch (txError: any) {
      console.error('❌ Transaction error during updatePriceAndDistributeOutcome:', {
        message: txError.message,
        reason: txError.reason,
        code: txError.code,
        data: txError.data
      });
      throw new Error(`Failed to update price: ${txError.reason || txError.message}`);
    }

    // 6. Try fetching again (no args)
    console.log('🔁 Re-fetching current price after update...');
    const updatedPrice: bigint = await poolContract.getCurrentPrice();
    console.log('🎯 Updated price:', updatedPrice.toString());

    return Number(ethers.formatUnits(updatedPrice, 18));

  } catch (err: any) {
    console.error('❌ Final error in getCurrentPrice:', {
      message: err.message,
      reason: err.reason,
      code: err.code,
      data: err.data
    });

    if (err.code === 'CALL_EXCEPTION') {
      throw new Error('Contract call failed - check oracle configuration');
    }

    throw new Error(err.reason || err.message || 'Failed to fetch current price');
  }
}

/**
 * Calls updatePriceAndDistributeOutcome on the pool contract,
 * handling fetching price data, fees, gas estimation, and sending tx.
 * Returns the transaction receipt.
 */
export async function updatePriceAndDistribute(walletClient: any, vaultId: string) {
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

  console.log('💰 Querying update fee...');
  const updateFee: bigint = await pythOracleContract.getUpdateFee(priceUpdateData);
  console.log('💸 Required fee:', updateFee.toString());

  const feeWithBuffer = updateFee + updateFee / BigInt(10); // 10% buffer

  // Estimate gas
  console.log('⛽ Estimating gas for updatePriceAndDistributeOutcome...');
  const gasEstimate: bigint = await poolContract.updatePriceAndDistributeOutcome.estimateGas(
    priceUpdateData,
    { value: feeWithBuffer }
  );
  const gasWithBuffer = gasEstimate + gasEstimate / BigInt(5); // 20% buffer

  // Send transaction
  console.log('🚀 Sending transaction...');
  const tx = await poolContract.updatePriceAndDistributeOutcome(priceUpdateData, {
    value: feeWithBuffer,
    gasLimit: gasWithBuffer,
  });

  console.log('📦 Transaction sent. Hash:', tx.hash);
  const receipt = await tx.wait();
  console.log('✅ Transaction confirmed.');

  return receipt;
}
