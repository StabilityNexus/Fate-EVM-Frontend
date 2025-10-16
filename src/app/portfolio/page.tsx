/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PieChartIcon,
  BarChart3,
  Wallet,
  Activity,
  DollarSign,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits, Address, isAddress } from "viem";
import { useRouter } from "next/navigation";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { FatePoolFactories } from "@/utils/addresses";
import { getChainConfig } from "@/utils/chainConfig";
import { getPriceFeedName } from "@/utils/supportedChainFeed";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { ChainlinkOracleABI } from "@/utils/abi/ChainlinkOracle";
import { ERC20ABI } from "@/utils/abi/ERC20";
import { createPublicClient, http } from "viem";

// Helper function to get chain name
const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 1: return 'Ethereum Mainnet';
    case 137: return 'Polygon';
    case 56: return 'BSC';
    case 8453: return 'Base';
    case 61: return 'Ethereum Classic';
    case 11155111: return 'Sepolia Testnet';
    default: return `Chain ${chainId}`;
  }
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const CHART_COLORS = [
  "#fff44f", // bright lemon yellow
  "#ffec1a", // vivid sunshine yellow
  "#ffd60a", // rich golden yellow
  "#ffca0a", // warm bright gold
  "#ffb703", // sunflower yellow
  "#f59e0b", // amber yellow
];

const BEAR_COLORS = [
  "#e5e7eb", // gray-200
  "#d1d5db", // gray-300
  "#9ca3af", // gray-400
  "#6b7280", // gray-500
];

const BULL_COLORS = [
  "#4b5563", // gray-600
  "#374151", // gray-700
  "#1f2937", // gray-800
  "#111827", // gray-900
  "#0f172a", // slate-950
  "#000000", // pure black
];

// Safe number utility
const safeNumber = (value: any, fallback = 0): number => {
  const num = Number(value);
  return isFinite(num) && !isNaN(num) ? num : fallback;
};


// Enhanced token metrics calculation with maximum accuracy using all available data
const calculateTokenMetricsWithEvents = async (
  reserve: number,
  supply: number,
  userTokens: number,
  tokenAddress: string,
  userAddress: string,
  chainId: number,
) => {
  const currentPrice = safeNumber(supply > 0 ? reserve / supply : 0);
  const currentValue = userTokens * currentPrice;

  try {
    // Get detailed transactions from events (both Buy/Sell and DetailedBuy/DetailedSell)
    const transactions = await fetchUserTransactions(tokenAddress, userAddress, chainId);
    
    if (transactions.length === 0) {
      // Fallback to current price if no transactions found
      const costBasis = userTokens * currentPrice;
      return {
        price: currentPrice,
        currentValue,
        costBasis,
        pnL: 0,
        returns: 0,
        totalFeesPaid: 0,
        netInvestment: 0,
        grossInvestment: 0
      };
    }

    // Correct FIFO-based P&L calculation - fees are transaction costs, not investment losses
    let totalCostBasis = 0;
    let totalFeesPaid = 0;
    let realizedPnL = 0;
    let grossInvestment = 0;
    const buyQueue: Array<{ 
      amount: number;              // remaining tokens
      initialAmount: number;       // original tokens bought
      price: number;
      fees: number;
      grossAmount: number;         // investment incl. fees
      netAmount: number;           // investment excl. fees
      timestamp: number;
      blockNumber: number;
    }> = [];

    console.debug(`Starting correct FIFO calculation for ${userTokens} current tokens`);

    // Process transactions chronologically
    const sortedTxns = transactions.sort((a: any, b: any) => Number(a.blockNumber) - Number(b.blockNumber));
    
    for (const tx of sortedTxns) {
      if (tx.type === 'buy') {
        // CORRECTED: Track net investment (excluding fees) as cost basis
        const feePaid = (tx as any).feePaid || 0;
        const netInvestment = tx.amountAsset - feePaid; // Actual investment amount
        
        grossInvestment += tx.amountAsset; // Total paid (including fees)
        totalFeesPaid += feePaid;
        totalCostBasis += netInvestment; // Net investment (excluding fees)
        
        buyQueue.push({ 
          amount: tx.amountCoin,
          initialAmount: tx.amountCoin,
          price: tx.price,
          fees: feePaid,
          grossAmount: tx.amountAsset,
          netAmount: netInvestment, // Add net amount for correct cost basis
          timestamp: (tx as any).timestamp || 0,
          blockNumber: Number(tx.blockNumber)
        });
        
        console.debug(`Buy: ${tx.amountCoin} tokens @ ${tx.price} WETH/token, Net invested: ${netInvestment} WETH (fees: ${feePaid} WETH)`, {
          amountCoin: tx.amountCoin,
          price: tx.price,
          netInvestment,
          feePaid
        });
      } else if (tx.type === 'sell') {
        let remainingToSell = tx.amountCoin;
        const sellValue = tx.amountAsset;
        let costOfSold = 0;
        const feesOnThisSale = (tx as any).feePaid || 0;

        console.debug(`Sell: ${tx.amountCoin} tokens for ${tx.amountAsset} WETH, Fees: ${feesOnThisSale} WETH`, {
          amountCoin: tx.amountCoin,
          amountAsset: tx.amountAsset,
          fees: feesOnThisSale
        });

        // FIFO: Sell from oldest purchases first
        while (remainingToSell > 0 && buyQueue.length > 0) {
          const oldestBuy = buyQueue[0];
          const amountFromThisBuy = Math.min(remainingToSell, oldestBuy.amount);
          
          // CORRECTED: Use net amount (excluding fees) for cost basis calculation
          const costPerToken = oldestBuy.netAmount / oldestBuy.initialAmount;
          costOfSold += amountFromThisBuy * costPerToken;
          
          remainingToSell -= amountFromThisBuy;
          oldestBuy.amount -= amountFromThisBuy;
          
          console.debug(`FIFO: Sold ${amountFromThisBuy} @ ${costPerToken} WETH/token (net) = ${amountFromThisBuy * costPerToken} WETH cost`, {
            amountFromThisBuy,
            costPerToken,
            totalCost: amountFromThisBuy * costPerToken
          });
          
          if (oldestBuy.amount === 0) {
            buyQueue.shift();
          }
        }
        
        // Calculate realized P&L (sell value - gross cost basis)
        const thisSaleRealizedPnL = sellValue - costOfSold;
        realizedPnL += thisSaleRealizedPnL;
        totalFeesPaid += feesOnThisSale;
        
        console.debug(`Sale P&L: ${thisSaleRealizedPnL} WETH (${sellValue} received - ${costOfSold} net cost)`, {
          realizedPnL: thisSaleRealizedPnL,
          sellValue,
          costOfSold
        });
      }
    }

    // Calculate remaining cost basis for current holdings (using net amounts)
    const remainingCostBasis = buyQueue.reduce((sum, buy) => {
      const costPerToken = buy.netAmount / buy.initialAmount;
      return sum + buy.amount * costPerToken;
    }, 0);
    
    // Check if there were any sell transactions (not based on mutated queue)
    const hadSell = transactions.some((t: any) => t.type === 'sell');
    
    // Use totalCostBasis if no sells, otherwise remainingCostBasis
    const actualCostBasis = hadSell ? remainingCostBasis : totalCostBasis;
    
    const unrealizedPnL = currentValue - actualCostBasis;
    const totalPnL = realizedPnL + unrealizedPnL;
    const netInvestment = grossInvestment - totalFeesPaid;
    
    const returns = actualCostBasis > 0 ? (totalPnL / actualCostBasis) * 100 : 0;

    console.debug(`CORRECTED FIFO Results:`, {
      hadSell,
      grossInvestment,
      totalFeesPaid,
      netInvestment: grossInvestment - totalFeesPaid,
      totalCostBasis,
      remainingCostBasis,
      actualCostBasis,
      currentValue,
      realizedPnL,
      unrealizedPnL,
      totalPnL,
      returns,
      buyQueueLength: buyQueue.length
    });
    console.debug(`User tokens: ${userTokens}`);

    // For sold positions (userTokens = 0), return comprehensive data
    if (userTokens === 0) {
      console.debug(`Position fully sold - showing realized P&L only`);
      return {
        price: currentPrice,
        currentValue: 0,
        costBasis: totalCostBasis,
        pnL: realizedPnL,
        returns: totalCostBasis > 0 ? (realizedPnL / totalCostBasis) * 100 : 0,
        totalFeesPaid,
        netInvestment,
        grossInvestment
      };
    }

    return {
      price: currentPrice,
      currentValue,
      costBasis: actualCostBasis,
      pnL: totalPnL,
      returns,
      totalFeesPaid,
      netInvestment,
      grossInvestment
    };

  } catch (error) {
    console.error('Error calculating enhanced metrics with events:', error instanceof Error ? error : new Error(String(error)));
    // Fallback to simple calculation
    const costBasis = userTokens * currentPrice;
    return {
      price: currentPrice,
      currentValue,
      costBasis,
      pnL: 0,
      returns: 0,
      totalFeesPaid: 0,
      netInvestment: 0,
      grossInvestment: 0
    };
  }
};

