import React from "react";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import type { Pool } from "@/lib/types";
import { getPriceFeedName as getPriceFeedNameUtil } from "@/utils/supportedChainFeed";
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

interface PoolTableViewProps {
  pools: Pool[];
  onUsePool: (poolId: string) => void;
  isConnected: boolean;
}

const PoolTableView: React.FC<PoolTableViewProps> = ({ pools, onUsePool, isConnected }) => {
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const formatFee = (value: number) => `${value.toFixed(2)}%`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-white/5">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6 sm:py-4">
                Pool Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6 sm:py-4">
                Price Feed
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6 sm:py-4">
                Bull/Bear Split
              </th>
              <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell sm:px-6 sm:py-4">
                Fees
              </th>
              <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell sm:px-6 sm:py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {pools.map((pool) => (
              <tr
                key={pool.id}
                onClick={() => onUsePool(pool.id)}
                className="group cursor-pointer transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="px-4 py-4 sm:px-6">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                      {pool.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {pool.bullToken.symbol} / {pool.bearToken.symbol}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {getOracleName(pool.priceFeedAddress, pool.chainId)}
                  </div>
                  <div className="hidden text-xs text-gray-500 dark:text-gray-400 md:block mt-0.5">
                    {formatAddress(pool.priceFeedAddress)}
                  </div>
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <TrendingUp size={14} className="shrink-0" />
                      <span className="text-sm font-medium">
                        {formatPercentage(pool.bullPercentage)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <TrendingDown size={14} className="shrink-0" />
                      <span className="text-sm font-medium">
                        {formatPercentage(pool.bearPercentage)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-4 md:table-cell sm:px-6">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between gap-2">
                      <span>Mint:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {formatFee(pool.mintFee ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Burn:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {formatFee(pool.burnFee ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Creator:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {formatFee(pool.vaultCreatorFee)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Treasury:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {formatFee(pool.treasuryFee)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-4 md:table-cell sm:px-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUsePool(pool.id);
                    }}
                    disabled={!isConnected}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                    type="button"
                  >
                    <ExternalLink size={16} />
                    {isConnected ? "Use Pool" : "Connect"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PoolTableView;
