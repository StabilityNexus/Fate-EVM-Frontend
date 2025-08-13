"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle, Wallet } from "lucide-react";
import { formatUnits } from "viem";
import { FatePoolFactories } from "@/utils/addresses";
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

interface Token {
  id: string;
  asset: string;
  name: string;
  symbol: string;
  vault_creator: string;
  vault_fee: number;
  vault_creator_fee: number;
  treasury_fee: number;
  supply: number;
  priceBuy: number;
  priceSell: number;
  prediction_pool: string;
  other_token: string;
}

interface Pool {
  id: string;
  name: string;
  oracle: string;
  feedId: string;
  bullPercentage: number;
  bearPercentage: number;
  bullToken: Token;
  bearToken: Token;
  chainId: number;
  chainName: string;
}

// Helper function to get supported chain names
const getSupportedChains = (): string => {
  const chainNames: { [key: number]: string } = {
    11155111: "Sepolia Testnet",
  };
  
  return Object.keys(FatePoolFactories)
    .map(chainId => chainNames[Number(chainId)] || `Chain ${chainId}`)
    .join(", ");
};

// Create public clients for supported chains
const getChainConfig = (chainId: number) => {
  switch (chainId) {
    case 11155111:
      return { chain: sepolia, name: "Sepolia Testnet" };
    default:
      return null;
  }
};

