
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
import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits, Address } from "viem";
import { useRouter } from "next/navigation";
import { getPortfolioSnapshot, getRecentTransactions, updatePortfolioSnapshot } from "@/lib/indexeddb/portfolio";
import { PortfolioSnapshot, CachedTransaction, PortfolioHolding } from "@/lib/types";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { FatePoolFactories } from "@/utils/addresses";
import { getChainConfig } from "@/utils/chainConfig";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { createPublicClient, http, formatUnits as fromWei } from "viem";
import { IOracleABI } from "@/utils/abi/IOracle";
import { getPriceFeedName } from "@/utils/supportedChainFeed";


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

interface PoolData {
  id: string;
  name: string;
  bullBalance: number;
  bearBalance: number;
  bullCurrentValue: number;
  bearCurrentValue: number;
  totalValue: number;
  totalCostBasis: number;
  totalCapitalInvested?: number;
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
  baseTokenSymbol: string;
  baseTokenName: string;
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

// Recent Transactions Component
const RecentTransactions: React.FC<{ 
  transactions: CachedTransaction[],
  onLoadMore: () => void,
  isLoadingMore: boolean,
  canLoadMore: boolean
}> = ({ transactions, onLoadMore, isLoadingMore, canLoadMore }) => {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.hash} className="flex items-center justify-between p-2 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <p className="font-semibold">{tx.type.toUpperCase()}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Pool: {tx.poolId.slice(0, 6)}...</p>
              </div>
              <div>
                <p>{formatUnits(tx.baseTokenAmount, 18)} WETH</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-right">{new Date(tx.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
        {canLoadMore && (
          <div className="flex justify-center mt-6">
            <Button onClick={onLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
                      {pool.totalCostBasis.toFixed(4)} {pool.baseTokenSymbol}
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
                      {pool.totalPnL >= 0 ? '+' : ''}{pool.totalPnL.toFixed(4)} {pool.baseTokenSymbol}
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
                {historicalPools.reduce((sum, pool) => sum + pool.totalCostBasis, 0).toFixed(4)} {historicalPools[0]?.baseTokenSymbol || 'UNKNOWN'}
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
                {historicalPools.reduce((sum, pool) => sum + pool.totalPnL, 0).toFixed(4)} {historicalPools[0]?.baseTokenSymbol || 'UNKNOWN'}
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
            {pool.totalPnL >= 0 ? '+' : ''}{pool.totalPnL.toFixed(4)} {pool.baseTokenSymbol}
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
              P&L: {pool.bullPnL >= 0 ? '+' : ''}{pool.bullPnL.toFixed(4)} {pool.baseTokenSymbol}
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
              P&L: {pool.bearPnL >= 0 ? '+' : ''}{pool.bearPnL.toFixed(4)} {pool.baseTokenSymbol}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Return: {pool.bearReturns >= 0 ? '+' : ''}{pool.bearReturns.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Original Investment: {pool.totalCostBasis.toFixed(4)} {pool.baseTokenSymbol}</span>
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
            {pool.baseTokenSymbol}
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
            {pool.baseTokenSymbol} (
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
            {pool.currentPrice.toLocaleString(undefined, {
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
            {pool.bullCurrentValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4,
            })}{" "}
            {pool.baseTokenSymbol}
          </div>
          {pool.bullCurrentValue === 0 && pool.bullPnL !== 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Sold - P&L: {pool.bullPnL >= 0 ? '+' : ''}{pool.bullPnL.toFixed(4)} {pool.baseTokenSymbol}
            </div>
          )}
          {pool.bullCurrentValue > 0 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              @ {pool.bullPrice.toLocaleString(undefined, {
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
            {pool.bearCurrentValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4,
            })}{" "}
            {pool.baseTokenSymbol}
          </div>
          {pool.bearCurrentValue === 0 && pool.bearPnL !== 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Sold - P&L: {pool.bearPnL >= 0 ? '+' : ''}{pool.bearPnL.toFixed(4)} {pool.baseTokenSymbol}
            </div>
          )}
          {pool.bearCurrentValue > 0 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              @ {pool.bearPrice.toLocaleString(undefined, {
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
  data: Array<{
    name: string;
    chartValue: number;
    bullCurrentValue: number;
    bearCurrentValue: number;
    id: string;
    chainId: number;
    baseTokenSymbol: string;
  }>;
  title: string;
  type: "bull" | "bear";
  showDistribution: boolean;
  onToggleView: () => void;
}) => {
  const colors = type === "bull" ? BULL_COLORS : BEAR_COLORS;
  const dataKey = "chartValue"; // Use the unified chartValue field
  const nameKey = "name";

  // Removed excessive debug logging to prevent re-render issues

  if (data.length === 0) {
    console.log(`📊 Chart ${type}: No data to display`);
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
                No {type} positions to display
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <div className="text-center">
              <div className="text-lg mb-2">No Data</div>
              <div className="text-sm">No {type} positions found</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if all chart values are 0 or very small
  const hasAnyData = data.some(d => d.chartValue > 0.0001); // Allow very small values
  const totalValue = data.reduce((sum, d) => sum + d.chartValue, 0);

  if (!hasAnyData || totalValue < 0.0001) {
    // Removed excessive debug logging to prevent re-render issues
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
                {data.length} pool{data.length !== 1 ? 's' : ''} with minimal value
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <div className="text-center">
              <div className="text-lg mb-2">Minimal Value</div>
              <div className="text-sm">Your {type} positions have very small values</div>
              <div className="text-xs mt-2 opacity-75">
                Total: {totalValue.toFixed(6)} {data[0]?.baseTokenSymbol || 'UNKNOWN'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div style={{ width: '100%', height: '300px', minHeight: '300px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
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
                  })} ${data[0]?.baseTokenSymbol || 'UNKNOWN'}`,
                    type === "bull" ? "Bull Value" : "Bear Value",
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
                  })} ${data[0]?.baseTokenSymbol || 'UNKNOWN'}`,
                    type === "bull" ? "Bull Value" : "Bear Value",
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
        </div>
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

// Function to build the portfolio snapshot from RPC
const buildSnapshotFromRPC = async (userAddress: Address, chainId: number): Promise<{snapshot: PortfolioSnapshot, poolInfo: Record<Address, { name: string; bullCoin: Address; bearCoin: Address; oracle: Address }>}> => {
  const chainConfig = getChainConfig(chainId);
  if (!chainConfig) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const publicClient = createPublicClient({
    chain: chainConfig.chain,
    transport: http(),
  });

  const factoryAddress = FatePoolFactories[chainId as keyof typeof FatePoolFactories];
  if (!factoryAddress || factoryAddress === ZERO_ADDRESS) {
    throw new Error(`No factory address for chainId: ${chainId}`);
  }

  const poolAddresses = await publicClient.readContract({
    address: factoryAddress,
    abi: PredictionPoolFactoryABI,
    functionName: 'getAllPools',
  }) as Address[];

  const filteredPools = poolAddresses.filter(addr => addr !== ZERO_ADDRESS);

  const poolInfoResults = await publicClient.multicall({
    contracts: filteredPools.flatMap(poolAddress => ([
      { address: poolAddress, abi: PredictionPoolABI, functionName: 'poolName' },
      { address: poolAddress, abi: PredictionPoolABI, functionName: 'bullCoin' },
      { address: poolAddress, abi: PredictionPoolABI, functionName: 'bearCoin' },
      { address: poolAddress, abi: PredictionPoolABI, functionName: 'oracle' },
    ])),
  });

  const poolInfo: Record<Address, { name: string; bullCoin: Address; bearCoin: Address; oracle: Address }> = {};
  const tokenAddresses: { address: Address, pool: Address, type: 'bull' | 'bear' }[] = [];

  filteredPools.forEach((poolAddress, i) => {
    const nameResult = poolInfoResults[i * 4];
    const bullCoinResult = poolInfoResults[i * 4 + 1];
    const bearCoinResult = poolInfoResults[i * 4 + 2];
    const oracleResult = poolInfoResults[i * 4 + 3];

    if (nameResult.status === 'success' && bullCoinResult.status === 'success' && bearCoinResult.status === 'success' && oracleResult.status === 'success') {
      const bullCoinAddress = bullCoinResult.result as Address;
      const bearCoinAddress = bearCoinResult.result as Address;
      poolInfo[poolAddress] = {
        name: nameResult.result as string,
        bullCoin: bullCoinAddress,
        bearCoin: bearCoinAddress,
        oracle: oracleResult.result as Address,
      };
      tokenAddresses.push({ address: bullCoinAddress, pool: poolAddress, type: 'bull' });
      tokenAddresses.push({ address: bearCoinAddress, pool: poolAddress, type: 'bear' });
    }
  });

  const balances = await publicClient.multicall({
    contracts: tokenAddresses.map(token => ({
      address: token.address,
      abi: CoinABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })),
  });

  const holdings: Record<Address, PortfolioHolding> = {};
  const totalValue = BigInt(0);

  balances.forEach((balance, i) => {
    if (balance.status === 'success' && (balance.result as bigint) > 0) {
      const token = tokenAddresses[i];
      holdings[token.address] = {
        tokenId: token.address,
        poolId: token.pool,
        balance: balance.result as bigint,
        costBasis: BigInt(0),
        realizedPnl: BigInt(0),
        lastUpdated: Date.now(),
      };
    }
  });

  const snapshot = {
    userAddress,
    totalValue,
    holdings,
    lastUpdated: Date.now(),
  };

  return { snapshot, poolInfo };
};

// Main component
export default function PortfolioPage() {
  const { address, isConnected, chainId } = useAccount();
  const router = useRouter();
  const [showBullDistribution, setShowBullDistribution] = useState(false);
  const [showBearDistribution, setShowBearDistribution] = useState(false);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [transactions, setTransactions] = useState<CachedTransaction[]>([]);
  const [poolInfo, setPoolInfo] = useState<Record<Address, { name: string; bullCoin: Address; bearCoin: Address; oracle: Address }>>({});
  const [oraclePrices, setOraclePrices] = useState<Record<Address, number>>({});
  const [poolStats, setPoolStats] = useState<Record<Address, { bullReserves: bigint; bearReserves: bigint; bullTotalSupply: bigint; bearTotalSupply: bigint }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);

  const handleLoadMore = async () => {
    if (!address) return;
    setIsLoadingMore(true);
    // This is where you would make an RPC call to fetch older transactions
    // For now, we'll just simulate a delay and then indicate that no more can be loaded.
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCanLoadMore(false);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    if (address && chainId) {
      const loadData = async () => {
        setIsLoading(true);
        const [snapshotData, transactionsData] = await Promise.all([
          getPortfolioSnapshot(address),
          getRecentTransactions(address)
        ]);
        if (snapshotData) {
          setSnapshot(snapshotData);
          setTransactions(transactionsData);
          setIsLoading(false);
        } else {
          // If no snapshot exists, fetch from RPC, build snapshot, and save it.
          console.log("No snapshot found, fetching from RPC...");
          const { snapshot: newSnapshot, poolInfo: newPoolInfo } = await buildSnapshotFromRPC(address, chainId);
          await updatePortfolioSnapshot(newSnapshot);
          setSnapshot(newSnapshot);
          setPoolInfo(newPoolInfo);
          setTransactions([]);
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [address, chainId]);

  useEffect(() => {
    if (snapshot && chainId) {
        const fetchPoolInfo = async () => {
            const poolIds = Object.values(snapshot.holdings).map(h => h.poolId);
            const uniquePoolIds = [...new Set(poolIds)];

            if (uniquePoolIds.length === 0) return;

            const chainConfig = getChainConfig(chainId);
            if (!chainConfig) return;

            const publicClient = createPublicClient({
                chain: chainConfig.chain,
                transport: http(),
            });

            try {
                const poolInfoResults = await publicClient.multicall({
                    contracts: uniquePoolIds.flatMap(poolId => ([
                        { address: poolId, abi: PredictionPoolABI, functionName: 'poolName' },
                        { address: poolId, abi: PredictionPoolABI, functionName: 'bullCoin' },
                        { address: poolId, abi: PredictionPoolABI, functionName: 'bearCoin' },
                        { address: poolId, abi: PredictionPoolABI, functionName: 'oracle' },
                    ])),
                });

                const info: Record<Address, { name: string; bullCoin: Address; bearCoin: Address; oracle: Address }> = {};
                uniquePoolIds.forEach((poolId, i) => {
                    const nameResult = poolInfoResults[i * 4];
                    const bullCoinResult = poolInfoResults[i * 4 + 1];
                    const bearCoinResult = poolInfoResults[i * 4 + 2];
                    const oracleResult = poolInfoResults[i * 4 + 3];
                    if (nameResult.status === 'success' && bullCoinResult.status === 'success' && bearCoinResult.status === 'success' && oracleResult.status === 'success') {
                        info[poolId] = {
                            name: nameResult.result as string,
                            bullCoin: bullCoinResult.result as Address,
                            bearCoin: bearCoinResult.result as Address,
                            oracle: oracleResult.result as Address,
                        };
                    }
                });
                setPoolInfo(info);
            } catch (error) {
                console.error("Failed to fetch pool info:", error);
            }
        };
        fetchPoolInfo();
    }
  }, [snapshot, chainId]);

  useEffect(() => {
    if (Object.keys(poolInfo).length > 0 && chainId) {
      const fetchOraclePrices = async () => {
        const chainConfig = getChainConfig(chainId);
        if (!chainConfig) return;

        const publicClient = createPublicClient({
          chain: chainConfig.chain,
          transport: http(),
        });

        const uniqueOracleAddresses = [...new Set(Object.values(poolInfo).map(p => p.oracle))];

        try {
          const priceResults = await publicClient.multicall({
            contracts: uniqueOracleAddresses.map(oracleAddress => ({
              address: oracleAddress,
              abi: IOracleABI,
              functionName: 'getLatestPrice',
            })),
          });

          const prices: Record<Address, number> = {};
          uniqueOracleAddresses.forEach((oracleAddress, i) => {
            const result = priceResults[i];
            if (result.status === 'success') {
              prices[oracleAddress] = Number(fromWei(result.result as bigint, 18));
            }
          });
          setOraclePrices(prices);
        } catch (error) {
          console.error("Failed to fetch oracle prices:", error);
        }
      };
      fetchOraclePrices();
    }
  }, [poolInfo, chainId]);

  useEffect(() => {
    if (Object.keys(poolInfo).length > 0 && chainId) {
      const fetchPoolStats = async () => {
        const chainConfig = getChainConfig(chainId);
        if (!chainConfig) return;

        const publicClient = createPublicClient({
          chain: chainConfig.chain,
          transport: http(),
        });

        const poolIds = Object.keys(poolInfo) as Address[];

        try {
          const statsResults = await publicClient.multicall({
            contracts: poolIds.flatMap(poolId => ([
              { address: poolId, abi: PredictionPoolABI, functionName: 'getPoolStats' },
              { address: poolInfo[poolId].bullCoin, abi: CoinABI, functionName: 'totalSupply' },
              { address: poolInfo[poolId].bearCoin, abi: CoinABI, functionName: 'totalSupply' },
            ])),
          });

          const stats: Record<Address, { bullReserves: bigint; bearReserves: bigint; bullTotalSupply: bigint; bearTotalSupply: bigint; }> = {};
          poolIds.forEach((poolId, i) => {
            const poolStatsResult = statsResults[i * 3];
            const bullSupplyResult = statsResults[i * 3 + 1];
            const bearSupplyResult = statsResults[i * 3 + 2];

            if (poolStatsResult.status === 'success' && bullSupplyResult.status === 'success' && bearSupplyResult.status === 'success') {
              const poolStats = poolStatsResult.result as readonly [bigint, bigint, bigint, bigint, bigint];
              stats[poolId] = {
                bullReserves: poolStats[0],
                bearReserves: poolStats[1],
                bullTotalSupply: bullSupplyResult.result as bigint,
                bearTotalSupply: bearSupplyResult.result as bigint,
              };
            }
          });
          setPoolStats(stats);
        } catch (error) {
          console.error("Failed to fetch pool stats:", error);
        }
      };
      fetchPoolStats();
    }
  }, [poolInfo, chainId]);

  const poolsData = useMemo(() => {
    if (!snapshot || Object.keys(poolInfo).length === 0) return [];

    const groupedByPool = Object.values(snapshot.holdings).reduce((acc, holding) => {
      if (!acc[holding.poolId]) {
        acc[holding.poolId] = { bull: null, bear: null };
      }
      const info = poolInfo[holding.poolId];
      if (info) {
        if (holding.tokenId === info.bullCoin) {
          acc[holding.poolId].bull = holding;
        } else if (holding.tokenId === info.bearCoin) {
          acc[holding.poolId].bear = holding;
        }
      }
      return acc;
    }, {} as Record<string, { bull: PortfolioHolding | null, bear: PortfolioHolding | null }>);

    return Object.entries(groupedByPool).map(([poolId, { bull, bear }], index) => {
      const bullBalance = bull ? Math.max(0, Number(formatUnits(bull.balance, 18))) : 0;
      const bearBalance = bear ? Math.max(0, Number(formatUnits(bear.balance, 18))) : 0;
      const bullCostBasis = bull ? Number(formatUnits(bull.costBasis, 18)) : 0;
      const bearCostBasis = bear ? Number(formatUnits(bear.costBasis, 18)) : 0;
      const bullRealizedPnl = bull ? Number(formatUnits(bull.realizedPnl, 18)) : 0;
      const bearRealizedPnl = bear ? Number(formatUnits(bear.realizedPnl, 18)) : 0;
      const totalCapitalInvested = (bull ? Number(formatUnits(bull.totalCapitalInvested || bull.costBasis, 18)) : 0) + (bear ? Number(formatUnits(bear.totalCapitalInvested || bear.costBasis, 18)) : 0);

      const stats = poolStats[poolId as Address];
      const bullPrice = stats && stats.bullTotalSupply > BigInt(0) ? Number(fromWei(stats.bullReserves, 18)) / Number(fromWei(stats.bullTotalSupply, 18)) : 0;
      const bearPrice = stats && stats.bearTotalSupply > BigInt(0) ? Number(fromWei(stats.bearReserves, 18)) / Number(fromWei(stats.bearTotalSupply, 18)) : 0;

      const bullCurrentValue = bullBalance * bullPrice;
      const bearCurrentValue = bearBalance * bearPrice;

      const bullUnrealizedPnl = bull ? bullCurrentValue - bullCostBasis : 0;
      const bearUnrealizedPnl = bear ? bearCurrentValue - bearCostBasis : 0;

      const bullPnL = bullUnrealizedPnl + bullRealizedPnl;
      const bearPnL = bearUnrealizedPnl + bearRealizedPnl;

      const totalCostBasis = bullCostBasis + bearCostBasis;
      const totalValue = bullCurrentValue + bearCurrentValue;
      const totalPnL = (bullPnL + bearPnL);
      const totalReturnPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

      const info = poolInfo[poolId as Address];

      return {
        id: poolId,
        name: info?.name || `Pool ${poolId.slice(0, 6)}...`,
        bullBalance,
        bearBalance,
        bullCurrentValue,
        bearCurrentValue,
        totalValue,
        totalCostBasis,
        totalCapitalInvested,
        bullPnL,
        bearPnL,
        totalPnL,
        bullPrice,
        bearPrice,
        bullAvgPrice: bullBalance > 0 ? bullCostBasis / bullBalance : 0,
        bearAvgPrice: bearBalance > 0 ? bearCostBasis / bearBalance : 0,
        bullReturns: bullCostBasis > 0 ? (bullPnL / bullCostBasis) * 100 : 0,
        bearReturns: bearCostBasis > 0 ? (bearPnL / bearCostBasis) * 100 : 0,
        totalReturnPercentage,
        color: CHART_COLORS[index % CHART_COLORS.length],
        bullColor: BULL_COLORS[index % BULL_COLORS.length],
        bearColor: BEAR_COLORS[index % BEAR_COLORS.length],
        hasPositions: bullBalance > 0 || bearBalance > 0,
        hasBullPosition: bullBalance > 0,
        hasBearPosition: bearBalance > 0,
        bullTokenAddress: info?.bullCoin || "0x...",
        bearTokenAddress: info?.bearCoin || "0x...",
        chainId: chainId || 1,
        priceFeed: getPriceFeedName(info?.oracle, chainId || 1),
        baseToken: "0x...",
        baseTokenSymbol: "WETH",
        baseTokenName: "Wrapped Ether",
        bullTokenName: "BULL",
        bearTokenName: "BEAR",
        bullTokenSymbol: "BULL",
        bearTokenSymbol: "BEAR",
        oracleAddress: "0x...",
        currentPrice: oraclePrices[info?.oracle] || 0,
        previousPrice: 1,
        priceChange: 0,
        priceChangePercent: 0,
        vaultCreator: "0x...",
        fees: { mintFee: 0, burnFee: 0, creatorFee: 0, treasuryFee: 0 },
        baseTokenBalance: 0,
        isCreator: false,
      } as PoolData;
    });
  }, [snapshot, chainId, poolInfo, oraclePrices, poolStats]);

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
    bullPositionsData: Array<{
      name: string;
      chartValue: number;
      bullCurrentValue: number;
      bearCurrentValue: number;
      id: string;
      chainId: number;
      baseTokenSymbol: string;
    }>;
    bearPositionsData: Array<{
      name: string;
      chartValue: number;
      bullCurrentValue: number;
      bearCurrentValue: number;
      id: string;
      chainId: number;
      baseTokenSymbol: string;
    }>;
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
    
    // Transform data for charts - show all pools, not just ones with positions
    const bullPositionsData: Array<{
      name: string;
      chartValue: number;
      bullCurrentValue: number;
      bearCurrentValue: number;
      id: string;
      chainId: number;
      baseTokenSymbol: string;
    }> = poolsData
      .filter((pool) => pool.bullBalance > 0 || pool.bullCurrentValue > 0 || pool.bullPnL !== 0)
      .map((pool) => ({
        name: pool.name,
        chartValue: Math.max(0, pool.bullCurrentValue || 0),
        bullCurrentValue: Math.max(0, pool.bullCurrentValue || 0),
        bearCurrentValue: 0,
        id: pool.id,
        chainId: pool.chainId,
        baseTokenSymbol: pool.baseTokenSymbol || 'UNKNOWN'
      }));

    const bearPositionsData: Array<{
      name: string;
      chartValue: number;
      bullCurrentValue: number;
      bearCurrentValue: number;
      id: string;
      chainId: number;
      baseTokenSymbol: string;
    }> = poolsData
      .filter((pool) => pool.bearBalance > 0 || pool.bearCurrentValue > 0 || pool.bearPnL !== 0)
      .map((pool) => ({
        name: pool.name,
        chartValue: Math.max(0, pool.bearCurrentValue || 0),
        bullCurrentValue: 0,
        bearCurrentValue: Math.max(0, pool.bearCurrentValue || 0),
        id: pool.id,
        chainId: pool.chainId,
        baseTokenSymbol: pool.baseTokenSymbol || 'UNKNOWN'
      }));

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
    
    const totalCapitalInvested = allPoolsWithPositions.reduce(
      (sum, pool) => sum + (pool.totalCapitalInvested || pool.totalCostBasis),
      0
    );
    const totalReturnPercentage =
      totalCapitalInvested > 0 ? (totalPnL / totalCapitalInvested) * 100 : 0;

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

  // Debug logging (only when data changes)
  useEffect(() => {
    if (poolsData.length > 0) {
      console.log("📊 Portfolio state updated:", {
        poolsDataLength: poolsData.length,
        samplePool: poolsData[0] ? {
          id: poolsData[0].id,
          name: poolsData[0].name,
          bullBalance: poolsData[0].bullBalance,
          bearBalance: poolsData[0].bearBalance,
          currentPrice: poolsData[0].currentPrice
        } : null
      });
    }
  }, [poolsData]);

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
                })} ${poolsData[0]?.baseTokenSymbol || 'UNKNOWN'}`}
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
                )} ${poolsData[0]?.baseTokenSymbol || 'UNKNOWN'}`}
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

        {isLoading && (
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
        )}

        {!isLoading && poolsData.length > 0 && (
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
                    {activePoolsData.length > 0 ? 'Active Positions' : 'Available Pools'}
                  </CardTitle>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {activePoolsData.length > 0
                      ? `${activePoolsData.length} active position${activePoolsData.length !== 1 ? 's' : ''}`
                      : `${poolsData.length} pools with history`
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto overflow-x-hidden">
                    {activePoolsData.length > 0 ? (
                      activePoolsData.map((pool, index) => (
                      <div
                        key={pool.id}
                        className="animate-in slide-in-from-bottom-4 duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <PositionCard pool={pool} />
                      </div>
                      ))
                    ) : (
                      poolsData.map((pool, index) => (
                        <div
                          key={pool.id}
                          className="animate-in slide-in-from-bottom-4 duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <PositionCard pool={pool} />
                        </div>
                      ))
                    )}
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

            {/* Recent Transactions Section */}
            <RecentTransactions
              transactions={transactions}
              onLoadMore={handleLoadMore}
              isLoadingMore={isLoadingMore}
              canLoadMore={canLoadMore}
            />

            {/* Historical Investments Section - Show below active positions */}
            {historicalPoolsData.length > 0 && (
              <HistoricalInvestmentsTable
                historicalPools={historicalPoolsData}
                userAddress={address}
                chainId={chainId}
              />
            )}
          </div>
        )}

        {!isLoading && poolsData.length === 0 && (
          <div className="space-y-6">
            {/* Show history section if user has historical trades */}
            {historicalPoolsData.length > 0 && (
              <Card className="border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                    Trading History
                  </CardTitle>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {historicalPoolsData.length} completed position{historicalPoolsData.length !== 1 ? 's' : ''} with total P&L of {totalPnL.toFixed(4)} {poolsData[0]?.baseTokenSymbol || 'UNKNOWN'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {historicalPoolsData.map((pool) => (
                      <HistoryCard key={pool.id} pool={pool} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No positions message */}
            {historicalPoolsData.length === 0 && (
              <Card className="p-8 text-center max-w-md mx-auto border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
                <CardTitle className="text-xl mb-2 text-neutral-900 dark:text-neutral-100">
                  No Positions Yet
                </CardTitle>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  You do not have any active or historical positions.
                </p>
                <Button onClick={() => router.push('/explore')}>
                  Explore Pools
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}