// Fetch user transactions from blockchain events
const fetchUserTransactions = async (tokenAddress: string, userAddress: string, chainId: number) => {
  try {
    console.debug(`Fetching transactions for token: ${tokenAddress}, user: ${userAddress}, chain: ${chainId}`, {
      tokenAddress,
      userAddress,
      chainId
    });
    
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      console.warn('No chain config found for chainId:', { chainId });
      return [];
    }

    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http()
    });

    // Buy event ABI
    const buyEventABI = {
      type: 'event',
      name: 'Buy',
      inputs: [
        { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
        { name: 'to', type: 'address', indexed: true, internalType: 'address' },
        { name: 'amountAsset', type: 'uint256', indexed: false, internalType: 'uint256' },
        { name: 'amountCoin', type: 'uint256', indexed: false, internalType: 'uint256' },
        { name: 'feePaid', type: 'uint256', indexed: false, internalType: 'uint256' },
      ]
    } as const;

    // Sell event ABI
    const sellEventABI = {
      type: 'event',
      name: 'Sell',
      inputs: [
        { name: 'seller', type: 'address', indexed: true, internalType: 'address' },
        { name: 'amountAsset', type: 'uint256', indexed: false, internalType: 'uint256' },
        { name: 'amountCoin', type: 'uint256', indexed: false, internalType: 'uint256' },
        { name: 'feePaid', type: 'uint256', indexed: false, internalType: 'uint256' },
      ]
    } as const;

    console.debug('Fetching buy and sell events...');

    // Helper function to fetch logs in chunks to avoid RPC limits
    const fetchLogsInChunks = async (eventABI: any, args: any) => {
      const currentBlock = await publicClient.getBlockNumber();
      const chunkSize = BigInt(5000);
      const allLogs: any[] = [];
      const lookback = chainId === 11155111 ? BigInt(100000) : BigInt(50000);
      const startBlock = currentBlock > lookback ? currentBlock - lookback : BigInt(0);
      
      console.debug(`Scanning from block ${startBlock} to ${currentBlock} (${currentBlock - startBlock} blocks)`, {
        startBlock,
        currentBlock,
        blockRange: currentBlock - startBlock
      });
      
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += chunkSize) {
        const toBlock = fromBlock + chunkSize - BigInt(1) > currentBlock 
          ? currentBlock 
          : fromBlock + chunkSize - BigInt(1);
        
        try {
          const logs = await publicClient.getLogs({
            address: tokenAddress as Address,
            event: eventABI,
            args,
            fromBlock,
            toBlock
          });
          
          allLogs.push(...logs);
          if (logs.length > 0) {
            console.debug(`Fetched ${logs.length} logs from block ${fromBlock} to ${toBlock}`, {
              logCount: logs.length,
              fromBlock,
              toBlock
            });
          }
        } catch (error: any) {
          console.warn(`Failed to fetch logs from block ${fromBlock} to ${toBlock}`, {
            fromBlock,
            toBlock,
            error: error?.shortMessage || error?.message
          });
          
          // If we get a block range error, try with smaller chunks
          if (error?.message?.includes('range') || error?.message?.includes('blocks')) {
            console.debug('Retrying with smaller chunk size...');
            try {
              const smallerChunkSize = BigInt(1000);
              for (let smallFromBlock = fromBlock; smallFromBlock <= toBlock; smallFromBlock += smallerChunkSize) {
                const smallToBlock = smallFromBlock + smallerChunkSize - BigInt(1) > toBlock 
                  ? toBlock 
                  : smallFromBlock + smallerChunkSize - BigInt(1);
                
                const smallLogs = await publicClient.getLogs({
                  address: tokenAddress as Address,
                  event: eventABI,
                  args,
                  fromBlock: smallFromBlock,
                  toBlock: smallToBlock
                });
                
                allLogs.push(...smallLogs);
              }
            } catch {
              console.warn(`Retry also failed for block ${fromBlock} to ${toBlock}`, {
                fromBlock,
                toBlock
              });
            }
          }
        }
      }
      
      return allLogs;
    };

    // Fetch buy and sell events in parallel with chunking
    const [buyLogs, sellLogs] = await Promise.all([
      fetchLogsInChunks(buyEventABI, { buyer: userAddress as Address }),
      fetchLogsInChunks(sellEventABI, { seller: userAddress as Address })
    ]);

    console.debug(`Found ${buyLogs.length} buy events and ${sellLogs.length} sell events`, {
      buyEvents: buyLogs.length,
      sellEvents: sellLogs.length
    });

    const transactions: Array<{
      type: 'buy' | 'sell';
      blockNumber: bigint;
      amountAsset: number;
      amountCoin: number;
      price: number;
    }> = [];

    // Process buy events
    for (const log of buyLogs) {
      const amountAsset = Number(formatUnits(log.args.amountAsset!, 18));
      const amountCoin = Number(formatUnits(log.args.amountCoin!, 18));
      const price = amountCoin > 0 ? amountAsset / amountCoin : 0;
      
      console.debug(`BUY: ${amountCoin} tokens for ${amountAsset} WETH (price: ${price})`, {
        amountCoin,
        amountAsset,
        price
      });
      
      transactions.push({
        type: 'buy',
        blockNumber: log.blockNumber,
        amountAsset,
        amountCoin,
        price,
      });
    }

    // Process sell events
    for (const log of sellLogs) {
      const amountAsset = Number(formatUnits(log.args.amountAsset!, 18));
      const amountCoin = Number(formatUnits(log.args.amountCoin!, 18));
      const price = amountCoin > 0 ? amountAsset / amountCoin : 0;
      
      console.debug(`SELL: ${amountCoin} tokens for ${amountAsset} WETH (price: ${price})`, {
        amountCoin,
        amountAsset,
        price
      });
      
      transactions.push({
        type: 'sell',
        blockNumber: log.blockNumber,
        amountAsset,
        amountCoin,
        price,
      });
    }

    console.debug(`Total transactions processed: ${transactions.length}`, {
      transactionCount: transactions.length
    });
    return transactions;

  } catch (error) {
    console.error('Error fetching transactions:', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

// Legacy calculation for backup
const calculateTokenMetrics = (
  reserve: number,
  supply: number,
  userTokens: number,
  avgPrice: number
) => {
  const price = safeNumber(supply > 0 ? reserve / supply : 0);
  const currentValue = userTokens * price;
  const costBasis = userTokens * avgPrice;
  const pnL = currentValue - costBasis;
  const returns =
    userTokens === 0 || avgPrice === 0 ? 0 : (pnL / costBasis) * 100;

  return { price, currentValue, costBasis, pnL, returns };
};

interface PoolData {
  id: string;
  name: string;
  bullBalance: number;
  bearBalance: number;
  bullCurrentValue: number;
  bearCurrentValue: number;
  totalValue: number;
  totalCostBasis: number;
  bullPnL: number;
  bearPnL: number;
  totalPnL: number;
  bullPrice: number;
  bearPrice: number;
  bullAvgPrice: number;
  bearAvgPrice: number;
  bullReturns: number;
  bearReturns: number;
  totalReturnPercentage: number;
  color: string;
  bullColor: string;
  bearColor: string;
  hasPositions: boolean;
  hasBullPosition: boolean;
  hasBearPosition: boolean;
  bullReserve: number;
  bearReserve: number;
  bullSupply: number;
  bearSupply: number;
  chainId: number;
  priceFeed: string;
  // Additional smart contract data
  baseToken: string;
  bullTokenAddress: string;
  bearTokenAddress: string;
  bullTokenName: string;
  bearTokenName: string;
  bullTokenSymbol: string;
  bearTokenSymbol: string;
  oracleAddress: string;
  underlyingOracleAddress?: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  vaultCreator: string;
  fees: {
    mintFee: number;
    burnFee: number;
    creatorFee: number;
    treasuryFee: number;
  };
  baseTokenBalance: number;
  isCreator: boolean;
}

// Historical Investments Table Component
const HistoricalInvestmentsTable: React.FC<{
  historicalPools: PoolData[];
  userAddress?: string;
  chainId?: number;
}> = ({ historicalPools }) => {
  const [displayedItems, setDisplayedItems] = useState(5); // Show 5 items initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = async () => {
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setDisplayedItems(prev => prev + 5); // Load 5 more items
    setIsLoadingMore(false);
  };

  const hasMore = displayedItems < historicalPools.length;
  const displayedPools = historicalPools.slice(0, displayedItems);

  return (
    <Card className="border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Historical Investments
        </CardTitle>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Your past investment performance across all prediction pools
        </p>
      </CardHeader>
      <CardContent>
        {/* Simple Card Rows - Full Width */}
        <div className="space-y-3">
          {displayedPools.map((pool) => (
            <div
              key={pool.id}
              className="group relative overflow-hidden border border-neutral-200 dark:border-neutral-600 rounded-lg p-4 dark:bg-gradient-to-r dark:from-neutral-700/20 dark:to-neutral-800/20 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-yellow-300/50 dark:hover:border-yellow-500/30 hover:scale-[1.01]"
              onClick={() => window.open(`/pool?id=${pool.id}`, '_blank')}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative flex items-center justify-between">
                {/* Pool Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  <div>
                    <div className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                      {pool.name}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {pool.priceFeed} • Closed Position
                    </div>
                  </div>
                </div>

                {/* Investment & P&L */}
                <div className="flex items-center space-x-8">
                  {/* Amount Invested */}
                  <div className="text-right">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Amount Invested
                    </div>
                    <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {pool.totalCostBasis.toFixed(4)} WETH
                    </div>
                    {/* Omit stale USD conversion; show only base asset */}
                  </div>

                  {/* Total P&L */}
                  <div className="text-right">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Total P&L
                    </div>
                    <div className={`text-xl font-bold ${
                      pool.totalPnL >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {pool.totalPnL >= 0 ? '+' : ''}{pool.totalPnL.toFixed(4)} WETH
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <div className={`text-sm ${
                        pool.totalPnL >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {pool.totalReturnPercentage >= 0 ? '+' : ''}{pool.totalReturnPercentage.toFixed(1)}%
                      </div>
                      {pool.totalReturnPercentage >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="border-neutral-300 dark:border-neutral-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-all duration-200"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  Load More ({historicalPools.length - displayedItems} remaining)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-600">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Pools</div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {historicalPools.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Invested</div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {historicalPools.reduce((sum, pool) => sum + pool.totalCostBasis, 0).toFixed(4)} WETH
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Net P&L</div>
              <div className={`text-sm font-bold ${
                historicalPools.reduce((sum, pool) => sum + pool.totalPnL, 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {historicalPools.reduce((sum, pool) => sum + pool.totalPnL, 0) >= 0 ? '+' : ''}
                {historicalPools.reduce((sum, pool) => sum + pool.totalPnL, 0).toFixed(4)} WETH
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// History card component for showing past trades
const HistoryCard: React.FC<{ pool: PoolData }> = ({ pool }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {pool.name}
          </div>
          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
            {pool.priceFeed}
          </div>
          <div className="px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded text-xs text-orange-600 dark:text-orange-300">
            Closed
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${pool.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {pool.totalPnL >= 0 ? '+' : ''}{pool.totalPnL.toFixed(4)} WETH
          </div>
          <div className={`text-xs ${pool.totalReturnPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ({pool.totalReturnPercentage >= 0 ? '+' : ''}{pool.totalReturnPercentage.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Bull Position */}
        {pool.hasBullPosition && (
          <div className="space-y-1">
            <div className="text-gray-500 dark:text-gray-400">Bull Position</div>
            <div className="text-gray-900 dark:text-white">
              Sold {pool.bullTokenSymbol}
            </div>
            <div className={`font-medium ${pool.bullPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              P&L: {pool.bullPnL >= 0 ? '+' : ''}{pool.bullPnL.toFixed(4)} WETH
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Return: {pool.bullReturns >= 0 ? '+' : ''}{pool.bullReturns.toFixed(2)}%
            </div>
          </div>
        )}
        
        {/* Bear Position */}
        {pool.hasBearPosition && (
          <div className="space-y-1">
            <div className="text-gray-500 dark:text-gray-400">Bear Position</div>
            <div className="text-gray-900 dark:text-white">
              Sold {pool.bearTokenSymbol}
            </div>
            <div className={`font-medium ${pool.bearPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              P&L: {pool.bearPnL >= 0 ? '+' : ''}{pool.bearPnL.toFixed(4)} WETH
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Return: {pool.bearReturns >= 0 ? '+' : ''}{pool.bearReturns.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Original Investment: {pool.totalCostBasis.toFixed(4)} WETH</span>
        <span>Chain: {pool.chainId === 11155111 ? 'Sepolia' : 'Unknown'}</span>
      </div>
    </div>
  );
};

// Enhanced summary card component with animations
const SummaryCard = ({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  trend?: "up" | "down" | "neutral";
}) => (
  <Card className="group relative overflow-hidden border-black dark:border-neutral-700/60 dark:bg-gradient-to-br dark:from-neutral-800/50 dark:to-neutral-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-yellow-300/50 dark:hover:border-yellow-500/30">
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
        {title}
      </CardTitle>
      <div className="relative">
        <div
          className={`absolute inset-0 rounded-full blur-sm opacity-20 ${
            trend === "up"
              ? "bg-green-400"
              : trend === "down"
              ? "bg-red-400"
              : "bg-neutral-400"
          }`}
        />
        <Icon
          className={`relative h-5 w-5 transition-all duration-300 group-hover:scale-110 ${
            trend === "up"
              ? "text-green-500 dark:text-green-400"
              : trend === "down"
              ? "text-red-500 dark:text-red-400"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
        />
        </div>
    </CardHeader>
    <CardContent>
      <div
        className={`text-2xl font-bold transition-all duration-300 group-hover:scale-105 ${
          trend === "up"
            ? "text-green-600 dark:text-green-400"
            : trend === "down"
            ? "text-red-600 dark:text-red-400"
            : "text-neutral-900 dark:text-neutral-100"
        }`}
      >
        {value}
      </div>
      {trend && trend !== "neutral" && (
        <div className="mt-1 flex items-center text-xs opacity-70">
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
          )}
          <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
            {trend === "up" ? "Profit" : "Loss"}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

const PositionCard = ({ pool }: { pool: PoolData }) => {
  const router = useRouter();
  const chainConfig = getChainConfig(pool.chainId);

  return (
    <div
      className="group relative overflow-hidden border border-black dark:border-neutral-600/60 rounded-xl p-5 dark:bg-gradient-to-br dark:from-neutral-700/40 dark:to-neutral-800/40 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-yellow-300/50 dark:hover:border-yellow-500/30"
      onClick={() => {
        router.push(`/pool?id=${pool.id}`)
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 w-1 h-full transition-all duration-300 group-hover:w-2"
        style={{
          backgroundColor:
            pool.bullBalance > pool.bearBalance ? "#1f2937" : "#d1d5db",
        }}
      />

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full shadow-lg"
            style={{
              backgroundColor:
                pool.bullBalance > pool.bearBalance ? "#1f2937" : "#d1d5db",
            }}
          />
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
              {pool.name}
            </h3>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {pool.priceFeed} • {chainConfig?.name || `Chain ${pool.chainId}`}
              {pool.isCreator && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                  Creator
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            {pool.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4,
            })}{" "}
            WETH
          </div>
          <div
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              pool.totalPnL >= 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {pool.totalPnL > 0 ? "+" : ""}
            {pool.totalPnL.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4,
            })}{" "}
            WETH (
            {pool.totalCostBasis > 0
              ? ((pool.totalPnL / pool.totalCostBasis) * 100).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }
                )
              : "0"}
            % )
          </div>
        </div>
      </div>

      {/* Oracle Price Info */}
      <div className="relative flex justify-between items-center text-xs mb-3 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
        <div>
          <span className="text-neutral-600 dark:text-neutral-400">Current Price: </span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            ${pool.currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className={`font-medium ${
          pool.priceChangePercent >= 0 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {pool.priceChangePercent >= 0 ? '+' : ''}
          {pool.priceChangePercent.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}%
        </div>
      </div>

      {/* Position details */}
      <div className="relative flex justify-between text-xs">
        {/* Bull side */}
        <div className="space-y-1 text-left">
          <div className="font-medium text-black dark:text-gray-500">
            Bull Position ({pool.bullTokenSymbol})
          </div>
          <div className="font-semibold text-black dark:text-gray-500">
            {pool.bullBalance.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            tokens
          </div>
          {pool.bullBalance === 0 && pool.bullPnL !== 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Sold - P&L: {pool.bullPnL >= 0 ? '+' : ''}{pool.bullPnL.toFixed(4)} WETH
            </div>
          )}
          {pool.bullBalance > 0 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              @ ${pool.bullPrice.toLocaleString(undefined, {
                minimumFractionDigits: 4,
                maximumFractionDigits: 6,
              })} each
            </div>
          )}
        </div>

        {/* Bear side */}
        <div className="space-y-1 text-right">
          <div className="font-medium text-gray-400 dark:text-white">
            Bear Position ({pool.bearTokenSymbol})
          </div>
          <div className="font-semibold text-gray-400 dark:text-gray-50">
            {pool.bearBalance.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            tokens
          </div>
          {pool.bearBalance === 0 && pool.bearPnL !== 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Sold - P&L: {pool.bearPnL >= 0 ? '+' : ''}{pool.bearPnL.toFixed(4)} WETH
            </div>
          )}
          {pool.bearBalance > 0 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              @ ${pool.bearPrice.toLocaleString(undefined, {
                minimumFractionDigits: 4,
                maximumFractionDigits: 6,
              })} each
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Chart component for bull/bear positions
const PositionChart = ({
  data,
  title,
  type,
  showDistribution,
  onToggleView,
}: {
  data: any[];
  title: string;
  type: "bull" | "bear";
  showDistribution: boolean;
  onToggleView: () => void;
}) => {
  const colors = type === "bull" ? BULL_COLORS : BEAR_COLORS;
  const dataKey = type === "bull" ? "bullCurrentValue" : "bearCurrentValue";
  const nameKey = "name";

  return (
    <Card className="border-black dark:border-neutral-700/60 dark:bg-gradient-to-br dark:from-neutral-800/50 dark:to-neutral-900/50 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  type === "bull" ? "bg-gray-800" : "bg-gray-300"
                }`}
              />
              {title}
            </CardTitle>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Your {type} positions across {data.length} pool
              {data.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleView}
            className="border-neutral-300/60 dark:border-neutral-600/60 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-all duration-200"
          >
            {showDistribution ? (
              <PieChartIcon className="h-4 w-4 mr-2" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            {showDistribution ? "Pie View" : "Bar View"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {showDistribution ? (
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e5e5"
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey={nameKey}
                stroke="#737373"
                fontSize={12}
                tickFormatter={(name) =>
                  name.length > 10 ? `${name.substring(0, 10)}...` : name
                }
              />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  color: "#000",
                }}
                formatter={(value: number) => [
                  `${value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })} WETH`,
                  "Value",
                ]}
              />
              <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey={dataKey}
                stroke="#000"
                strokeWidth={2}
                legendType="circle"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })} WETH`,
                  "Value",
                ]}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  stroke: "#000",
                  color: "#000",
                  strokeWidth: 2,
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4 flex-wrap">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded shadow-sm"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced pool data loader with comprehensive smart contract integration
const EnhancedPoolDataLoader = ({
  poolAddress,
  index,
  userAddress,
  chainId,
  onDataLoad,
}: {
  poolAddress: string;
  index: number;
  userAddress?: string;
  chainId: number;
  onDataLoad: (data: PoolData) => void;
}) => {
  // Step 1: Get basic pool information
  const { data: poolBasicData } = useReadContracts({
    contracts: [
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'poolName' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'baseToken' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'bullCoin' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'bearCoin' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'oracle' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'getCurrentPrice' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'previousPrice' },
    ],
    query: {
      enabled: !!poolAddress,
    }
  });

  const poolName = poolBasicData?.[0]?.result as string;
  const baseToken = poolBasicData?.[1]?.result as Address;
  const bullTokenAddress = poolBasicData?.[2]?.result as Address;
  const bearTokenAddress = poolBasicData?.[3]?.result as Address;
  const oracleAddress = poolBasicData?.[4]?.result as Address;
  const currentPrice = Number(formatUnits(poolBasicData?.[5]?.result as bigint || BigInt(0), 18));
  const previousPrice = Number(formatUnits(poolBasicData?.[6]?.result as bigint || BigInt(0), 18));

  // Step 2: Get fee information
  const { data: feeData } = useReadContracts({
    contracts: poolAddress ? [
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'mintFee' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'burnFee' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'creatorFee' },
      { address: poolAddress as Address, abi: PredictionPoolABI, functionName: 'treasuryFee' },
    ] : [],
    query: {
      enabled: !!poolAddress,
    }
  });

  // Step 3: Get token metadata and supplies
  const { data: tokenData } = useReadContracts({
    contracts: bullTokenAddress && bearTokenAddress ? [
      { address: bullTokenAddress, abi: CoinABI, functionName: 'name' },
      { address: bullTokenAddress, abi: CoinABI, functionName: 'symbol' },
      { address: bullTokenAddress, abi: CoinABI, functionName: 'totalSupply' },
      { address: bullTokenAddress, abi: CoinABI, functionName: 'vaultCreator' },
      { address: bearTokenAddress, abi: CoinABI, functionName: 'name' },
      { address: bearTokenAddress, abi: CoinABI, functionName: 'symbol' },
      { address: bearTokenAddress, abi: CoinABI, functionName: 'totalSupply' },
    ] : [],
    query: {
      enabled: !!(bullTokenAddress && bearTokenAddress),
    }
  });

  // Step 4: Get reserves (base token balances in bull/bear tokens)
  const { data: reserveData } = useReadContracts({
    contracts: baseToken && bullTokenAddress && bearTokenAddress ? [
      { address: baseToken, abi: ERC20ABI, functionName: 'balanceOf', args: [bullTokenAddress] },
      { address: baseToken, abi: ERC20ABI, functionName: 'balanceOf', args: [bearTokenAddress] },
      { address: baseToken, abi: ERC20ABI, functionName: 'symbol' },
      { address: baseToken, abi: ERC20ABI, functionName: 'decimals' },
    ] : [],
    query: {
      enabled: !!(baseToken && bullTokenAddress && bearTokenAddress),
    }
  });

  // Step 5: Get user balances if user is connected
  const { data: userBalanceData } = useReadContracts({
    contracts: userAddress && bullTokenAddress && bearTokenAddress && baseToken ? [
      { address: bullTokenAddress, abi: CoinABI, functionName: 'balanceOf', args: [userAddress as Address] },
      { address: bearTokenAddress, abi: CoinABI, functionName: 'balanceOf', args: [userAddress as Address] },
      { address: baseToken, abi: ERC20ABI, functionName: 'balanceOf', args: [userAddress as Address] },
    ] : [],
    query: {
      enabled: !!(userAddress && bullTokenAddress && bearTokenAddress && baseToken),
    }
  });

  // Step 6: Get underlying oracle address
  const { data: underlyingOracleData } = useReadContracts({
    contracts: oracleAddress && oracleAddress !== "0x0000000000000000000000000000000000000000" ? [
      { address: oracleAddress, abi: ChainlinkOracleABI, functionName: 'priceFeed' },
    ] : [],
    query: {
      enabled: !!(oracleAddress && oracleAddress !== "0x0000000000000000000000000000000000000000"),
    }
  });

  useEffect(() => {
    if (!poolBasicData || !tokenData || !reserveData || !userAddress) return;

    const processPoolData = async () => {
      const bullName = tokenData[0]?.result as string || 'Bull Token';
      const bullSymbol = tokenData[1]?.result as string || 'BULL';
      const bullSupply = Number(formatUnits(tokenData[2]?.result as bigint || BigInt(0), 18));
      const vaultCreator = tokenData[3]?.result as Address || '';
      const bearName = tokenData[4]?.result as string || 'Bear Token';
      const bearSymbol = tokenData[5]?.result as string || 'BEAR';
      const bearSupply = Number(formatUnits(tokenData[6]?.result as bigint || BigInt(0), 18));

      const baseTokenDecimals = Number(reserveData[3]?.result ?? 18);
      const bullReserve = Number(formatUnits((reserveData[0]?.result as bigint) ?? BigInt(0), baseTokenDecimals));
      const bearReserve = Number(formatUnits((reserveData[1]?.result as bigint) ?? BigInt(0), baseTokenDecimals));
      // const baseTokenSymbol = reserveData[2]?.result as string || 'WETH';

      const userBullTokens = Number(formatUnits((userBalanceData?.[0]?.result as bigint) ?? BigInt(0), 18));
      const userBearTokens = Number(formatUnits((userBalanceData?.[1]?.result as bigint) ?? BigInt(0), 18));
      const userBaseTokenBalance = Number(formatUnits((userBalanceData?.[2]?.result as bigint) ?? BigInt(0), baseTokenDecimals));

      // Check if user has any transaction history even if current balance is 0
      const hasTransactionHistory = async () => {
        try {
          // Quick check with smaller block range for history detection
          const chainConfig = getChainConfig(chainId);
          if (!chainConfig) return false;

          const publicClient = createPublicClient({
            chain: chainConfig.chain,
            transport: http()
          });

          const currentBlock = await publicClient.getBlockNumber();
          const recentBlocks = currentBlock - BigInt(50000); // Check recent ~1 week
          
          const buyEventABI = {
            type: 'event',
            name: 'Buy',
            inputs: [
              { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
              { name: 'to', type: 'address', indexed: true, internalType: 'address' },
              { name: 'amountAsset', type: 'uint256', indexed: false, internalType: 'uint256' },
              { name: 'amountCoin', type: 'uint256', indexed: false, internalType: 'uint256' },
              { name: 'feePaid', type: 'uint256', indexed: false, internalType: 'uint256' },
            ]
          } as const;

          // Quick check for any recent transactions on both tokens
          const [bullBuyLogs, bearBuyLogs] = await Promise.all([
            publicClient.getLogs({
              address: bullTokenAddress as Address,
              event: buyEventABI,
              args: { buyer: userAddress as Address },
              fromBlock: recentBlocks,
              toBlock: 'latest'
            }).catch(() => []),
            publicClient.getLogs({
              address: bearTokenAddress as Address,
              event: buyEventABI,
              args: { buyer: userAddress as Address },
              fromBlock: recentBlocks,
              toBlock: 'latest'
            }).catch(() => [])
          ]);

          return bullBuyLogs.length > 0 || bearBuyLogs.length > 0;
        } catch {
          return false;
        }
      };

      // Only process pools where user has current positions OR transaction history
      if (userBullTokens === 0 && userBearTokens === 0) {
        const hasHistory = await hasTransactionHistory();
        if (!hasHistory) {
          return; // Skip pools without positions or history
        }
      }

      const underlyingOracleAddress = underlyingOracleData?.[0]?.result as string;
      const finalOracleAddress = underlyingOracleAddress || oracleAddress;
      const priceFeedName = getPriceFeedName(finalOracleAddress, chainId);

      // Calculate price metrics
      const priceChange = currentPrice - previousPrice;
      const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

      // Calculate P&L using transaction events
      let bullMetrics, bearMetrics;

      try {
        // Always calculate metrics if user has transaction history, even if current balance is 0
        bullMetrics = await calculateTokenMetricsWithEvents(
          bullReserve,
          bullSupply,
          userBullTokens,
          bullTokenAddress,
          userAddress,
          chainId
        );

        bearMetrics = await calculateTokenMetricsWithEvents(
          bearReserve,
          bearSupply,
          userBearTokens,
          bearTokenAddress,
          userAddress,
          chainId
        );
      } catch (error) {
        console.error('Error calculating metrics with events, using fallback:', error instanceof Error ? error : new Error(String(error)));
        // Fallback to legacy calculation
        const bullAvgPrice = bullSupply > 0 ? bullReserve / bullSupply : 0;
        const bearAvgPrice = bearSupply > 0 ? bearReserve / bearSupply : 0;
        
        bullMetrics = calculateTokenMetrics(bullReserve, bullSupply, userBullTokens, bullAvgPrice);
        bearMetrics = calculateTokenMetrics(bearReserve, bearSupply, userBearTokens, bearAvgPrice);
      }

      const fees = {
        mintFee: Number(formatUnits(feeData?.[0]?.result as bigint || BigInt(0), 4)),
        burnFee: Number(formatUnits(feeData?.[1]?.result as bigint || BigInt(0), 4)),
        creatorFee: Number(formatUnits(feeData?.[2]?.result as bigint || BigInt(0), 4)),
        treasuryFee: Number(formatUnits(feeData?.[3]?.result as bigint || BigInt(0), 4)),
      };

      const poolData: PoolData = {
        id: poolAddress,
        name: poolName || `Pool ${index + 1}`,
        bullBalance: userBullTokens,
        bearBalance: userBearTokens,
        bullCurrentValue: bullMetrics.currentValue,
        bearCurrentValue: bearMetrics.currentValue,
        totalValue: bullMetrics.currentValue + bearMetrics.currentValue,
        totalCostBasis: bullMetrics.costBasis + bearMetrics.costBasis,
        bullPnL: bullMetrics.pnL,
        bearPnL: bearMetrics.pnL,
        totalPnL: bullMetrics.pnL + bearMetrics.pnL,
        bullPrice: bullMetrics.price,
        bearPrice: bearMetrics.price,
        bullAvgPrice: bullMetrics.costBasis > 0 && userBullTokens > 0 ? bullMetrics.costBasis / userBullTokens : 0,
        bearAvgPrice: bearMetrics.costBasis > 0 && userBearTokens > 0 ? bearMetrics.costBasis / userBearTokens : 0,
        bullReturns: bullMetrics.returns,
        bearReturns: bearMetrics.returns,
        totalReturnPercentage: (bullMetrics.costBasis + bearMetrics.costBasis) > 0 ? ((bullMetrics.pnL + bearMetrics.pnL) / (bullMetrics.costBasis + bearMetrics.costBasis)) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
        bullColor: BULL_COLORS[index % BULL_COLORS.length],
        bearColor: BEAR_COLORS[index % BEAR_COLORS.length],
        hasPositions: userBullTokens > 0 || userBearTokens > 0 || bullMetrics.pnL !== 0 || bearMetrics.pnL !== 0,
        hasBullPosition: userBullTokens > 0 || bullMetrics.pnL !== 0,
        hasBearPosition: userBearTokens > 0 || bearMetrics.pnL !== 0,
        bullReserve,
        bearReserve,
        bullSupply,
        bearSupply,
        chainId,
        priceFeed: priceFeedName,
        // Enhanced data
        baseToken: baseToken || '',
        bullTokenAddress: bullTokenAddress || '',
        bearTokenAddress: bearTokenAddress || '',
        bullTokenName: bullName,
        bearTokenName: bearName,
        bullTokenSymbol: bullSymbol,
        bearTokenSymbol: bearSymbol,
        oracleAddress: oracleAddress || '',
        underlyingOracleAddress,
        currentPrice,
        previousPrice,
        priceChange,
        priceChangePercent,
        vaultCreator: vaultCreator || '',
        fees,
        baseTokenBalance: userBaseTokenBalance,
        isCreator: userAddress?.toLowerCase() === vaultCreator?.toLowerCase(),
      };

      console.debug("Enhanced EVM pool data with event-based P&L:", { poolData });
      onDataLoad(poolData);
    };

    processPoolData();
  }, [poolBasicData, tokenData, reserveData, userBalanceData, underlyingOracleData, feeData, poolAddress, onDataLoad, userAddress, chainId, index, baseToken, bearTokenAddress, bullTokenAddress, currentPrice, oracleAddress, poolName, previousPrice]);

  return null;
};

// Main component
export default function PortfolioPage() {
  const { address, isConnected, chainId } = useAccount();
  const router = useRouter();
  const [showBullDistribution, setShowBullDistribution] = useState(false);
  const [showBearDistribution, setShowBearDistribution] = useState(false);
  const [poolsData, setPoolsData] = useState<PoolData[]>([]);
  const [loadedPoolsCount, setLoadedPoolsCount] = useState(0);
  const [isLoadingPools, setIsLoadingPools] = useState(false); // Start with false to show empty state immediately

  // Get factory address for current chain
  const factoryAddress = useMemo(() => {
    if (!chainId) return null;
    const address = FatePoolFactories[chainId as keyof typeof FatePoolFactories];
    // Check if address is valid (not zero address)
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      console.warn(`No valid factory address configured for chain ${chainId}`);
      return null;
    }
    return address;
  }, [chainId]);

  // Get all pools from factory
  const { data: allPoolsData } = useReadContracts({
    contracts: (factoryAddress && isAddress(factoryAddress as Address) && factoryAddress !== ZERO_ADDRESS) ? [
      { address: factoryAddress as Address, abi: PredictionPoolFactoryABI, functionName: 'getAllPools' },
      { address: factoryAddress as Address, abi: PredictionPoolFactoryABI, functionName: 'getPoolCount' },
    ] : [],
    query: {
      enabled: !!(factoryAddress && isAddress(factoryAddress as Address) && factoryAddress !== ZERO_ADDRESS),
    }
  });

  const availablePools = useMemo(() => {
    const pools = allPoolsData?.[0]?.result as string[] || [];
    console.debug(`Found ${pools.length} pools from factory:`, { 
      pools, 
      factoryAddress, 
      chainId,
      chainName: getChainName(chainId || 1)
    });
    return pools.filter(pool => pool && pool !== "0x0000000000000000000000000000000000000000");
  }, [allPoolsData, factoryAddress, chainId]);

  // Handle pool data loading
  const handlePoolDataLoad = useCallback((data: PoolData) => {
    console.debug("Received EVM pool data:", { data });
    setPoolsData((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === data.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = data;
        return updated;
      } else {
        setLoadedPoolsCount((prevCount) => prevCount + 1);
        return [...prev, data];
      }
    });
  }, []);

  // Initialize loading state based on connection
  useEffect(() => {
    if (!isConnected) {
      setIsLoadingPools(false);
    } else if (!factoryAddress) {
      // No valid factory address - stop loading immediately
      console.warn("No valid factory address for current chain, stopping loading");
      setIsLoadingPools(false);
    } else {
      // Start loading data in background but don't show loading screen
      setIsLoadingPools(false);
    }
  }, [isConnected, factoryAddress]);

  // Reset data when user changes
  useEffect(() => {
    if (address) {
      setPoolsData([]);
      setLoadedPoolsCount(0);
      setIsLoadingPools(false); // Don't show loading screen
    } else {
      setPoolsData([]);
      setLoadedPoolsCount(0);
      setIsLoadingPools(false);
    }
  }, [address, chainId]);

  // Remove the complex loading logic - let data load in background
  // The portfolio will show empty state (0 values) immediately and populate as data loads

  // Calculate portfolio statistics
  const {
    activePoolsData,
    historicalPoolsData,
    bullPositionsData,
    bearPositionsData,
    totalPortfolioValue,
    totalPnL,
    totalReturnPercentage,
  } = useMemo((): {
    activePoolsData: PoolData[];
    historicalPoolsData: PoolData[];
    bullPositionsData: PoolData[];
    bearPositionsData: PoolData[];
    totalPortfolioValue: number;
    totalPnL: number;
    totalReturnPercentage: number;
    totalCostBasis: number;
  } => {
    // Active pools have current balances > 0
    const activePoolsData = poolsData.filter((pool) => 
      pool.bullBalance > 0 || pool.bearBalance > 0
    );
    
    // Historical pools have P&L but no current balance
    const historicalPoolsData = poolsData.filter((pool) => 
      (pool.bullBalance === 0 && pool.bearBalance === 0) && 
      (pool.bullPnL !== 0 || pool.bearPnL !== 0)
    );
    
    const bullPositionsData = poolsData.filter((pool) => pool.hasBullPosition);
    const bearPositionsData = poolsData.filter((pool) => pool.hasBearPosition);

    // Calculate totals including both active and historical
    const allPoolsWithPositions = poolsData.filter((pool) => pool.hasPositions);
    
    const totalPortfolioValue = activePoolsData.reduce(
      (sum, pool) => sum + pool.totalValue,
      0
    );
    const totalCostBasis = allPoolsWithPositions.reduce(
      (sum, pool) => sum + pool.totalCostBasis,
      0
    );
    const totalPnL = allPoolsWithPositions.reduce(
      (sum, pool) => sum + pool.totalPnL,
      0
    );
    const totalReturnPercentage =
      totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    // const hasAnyPositions = activePoolsData.length > 0 || historicalPoolsData.length > 0;

    return {
      activePoolsData,
      historicalPoolsData,
      bullPositionsData,
      bearPositionsData,
      totalPortfolioValue,
      totalCostBasis,
      totalPnL,
      totalReturnPercentage,
    };
  }, [poolsData]);

  // Debug logging
  console.debug("Portfolio state:", {
    isConnected,
    address,
    isLoadingPools,
    availablePoolsLength: availablePools.length,
    loadedPoolsCount,
    hasAllPoolsData: !!allPoolsData,
    chainId,
    factoryAddress,
    hasValidFactory: !!factoryAddress && factoryAddress !== "0x0000000000000000000000000000000000000000"
  });

  // Remove the loading screen - show portfolio immediately with 0 values

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 pt-28 min-[900px]:pt-32">
        <Card className="p-8 text-center max-w-md border-black dark:border-neutral-700/60 shadow-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm">
          <div className="mb-6">
            <Wallet className="h-12 w-12 mx-auto text-yellow-500 dark:text-yellow-400 mb-4" />
            <CardTitle className="text-xl mb-2 text-neutral-900 dark:text-neutral-100">
            Connect Your Wallet
            </CardTitle>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Connect your wallet to view your portfolio and manage your
              positions
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
            >
              Go to Home
            </Button>
        </div>
        </Card>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white p-4 pt-28 min-[900px]:p-6 min-[900px]:pt-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Pool Data Loaders - Only loads pools where user has positions */}
        {availablePools.map((poolAddress, index) => (
          <EnhancedPoolDataLoader
            key={poolAddress}
            poolAddress={poolAddress}
            index={index}
            userAddress={address}
            chainId={chainId || 1}
            onDataLoad={handlePoolDataLoad}
          />
        ))}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {poolsData.length === 0 ? (
            // Show skeleton loading cards while data is being calculated
            <>
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <SummaryCard
                title="Total Portfolio Value"
                value={`${totalPortfolioValue.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4,
                })} WETH`}
                icon={DollarSign}
                trend="neutral"
              />
              <SummaryCard
                title="Total P&L"
                value={`${totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  }
                )} WETH`}
                icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
                trend={totalPnL >= 0 ? "up" : "down"}
              />
              <SummaryCard
                title="Total Return %"
                value={`${
                  totalReturnPercentage >= 0 ? "+" : ""
                }${totalReturnPercentage.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}%`}
                icon={Activity}
                trend={totalReturnPercentage >= 0 ? "up" : "down"}
              />
            </>
          )}
        </div>

        {poolsData.length === 0 ? (
          // Show skeleton loading while portfolio data is being calculated
          <div className="space-y-6">
            {/* Skeleton for Bull and Bear Position Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Bull Positions Chart Skeleton */}
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-1/3"></div>
                  <div className="h-48 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Positions List Skeleton */}
              <div className="xl:col-span-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-3/4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-neutral-700 rounded-lg">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-1/3"></div>
                          <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-1/2"></div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-16"></div>
                          <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bear Positions Chart Skeleton */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-1/3"></div>
                <div className="h-48 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : activePoolsData.length > 0 ? (
          <div className="space-y-6">
            {/* Bull and Bear Position Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Bull Positions Chart */}
              {bullPositionsData.length > 0 && (
                <PositionChart
                  data={bullPositionsData}
                  title="Bull Positions"
                  type="bull"
                  showDistribution={showBullDistribution}
                  onToggleView={() =>
                    setShowBullDistribution(!showBullDistribution)
                  }
                />
              )}
              
              {/* Positions List */}
              <Card className={`border-black ${bullPositionsData.length > 0 && bearPositionsData.length > 0 ? 'xl:col-span-1' : 'xl:col-span-2'} dark:border-neutral-700/60 dark:bg-gradient-to-br dark:from-neutral-800/50 dark:to-neutral-900/50 backdrop-blur-sm shadow-xl`}>
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                    Active Positions
                  </CardTitle>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {activePoolsData.length} active position{activePoolsData.length !== 1 ? 's' : ''} across {availablePools.length} pool{availablePools.length !== 1 ? 's' : ''}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto overflow-x-hidden">
                    {activePoolsData.map((pool, index) => (
                      <div
                        key={pool.id}
                        className="animate-in slide-in-from-bottom-4 duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <PositionCard pool={pool} />
        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Bear Positions Chart */}
              {bearPositionsData.length > 0 && (
                <PositionChart
                  data={bearPositionsData}
                  title="Bear Positions"
                  type="bear"
                  showDistribution={showBearDistribution}
                  onToggleView={() =>
                    setShowBearDistribution(!showBearDistribution)
                  }
                />
              )}
            </div>

            {/* Historical Investments Section - Show below active positions */}
            {historicalPoolsData.length > 0 && (
              <HistoricalInvestmentsTable 
                historicalPools={historicalPoolsData}
                userAddress={address}
                chainId={chainId}
              />
            )}
          </div>
        ) : !isLoadingPools ? (
          <div className="space-y-6">
            {/* Show history section if user has historical trades */}
            {historicalPoolsData.length > 0 && (
              <Card className="border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                    Trading History
                  </CardTitle>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {historicalPoolsData.length} completed position{historicalPoolsData.length !== 1 ? 's' : ''} with total P&L of {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(4)} WETH
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {historicalPoolsData.map((pool, index) => (
                      <div
                        key={pool.id}
                        className="animate-in slide-in-from-bottom-4 duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <HistoryCard pool={pool} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historical Investments Section - Show when no active positions */}
            {historicalPoolsData.length > 0 && (
              <HistoricalInvestmentsTable 
                historicalPools={historicalPoolsData}
                userAddress={address}
                chainId={chainId}
              />
            )}
            
             {/* Contract deployment status message */}
             {!factoryAddress && isConnected && (
               <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-8 text-center">
                 <CardTitle className="text-yellow-800 dark:text-yellow-200 mb-2">
                   Contracts Not Deployed
                 </CardTitle>
                 <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                   The Fate Protocol contracts are not yet deployed on {getChainName(chainId || 1)}.
                 </p>
                 <p className="text-yellow-600 dark:text-yellow-400 mb-6">
                   You can test the protocol on Sepolia testnet (contracts are deployed there) or wait for mainnet deployment.
                 </p>
                 <div className="flex gap-4 justify-center flex-wrap">
                   <Button 
                     onClick={() => router.push('/explorePools')}
                     className="bg-yellow-600 hover:bg-yellow-700 text-white"
                   >
                     Check Available Networks
                   </Button>
                   <Button 
                     onClick={() => router.push('/createPool')}
                     variant="outline"
                     className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                   >
                     Create Pool (Testnet)
                   </Button>
                 </div>
                 <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-800/30 rounded-lg">
                   <p className="text-sm text-yellow-800 dark:text-yellow-200">
                     <strong>Available Networks:</strong> Sepolia Testnet (Chain ID: 11155111)
                   </p>
                   <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                     Switch to Sepolia testnet to interact with deployed contracts
                   </p>
                   <div className="mt-2 p-2 bg-yellow-200 dark:bg-yellow-700/50 rounded text-xs">
                     <p className="text-yellow-800 dark:text-yellow-200">
                       <strong>Debug Info:</strong> Current chain: {getChainName(chainId || 1)} (ID: {chainId})
                     </p>
                     <p className="text-yellow-700 dark:text-yellow-300">
                       Factory address: {factoryAddress || 'Not configured'}
                     </p>
                   </div>
                 </div>
               </Card>
             )}

             {/* No active positions message */}
             {factoryAddress && (
               <Card className="border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 p-8 text-center">
                 <CardTitle className="text-neutral-900 dark:text-neutral-100 mb-2">
                   {poolsData.length === 0 ? 'No Pools Found' : (historicalPoolsData.length > 0 ? 'No Active Positions' : 'No Positions Yet')}
                 </CardTitle>
                 <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                   {poolsData.length === 0 
                     ? (chainId === 11155111 
                       ? 'No prediction pools have been created on Sepolia testnet yet. Be the first to create one!'
                       : 'No prediction pools found on this network. Try switching to a different network or check back later.')
                     : (historicalPoolsData.length > 0 
                       ? 'You don\'t have any active positions, but you can see your trading history above.'
                       : 'You don\'t have any positions in prediction pools yet.')
                   }
                 </p>
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   <Button 
                     onClick={() => router.push('/explorePools')}
                     className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                   >
                     Explore Pools
                   </Button>
               </div>
               </Card>
             )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