export default function ExploreFatePools() {
  const router = useRouter();
  const { isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const connectedPublicClient = usePublicClient();

  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingPool, setIsCreatingPool] = useState(false);

  // Check if connected chain is supported
  const isConnectedChainSupported = chain?.id ? Boolean(FatePoolFactories[chain.id]) : false;

  const fetchCoin = useCallback(async (
    coinAddr: string, 
    other: string, 
    poolAddr: string,
    publicClient: any
  ): Promise<Token | null> => {
    if (!publicClient) return null;

    try {
      const [
        cname, csymbol, ccreator, cvaultFee, csupply, cpriceBuy, cpriceSell,
        ctreasuryFee, ccreatorFee, casset
      ] = await Promise.all([
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "name" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "symbol" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "vaultCreator" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "vaultFee" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "totalSupply" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "priceBuy" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "priceSell" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "treasuryFee" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "vaultCreatorFee" 
        }),
        publicClient.readContract({ 
          address: coinAddr as `0x${string}`, 
          abi: CoinABI, 
          functionName: "asset" 
        }),
      ]);

      return {
        id: coinAddr,
        prediction_pool: poolAddr,
        other_token: other,
        asset: casset as string,
        name: cname as string,
        symbol: csymbol as string,
        vault_creator: ccreator as string,
        vault_fee: Number(cvaultFee),
        vault_creator_fee: Number(ccreatorFee),
        treasury_fee: Number(ctreasuryFee),
        supply: Number(formatUnits(csupply as bigint, 18)),
        priceBuy: Number(formatUnits(cpriceBuy as bigint, 5)),
        priceSell: Number(formatUnits(cpriceSell as bigint, 5)),
      };
    } catch (error) {
      console.error(`Error fetching coin data for ${coinAddr}:`, error);
      return null;
    }
  }, []);

  const fetchPoolsFromChain = useCallback(async (chainId: number, factoryAddress: string) => {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) return [];

    try {
      // Create public client for this specific chain
      const publicClient = createPublicClient({
        chain: chainConfig.chain,
        transport: http()
      });

      // Fetch all pool addresses from factory
      const poolAddresses = (await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: PredictionPoolFactoryABI,
        functionName: "getAllPools",
      })) as `0x${string}`[];

      if (poolAddresses.length === 0) {
        return [];
      }

      // Fetch pool details for each address
      const poolPromises = poolAddresses.map(async (addr) => {
        try {
          const [name, oracle, feedId, bullAddr, bearAddr] = await Promise.all([
            publicClient.readContract({ 
              address: addr, 
              abi: PredictionPoolABI, 
              functionName: "name" 
            }),
            publicClient.readContract({ 
              address: addr, 
              abi: PredictionPoolABI, 
              functionName: "oracle" 
            }),
            publicClient.readContract({ 
              address: addr, 
              abi: PredictionPoolABI, 
              functionName: "priceFeedId" 
            }),
            publicClient.readContract({ 
              address: addr, 
              abi: PredictionPoolABI, 
              functionName: "bullCoin" 
            }),
            publicClient.readContract({ 
              address: addr, 
              abi: PredictionPoolABI, 
              functionName: "bearCoin" 
            }),
          ]);

          // Fetch token details
          const [bull, bear] = await Promise.all([
            fetchCoin(bullAddr as string, bearAddr as string, addr, publicClient),
            fetchCoin(bearAddr as string, bullAddr as string, addr, publicClient),
          ]);

          if (!bull || !bear) {
            console.warn(`Failed to fetch token data for pool ${addr} on chain ${chainId}`);
            return null;
          }

          // Calculate percentages
          const totalValue = bull.priceBuy * bull.supply + bear.priceBuy * bear.supply;
          const bullPercentage = totalValue > 0 ? (bull.priceBuy * bull.supply) / totalValue * 100 : 50;
          const bearPercentage = 100 - bullPercentage;

          return {
            id: addr,
            name: name as string,
            oracle: oracle as string,
            feedId: feedId as string,
            bullPercentage,
            bearPercentage,
            bullToken: bull,
            bearToken: bear,
            chainId,
            chainName: chainConfig.name,
          } as Pool;
        } catch (error) {
          console.error(`Error loading pool ${addr} on chain ${chainId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(poolPromises);
      return results.filter((pool): pool is Pool => pool !== null);
    } catch (error) {
      console.error(`Failed to fetch pools from chain ${chainId}:`, error);
      return [];
    }
  }, [fetchCoin]);

  const fetchAllPools = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch pools from all supported chains
      const chainPromises = Object.entries(FatePoolFactories).map(([chainId, factoryAddress]) => 
        fetchPoolsFromChain(Number(chainId), factoryAddress)
      );

      const results = await Promise.all(chainPromises);
      const allPools = results.flat();
      
      setPools(allPools);
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      toast.error("Failed to fetch pools. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchPoolsFromChain]);

  useEffect(() => {
    fetchAllPools();
  }, [fetchAllPools]);

  const handleCreate = useCallback(() => {
    if (!isConnected || !walletClient) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!isConnectedChainSupported) {
      toast.error(
        `Please switch to a supported chain: ${getSupportedChains()}`
      );
      return;
    }

    setIsCreatingPool(true);
    router.push("/createPool");
  }, [isConnected, router, walletClient, isConnectedChainSupported]);

  const handleUsePool = useCallback((poolId: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to use this pool.");
      return;
    }
    router.push(`/pool?id=${poolId}`);
  }, [isConnected, router]);

  const filteredPools = pools.filter(pool =>
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.bullToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.bearToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.chainName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-28 min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
              Explore Fate Pools
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected && chain ? (
                `Connected to ${chain.name}`
              ) : (
                `Browse pools across ${getSupportedChains()}`
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isConnected && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Wallet size={16} />
                <span>Connect wallet to interact</span>
              </div>
            )}
            <button
              onClick={handleCreate}
              disabled={isCreatingPool || !isConnected || !isConnectedChainSupported}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition transform hover:scale-105 dark:bg-white dark:text-black shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Plus size={20} />
              {isCreatingPool ? "Creating..." : "Create New Pool"}
            </button>
          </div>
        </div>

        {/* Connection Status Warning for Creation */}
        {!isConnected && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle size={16} />
              <span className="text-sm">
                Connect your wallet to create pools or interact with existing ones. You can still browse all available pools.
              </span>
            </div>
          </div>
        )}

        {/* Unsupported Chain Warning */}
        {isConnected && chain && !isConnectedChainSupported && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertCircle size={16} />
              <span className="text-sm">
                You&apos;re connected to &quot;{chain.name}&quot; which is not supported. Switch to {getSupportedChains()} to create pools or interact with them.
              </span>
            </div>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search pools by name, token symbol, or chain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-colors"
        />

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filteredPools.length > 0 ? (
          /* Pools Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPools.map((pool) => (
              <div key={pool.id} className="relative">
                <PredictionCard
                  name={pool.name}
                  bullCoinName={pool.bullToken.name}
                  bullCoinSymbol={pool.bullToken.symbol}
                  bearCoinName={pool.bearToken.name}
                  bearCoinSymbol={pool.bearToken.symbol}
                  bullPercentage={pool.bullPercentage}
                  bearPercentage={pool.bearPercentage}
                  onUse={() => handleUsePool(pool.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg 
                className="h-16 w-16 mx-auto" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
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
                : "No prediction pools have been created yet across the supported networks."
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}