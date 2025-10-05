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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 md:py-3 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Pool Name</th>
            <th className="text-left py-2 px-3 md:py-3 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Price Feed</th>
            <th className="text-left py-2 px-3 md:py-3 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Bull/Bear Split</th>
            <th className="hidden md:table-cell text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Fees</th>
            <th className="hidden md:table-cell text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pools.map((pool) => (
            <tr 
              key={pool.id} 
              onClick={() => onUsePool(pool.id)}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer md:cursor-default"
            >
              <td className="py-3 px-3 md:py-4 md:px-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm md:text-base">{pool.name}</div>
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    {pool.bullToken.symbol} / {pool.bearToken.symbol}
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 md:py-4 md:px-4">
                <div className="text-xs md:text-sm text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {getOracleName(pool.priceFeedAddress, pool.chainId)}
                </div>
                <div className="hidden md:block text-xs text-gray-500 dark:text-gray-400">
                  {formatAddress(pool.priceFeedAddress)}
                </div>
              </td>
              <td className="py-3 px-3 md:py-4 md:px-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp size={12} className="md:w-3.5 md:h-3.5" />
                    <span className="text-xs md:text-sm font-medium">{formatPercentage(pool.bullPercentage)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <TrendingDown size={12} className="md:w-3.5 md:h-3.5" />
                    <span className="text-xs md:text-sm font-medium">{formatPercentage(pool.bearPercentage)}</span>
                  </div>
                </div>
              </td>
              <td className="hidden md:table-cell py-4 px-4">
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-900 dark:text-white">
                  <div>Mint: {formatFee(pool.mintFee ?? 0)}</div>
                  <div>Burn: {formatFee(pool.burnFee ?? 0)}</div>
                  <div>Creator: {formatFee(pool.vaultCreatorFee)}</div>
                  <div>Treasury: {formatFee(pool.treasuryFee)}</div>
                </div>
              </td>
              <td className="hidden md:table-cell py-4 px-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUsePool(pool.id);
                  }}
                  disabled={!isConnected}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  type="button"
                >
                  <ExternalLink size={14} />
                  {isConnected ? "Use Pool" : "Connect to Use"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PoolTableView;
