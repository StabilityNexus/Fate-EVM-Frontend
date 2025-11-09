import { Address, createPublicClient, http, Log } from "viem";
import { getChainConfig } from "@/utils/chainConfig";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { FatePoolFactories } from "@/utils/addresses";
import { Transaction, TransactionType } from "./types";
import { logger } from "./logger";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const MAX_TRANSACTIONS_TO_FETCH = 10;

async function getPools(publicClient: any, factoryAddress: Address): Promise<Address[]> {
  try {
    const poolAddresses = await publicClient.readContract({
      address: factoryAddress,
      abi: PredictionPoolFactoryABI,
      functionName: 'getAllPools',
    });
    return (poolAddresses as Address[]).filter(addr => addr !== ZERO_ADDRESS);
  } catch (error) {
    logger.logError("Failed to get pools from factory", error, { factoryAddress });
    return [];
  }
}

async function getTransactionLogs(publicClient: any, poolAddress: Address, userAddress: Address): Promise<Log[]> {
  try {
    const [mintLogs, burnLogs] = await Promise.all([
      publicClient.getLogs({
        address: poolAddress,
        event: PredictionPoolABI.find((item: any) => item.name === "Mint"),
        args: { user: userAddress },
        fromBlock: "earliest",
        toBlock: "latest",
      }),
      publicClient.getLogs({
        address: poolAddress,
        event: PredictionPoolABI.find((item: any) => item.name === "Burn"),
        args: { user: userAddress },
        fromBlock: "earliest",
        toBlock: "latest",
      }),
    ]);
    return [...mintLogs, ...burnLogs];
  } catch (error) {
    logger.logError("Failed to get transaction logs for pool", error, { poolAddress, userAddress });
    return [];
  }
}

export async function fetchRecentTransactions(userAddress: Address, chainId: number): Promise<Transaction[]> {
  const chainConfig = getChainConfig(chainId);
  if (!chainConfig) {
    logger.error(`Unsupported chainId: ${chainId}`);
    return [];
  }

  const publicClient = createPublicClient({
    chain: chainConfig.chain,
    transport: http(),
  });

  const factoryAddress = FatePoolFactories[chainId as keyof typeof FatePoolFactories];
  if (!factoryAddress || factoryAddress === ZERO_ADDRESS) {
    logger.error(`No factory address for chainId: ${chainId}`);
    return [];
  }

  const poolAddresses = await getPools(publicClient, factoryAddress);
  if (poolAddresses.length === 0) {
    return [];
  }

  const allLogs = (await Promise.all(
    poolAddresses.map(poolAddress => getTransactionLogs(publicClient, poolAddress, userAddress))
  )).flat();

  // Sort logs to find the most recent ones
  allLogs.sort((a, b) => {
    if (b.blockNumber === a.blockNumber) {
      return Number(b.logIndex) - Number(a.logIndex);
    }
    return Number(b.blockNumber) - Number(a.blockNumber);
  });

  const recentLogs = allLogs.slice(0, MAX_TRANSACTIONS_TO_FETCH);

  if (recentLogs.length === 0) {
      return [];
  }

  const transactions: Omit<Transaction, 'timestamp'>[] = recentLogs.map((log: any) => {
    const isMint = log.eventName.toLowerCase() === 'mint';
    return {
      hash: log.transactionHash,
      userAddress,
      poolId: log.address,
      type: isMint ? TransactionType.Buy : TransactionType.Sell,
      baseTokenAmount: log.args.baseTokens,
      bullTokenAmount: isMint ? log.args.poolTokens : BigInt(0),
      bearTokenAmount: !isMint ? log.args.poolTokens : BigInt(0),
      price: 0, // Placeholder for price
    };
  });

  // Fetch timestamps for each transaction
  const transactionsWithTimestamps = await Promise.all(
    transactions.map(async (tx) => {
      try {
        const block = await publicClient.getBlock({ blockHash: tx.hash as Address });
        return { ...tx, timestamp: Number(block.timestamp) * 1000 };
      } catch (error) {
        logger.logError("Failed to get block timestamp", error, { transactionHash: tx.hash });
        return { ...tx, timestamp: Date.now() }; // Fallback to current time
      }
    })
  );

  return transactionsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);
}