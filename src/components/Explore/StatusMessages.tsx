import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ChainLoadingState } from "@/lib/types";

interface StatusMessagesProps {
  loading: boolean;
  chainStates: ChainLoadingState[];
  isConnected: boolean;
  isConnectedChainSupported: boolean;
  currentChainName: string;
  supportedChainsList: string;
  getChainConfig: (chainId: number) => { chain: unknown; name: string } | null;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({
  loading,
  chainStates,
  isConnected,
  isConnectedChainSupported,
  currentChainName,
  supportedChainsList,
  getChainConfig,
}) => {
  const loadingChains = chainStates.some((state) => state.loading);
  const chainsWithErrors = chainStates.filter((state) => state.error);

  return (
    <>
      {(loading || loadingChains) && (
        <div className="flex justify-between mb-6 p-4 bg-black/10 dark:bg-white/10 border border-[#3b3b3b] dark:border-[#c7c9c8] rounded-lg">
          <div className="flex items-center gap-2 text-black dark:text-white mb-2">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm font-medium text-black dark:text-white">Loading pools from chains...</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-black dark:text-white">
            {chainStates.map((state) => {
              const chainName = getChainConfig(state.chainId)?.name ?? `Chain ${state.chainId}`;
              return (
                <div key={state.chainId} className="flex items-center gap-1">
                  <span className="dark:text-white">{chainName}:</span>
                  <span
                    className={`font-medium ${
                      state.loading
                        ? "text-gray-600 dark:text-gray-400"
                        : state.error
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {state.loading ? "Loading..." : state.error ? "Error" : `${state.poolCount} pools`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {chainsWithErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Some chains encountered errors:</span>
          </div>
          <div className="text-xs space-y-1">
            {chainsWithErrors.map((state) => {
              const chainName = getChainConfig(state.chainId)?.name ?? `Chain ${state.chainId}`;
              return (
                <div key={state.chainId} className="text-red-700 dark:text-red-300">
                  {chainName}: {state.error}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle size={16} />
            <span className="text-sm">
              Connect your wallet to create pools or interact with existing ones.
            </span>
          </div>
        </div>
      )}

      {isConnected && !isConnectedChainSupported && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <AlertCircle size={16} />
            <span className="text-sm">
              You&apos;re connected to &quot;{currentChainName}&quot; which is not supported. Please switch to: {supportedChainsList}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default StatusMessages;
