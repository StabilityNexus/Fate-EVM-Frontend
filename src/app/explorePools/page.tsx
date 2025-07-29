"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle } from "lucide-react";
import { formatUnits } from "viem";
import { FatePoolFactories } from "@/utils/addresses";

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
}

// Helper function to get supported chain names
const getSupportedChains = (): string => {
  const chainNames: { [key: number]: string } = {
    1: "Ethereum Mainnet",
    11155111: "Sepolia Testnet",
  };
  
  return Object.keys(FatePoolFactories)
    .map(chainId => chainNames[Number(chainId)] || `Chain ${chainId}`)
    .join(", ");
};

export default function ExploreFatePools() {
  const router = useRouter();
  const { isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingPool, setIsCreatingPool] = useState(false);

  // Get factory address based on current chain
  const FACTORY_ADDRESS = chain?.id ? FatePoolFactories[chain.id] : undefined;
  const isChainSupported = chain?.id ? Boolean(FatePoolFactories[chain.id]) : false;

  const fetchCoin = useCallback(async (
    coinAddr: string, 
    other: string, 
    poolAddr: string
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
  }, [publicClient]);

  const fetchPools = useCallback(async () => {
    if (!publicClient || !FACTORY_ADDRESS || !isChainSupported) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all pool addresses from factory
      const poolAddresses = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: PredictionPoolFactoryABI,
        functionName: "getAllPools",
      })) as `0x${string}`[];

      if (poolAddresses.length === 0) {
        setPools([]);
        return;
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
            fetchCoin(bullAddr as string, bearAddr as string, addr),
            fetchCoin(bearAddr as string, bullAddr as string, addr),
          ]);

          if (!bull || !bear) {
            console.warn(`Failed to fetch token data for pool ${addr}`);
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
          } as Pool;
        } catch (error) {
          console.error(`Error loading pool ${addr}:`, error);
          return null;
        }
      });

      const results = await Promise.all(poolPromises);
      const validPools = results.filter((pool): pool is Pool => pool !== null);
      
      setPools(validPools);
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      toast.error("Failed to fetch pools. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [publicClient, FACTORY_ADDRESS, isChainSupported, fetchCoin]);

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      setPools([]);
      return;
    }

    if (chain?.id && !isChainSupported) {
      toast.error(
        `Chain "${chain.name}" is not supported. Please switch to one of: ${getSupportedChains()}`
      );
      setLoading(false);
      setPools([]);
      return;
    }

    fetchPools();
  }, [fetchPools, isConnected, chain, isChainSupported]);

  const handleCreate = useCallback(() => {
    if (!isConnected || !walletClient) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!isChainSupported) {
      toast.error(
        `Please switch to a supported chain: ${getSupportedChains()}`
      );
      return;
    }

    setIsCreatingPool(true);
    router.push("/createPool");
  }, [isConnected, router, walletClient, isChainSupported]);

  const filteredPools = pools.filter(pool =>
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.bullToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.bearToken.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render unsupported chain message
  if (isConnected && chain && !isChainSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
              Unsupported Chain
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              You&apos;re currently connected to &quot;{chain.name}&quot; which is not supported. 
              Please switch to one of the following supported chains:
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {getSupportedChains()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render connect wallet message
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to explore Fate Pools
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
              Explore Fate Pools
            </h1>
            {chain && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connected to {chain.name}
              </p>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreatingPool || !isChainSupported}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition transform hover:scale-105 dark:bg-white dark:text-black shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Plus size={20} />
            {isCreatingPool ? "Creating..." : "Create New Pool"}
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search pools by name or token symbol..."
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
              <PredictionCard
                key={pool.id}
                name={pool.name}
                bullCoinName={pool.bullToken.name}
                bullCoinSymbol={pool.bullToken.symbol}
                bearCoinName={pool.bearToken.name}
                bearCoinSymbol={pool.bearToken.symbol}
                bullPercentage={pool.bullPercentage}
                bearPercentage={pool.bearPercentage}
                onUse={() => router.push(`/pool?id=${pool.id}`)}
              />
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
                : "Be the first to create a prediction pool on this network!"
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