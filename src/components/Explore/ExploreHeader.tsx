import React from "react";
import { Plus, Wallet, RefreshCw } from "lucide-react";

interface ExploreHeaderProps {
  isConnected: boolean;
  currentChainName: string;
  supportedChainsCount: number;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  isCreatingPool: boolean;
  onCreate: () => void;
  isWalletConnectedChainSupported: boolean;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({
  isConnected,
  currentChainName,
  supportedChainsCount,
  loading,
  refreshing,
  onRefresh,
  isCreatingPool,
  onCreate,
  isWalletConnectedChainSupported,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-4xl font-bold text-black dark:text-white mb-2">
          Explore Fate Pools
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected && currentChainName
              ? `Connected to ${currentChainName}`
              : `Browse pools across ${supportedChainsCount} supported chains`}
          </p>
          <button
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50 self-start sm:self-auto"
            type="button"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={onCreate}
          disabled={isCreatingPool || !isConnected || !isWalletConnectedChainSupported}
          className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition transform hover:scale-105 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-black dark:border-white text-sm md:text-base flex-1 md:flex-none justify-center"
          type="button"
        >
          <Plus size={18} className="md:w-5 md:h-5" />
          <span className="hidden sm:inline">
            {isCreatingPool ? "Creating..." : "Create New Pool"}
          </span>
          <span className="sm:hidden">
            {isCreatingPool ? "Creating..." : "Create Pool"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ExploreHeader;