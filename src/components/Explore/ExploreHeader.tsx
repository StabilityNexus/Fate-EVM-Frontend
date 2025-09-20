import React from "react";
import { Plus, Wallet, RefreshCw } from "lucide-react";

interface ExploreHeaderProps {
  isConnected: boolean;
  currentChainName: string;
  supportedChainsList: string;
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
  supportedChainsList,
  loading,
  refreshing,
  onRefresh,
  isCreatingPool,
  onCreate,
  isWalletConnectedChainSupported,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
          Explore Fate Pools
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected && currentChainName
              ? `Connected to ${currentChainName}`
              : `Browse pools across ${supportedChainsList}`}
          </p>
          <button
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
            type="button"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4 md:mt-0">
        {!isConnected && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Wallet size={16} />
            <span>Connect wallet to interact</span>
          </div>
        )}
        <button
          onClick={onCreate}
          disabled={isCreatingPool || !isConnected || !isWalletConnectedChainSupported}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition transform hover:scale-105 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-black dark:border-white"
          type="button"
        >
          <Plus size={20} />
          {isCreatingPool ? "Creating..." : "Create New Pool"}
        </button>
      </div>
    </div>
  );
};

export default ExploreHeader;