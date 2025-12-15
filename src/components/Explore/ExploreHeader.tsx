import React from "react";
import { Plus, RefreshCw } from "lucide-react";

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
        <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white tracking-tight mb-3">
          Explore Fate Pools
        </h1>
        <p className="text-lg md:text-xl font-medium text-gray-500 dark:text-gray-400 mb-4 max-w-2xl">
          Predict markets. Stake conviction. Earn outcomes.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-900 px-3 py-1 rounded-full inline-block">
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
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all transform hover:scale-105 hover:shadow-xl dark:bg-white dark:text-black dark:hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-transparent font-bold text-sm md:text-base flex-1 md:flex-none justify-center min-w-[160px]"
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