import React from "react";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import PoolTableView from "./PoolTableView";
import type { Pool } from "@/lib/types";
import { getPriceFeedName as getPriceFeedNameUtil } from "@/utils/supportedChainFeed";
import { getChainConfig } from "@/utils/chainConfig";
import { getHebeswapPairByAddress } from "@/utils/hebeswapConfig";

// Helper function to get oracle name/description
const getOracleName = (oracleAddress: string, chainId: number): string => {
  if (chainId === 61) {
    // Ethereum Classic - check if it's a Hebeswap pair
    const hebeswapPair = getHebeswapPairByAddress(oracleAddress);
    if (hebeswapPair) {
      return `${hebeswapPair.baseTokenSymbol}/${hebeswapPair.quoteTokenSymbol} Pair`;
    }
    return `${oracleAddress.slice(0, 6)}...${oracleAddress.slice(-4)}`;
  } else {
    // Other chains - use Chainlink price feed names
    return getPriceFeedNameUtil(oracleAddress, chainId);
  }
};

interface PoolListProps {
  loading: boolean;
  filteredPools: Pool[];
  groupedPools: Record<number, Pool[]>;
  sortedChainIds: number[];
  searchQuery: string;
  onUsePool: (poolId: string) => void;
  onClearSearch: () => void;
  currentChainId?: number;
  isConnected?: boolean;
  isConnectedChainSupported?: boolean;
  viewMode: 'grid' | 'table';
}

const PoolList: React.FC<PoolListProps> = ({
  loading,
  filteredPools,
  groupedPools,
  sortedChainIds,
  searchQuery,
  onUsePool,
  onClearSearch,
  currentChainId,
  isConnected,
  isConnectedChainSupported,
  viewMode,
}) => {
  if (loading) {
    if (viewMode === 'table') {
      return (
        <div className="overflow-x-auto">
          <div className="w-full border-collapse">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-5 gap-4 py-3 px-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-5 gap-4 py-4 px-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (filteredPools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {searchQuery ? "No pools match your search" : "No pools found"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {searchQuery
            ? "Try adjusting your search terms or clear the search to see all pools."
            : !isConnected
            ? "Please connect your wallet to view pools on your connected chain."
            : !isConnectedChainSupported
            ? "Please switch to a supported chain to view pools."
            : currentChainId
            ? `No prediction pools have been created yet on ${getChainConfig(currentChainId)?.name || `Chain ${currentChainId}`}.`
            : "No prediction pools have been created yet on the connected chain."}
        </p>
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="text-blue-600 hover:text-blue-500 font-medium"
            type="button"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="space-y-8">
        {sortedChainIds.map((chainId) => (
          <div key={chainId}>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
              Pools on {getChainConfig(chainId)?.name || `Chain ${chainId}`}
            </h2>
            <PoolTableView
              pools={groupedPools[chainId]}
              onUsePool={onUsePool}
              isConnected={isConnected || false}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sortedChainIds.map((chainId) => (
        
        <div key={chainId}>
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
            Pools on {getChainConfig(chainId)?.name || `Chain ${chainId}`}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groupedPools[chainId].map((pool) => (
              <div key={pool.id} className="relative">
                <PredictionCard
                  name={pool.name}
                  baseToken={pool.baseToken}
                  creator={pool.creator}
                  priceFeed={getOracleName(pool.priceFeedAddress, pool.chainId)}
                  bullCoinName={pool.bullToken.name}
                  bullCoinSymbol={pool.bullToken.symbol}
                  bearCoinName={pool.bearToken.name}
                  bearCoinSymbol={pool.bearToken.symbol}
                  bullPercentage={pool.bullPercentage}
                  bearPercentage={pool.bearPercentage}
                  fees={{
                    mint: pool.mintFee ?? 0,
                    burn: pool.burnFee ?? 0,
                    creator: pool.vaultCreatorFee,
                    treasury: pool.treasuryFee,
                  }}
                  chainName={pool.chainName}
                  onUse={() => onUsePool(pool.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PoolList;