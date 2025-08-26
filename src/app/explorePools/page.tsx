"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatUnits, isAddress, Address, PublicClient, createPublicClient, http } from "viem";
import { FatePoolFactories } from "@/utils/addresses";
import { getPriceFeedName } from "@/utils/supportedChainFeed";
import { getChainConfig } from "@/utils/chainConfig";
import type { Token, Pool, ChainLoadingState } from "@/lib/types";

// Import the reusable sub-components
import ExploreHeader from "@/components/Explore/ExploreHeader";
import PoolSearch from "@/components/Explore/PoolSearch";
import StatusMessages from "@/components/Explore/StatusMessages";
import PoolList from "@/components/Explore/PoolList";

// Constants for configuration
const DENOMINATOR = 100_000;
const BATCH_SIZE = 3;
const BATCH_DELAY = 200;
const FETCH_COOLDOWN = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Type for factory addresses
type FactoryAddresses = Record<string, string>;

// Helper function
const getSupportedChains = (): string => {
  return Object.keys(FatePoolFactories as FactoryAddresses)
    .map(chainId => getChainConfig(Number(chainId))?.name || `Chain ${chainId}`)
    .join(", ");
};

export default function ExploreFatePools() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreatingPool, setIsCreatingPool] = useState<boolean>(false);
  const [chainStates, setChainStates] = useState<ChainLoadingState[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Memoize supported chain IDs for efficiency
  const supportedChainIds = useMemo((): number[] =>
    Object.keys(FatePoolFactories as FactoryAddresses).map(Number),
    []
  );

  const isConnectedChainSupported = useMemo((): boolean =>
    currentChainId ? supportedChainIds.includes(currentChainId) : false,
    [currentChainId, supportedChainIds]
  );

  useEffect(() => {
    const initialStates: ChainLoadingState[] = supportedChainIds.map(chainId => ({
      chainId,
      loading: false,
      error: null,
      poolCount: 0
    }));
    setChainStates(initialStates);
  }, [supportedChainIds]);

  const updateChainState = useCallback((chainId: number, updates: Partial<ChainLoadingState>): void => {
    setChainStates(prev => prev.map(state =>
      state.chainId === chainId
        ? { ...state, ...updates }
        : state
    ));
  }, []);

  const fetchCoin = useCallback(async (
    coinAddr: string,
    other: string,
    poolAddr: string,
    publicClient: PublicClient
  ): Promise<Token | null> => {
    if (!publicClient || !isAddress(coinAddr) || coinAddr === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    try {
      const coinAddress = coinAddr as Address;
      const [
        cname, csymbol, ccreator, cvaultFee, csupply, cpriceBuy, cpriceSell,
        ctreasuryFee, ccreatorFee, casset
      ] = await Promise.all([
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "name" }).catch((): string => "Unknown"),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "symbol" }).catch((): string => "N/A"),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "vaultCreator" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "vaultFee" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "totalSupply" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "priceBuy" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "priceSell" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "treasuryFee" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "creatorFee" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "asset" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
      ]);
      return {
        id: coinAddress, prediction_pool: poolAddr as Address, other_token: other as Address, asset: casset as Address,
        name: cname as string, symbol: csymbol as string, vault_creator: ccreator as Address, vault_fee: cvaultFee as bigint,
        vault_creator_fee: ccreatorFee as bigint, treasury_fee: ctreasuryFee as bigint, asset_balance: BigInt(0), supply: csupply as bigint,
        priceBuy: Number(formatUnits(cpriceBuy as bigint, 5)), priceSell: Number(formatUnits(cpriceSell as bigint, 5)),
      };
    } catch (error) {
      console.error(`Error fetching coin data for ${coinAddr}:`, error);
      return null;
    }
  }, []);

  const fetchPoolsFromChain = useCallback(async (chainId: number, factoryAddress: string): Promise<Pool[]> => {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig || !isAddress(factoryAddress)) {
      updateChainState(chainId, { error: `Unsupported chain or invalid factory address`, loading: false });
      return [];
    }

    let retries = MAX_RETRIES;

    while (retries > 0) {
      try {
        updateChainState(chainId, { loading: true, error: null });
        const publicClient = createPublicClient({ 
          chain: chainConfig.chain, 
          transport: http(), 
          batch: { multicall: true } 
        });
        
        // Test connection first
        await publicClient.getBlockNumber();
        
        const poolAddresses = (await publicClient.readContract({
          address: factoryAddress as Address,
          abi: PredictionPoolFactoryABI,
          functionName: "getAllPools"
        }).catch(() => [])) as Address[];

        updateChainState(chainId, { poolCount: poolAddresses.length });

        if (poolAddresses.length === 0) {
          updateChainState(chainId, { loading: false });
          return [];
        }

        const pools: Pool[] = [];
        for (let i = 0; i < poolAddresses.length; i += BATCH_SIZE) {
          const batch = poolAddresses.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (addr: Address): Promise<Pool | null> => {
            if (!isAddress(addr)) { console.warn(`Invalid pool address: ${addr}`); return null; }
            const [name, baseToken, priceFeedAddress, bullAddr, bearAddr, vaultCreator, vaultFee, vaultCreatorFee, treasuryFee] = await Promise.all([
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "poolName" }).catch((): string => "Unknown Pool"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "baseToken" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "priceFeed" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "bullCoin" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "bearCoin" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "vaultCreator" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "vaultFee" }).catch((): bigint => BigInt(0)),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "vaultCreatorFee" }).catch((): bigint => BigInt(0)),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "treasuryFee" }).catch((): bigint => BigInt(0)),
            ]);
            const [bull, bear] = await Promise.all([fetchCoin(bullAddr as Address, bearAddr as Address, addr, publicClient), fetchCoin(bearAddr as Address, bullAddr as Address, addr, publicClient)]);
            if (!bull || !bear) { console.warn(`Failed to fetch token data for pool ${addr} on chain ${chainId}`); return null; }
            const bullSupply = Number(formatUnits(bull.supply, 18));
            const bearSupply = Number(formatUnits(bear.supply, 18));
            const bullPriceBuy = bull.priceBuy ?? 0;
            const bearPriceBuy = bear.priceBuy ?? 0;
            const totalValue = bullPriceBuy * bullSupply + bearPriceBuy * bearSupply;
            const bullPercentage = totalValue > 0 ? (bullPriceBuy * bullSupply / totalValue * 100) : 50;
            const bearPercentage = 100 - bullPercentage;
            const pool: Pool = { id: addr, name: name as string, baseToken: baseToken as Address, priceFeedAddress: priceFeedAddress as Address, creator: vaultCreator as Address, bullPercentage: bullPercentage, bearPercentage: bearPercentage, bullToken: bull, bearToken: bear, chainId, chainName: chainConfig.name, vaultFee: Number(vaultFee) / DENOMINATOR * 100, vaultCreatorFee: Number(vaultCreatorFee) / DENOMINATOR * 100, treasuryFee: Number(treasuryFee) / DENOMINATOR * 100, previous_price: BigInt(0) };
            return pool;
          });
          const successfulPools = (await Promise.all(batchPromises)).filter((pool): pool is Pool => pool !== null);
          pools.push(...successfulPools);
          if (i + BATCH_SIZE < poolAddresses.length) { await new Promise(res => setTimeout(res, BATCH_DELAY)); }
        }
        updateChainState(chainId, { loading: false, error: null });
        return pools;
      } catch (error) {
        retries--;
        
        if (retries > 0) {
          console.warn(`Retrying chain ${chainId} (${MAX_RETRIES - retries}/${MAX_RETRIES} attempts)...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          const errorMessage = `Failed to fetch pools from ${chainConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMessage, error);
          updateChainState(chainId, { loading: false, error: errorMessage });
          return [];
        }
      }
    }
    
    return []; // Should never reach here, but for type safety
  }, [fetchCoin, updateChainState]);

  const fetchAllPools = useCallback(async (showToast = true): Promise<void> => {
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) { if (showToast) { toast.info("Refreshed recently. Please wait a moment."); } return; }
    setLastFetchTime(now);
    setLoading(true);
    try {
      const chainsToFetch = isConnected && currentChainId ? [currentChainId] : supportedChainIds;

      const chainPromises = chainsToFetch.map(async (chainId: number) => {
        const factoryAddress = (FatePoolFactories as FactoryAddresses)[chainId.toString()];
        return fetchPoolsFromChain(chainId, factoryAddress);
      });
      const results = await Promise.allSettled(chainPromises);
      const allPools: Pool[] = [];
      let successfulChains = 0;
      let totalErrors = 0;
      results.forEach((result, index) => {
        const chainId = chainsToFetch[index];
        if (result.status === 'fulfilled') { allPools.push(...result.value); if (result.value.length > 0) { successfulChains++; } }
        else { totalErrors++; console.error(`Chain ${chainId} failed:`, result.reason); updateChainState(chainId, { loading: false, error: (result.reason as Error)?.message || 'Unknown error' }); }
      });
      const uniquePools = allPools.filter((pool, index, self) => index === self.findIndex(p => p.id === pool.id));
      setPools(uniquePools);
      const chainCount = chainsToFetch.length;
      const message = `Loaded ${uniquePools.length} pools from ${successfulChains}/${chainCount} chains`;
      if (showToast) {
        if (totalErrors > 0) { toast.warning(`${message}. ${totalErrors} chains had errors.`); }
        else if (uniquePools.length > 0) { toast.success(message); }
        else { toast.info('No pools found on any chain.'); }
      }
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      if (showToast) { toast.error("Failed to fetch pools. Please try again."); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPoolsFromChain, updateChainState, supportedChainIds, lastFetchTime, isConnected, currentChainId]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchAllPools();
  }, [fetchAllPools]);

  useEffect(() => {
    fetchAllPools(false);
  }, [fetchAllPools]);

  const handleCreate = useCallback((): void => {
    if (!isConnected || !walletClient) { toast.error("Please connect your wallet first."); return; }
    if (!isConnectedChainSupported) { toast.error(`Please switch to a supported chain: ${getSupportedChains()}`); return; }
    setIsCreatingPool(true);
    router.push("/createPool");
  }, [isConnected, router, walletClient, isConnectedChainSupported]);

  const handleUsePool = useCallback((poolId: string): void => {
    if (!isConnected) { toast.error("Please connect your wallet to use this pool."); return; }
    router.push(`/pool?id=${poolId}`);
  }, [isConnected, router]);

  const clearSearch = useCallback((): void => {
    setSearchQuery("");
  }, []);

  const filteredPools = useMemo(
    (): Pool[] =>
      pools.filter((pool: Pool) => {
        const searchLower = searchQuery.toLowerCase();
        const priceFeedName = getPriceFeedName(pool.priceFeedAddress, pool.chainId);
        return (
          pool.name.toLowerCase().includes(searchLower) ||
          pool.bullToken.symbol.toLowerCase().includes(searchLower) ||
          pool.bearToken.symbol.toLowerCase().includes(searchLower) ||
          pool.chainName.toLowerCase().includes(searchLower) ||
          priceFeedName.toLowerCase().includes(searchLower)
        );
      }),
    [pools, searchQuery]
  );

  const groupedPools = useMemo((): Record<number, Pool[]> => {
    const groups: Record<number, Pool[]> = {};
    filteredPools.forEach((pool: Pool) => {
      if (!groups[pool.chainId]) {
        groups[pool.chainId] = [];
      }
      groups[pool.chainId].push(pool);
    });
    return groups;
  }, [filteredPools]);

  const sortedChainIds = useMemo((): number[] => {
    const sorted = Object.keys(groupedPools).map(Number).sort();
    if (isConnected && currentChainId) {
      // Move connected chain to the top of the list if it's supported
      const connectedChainIndex = sorted.indexOf(currentChainId);
      if (connectedChainIndex > -1) {
        sorted.splice(connectedChainIndex, 1);
        sorted.unshift(currentChainId);
      }
    }
    return sorted;
  }, [groupedPools, isConnected, currentChainId]);

  const currentChainName = currentChainId ? getChainConfig(currentChainId)?.name || 'Unknown Chain' : 'Unknown Chain';

  return (
    <div className="pt-28 min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#1a1b1f] dark:to-[#1a1b1f] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <ExploreHeader
          isConnected={isConnected}
          currentChainName={currentChainName}
          supportedChainsList={getSupportedChains()}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          isCreatingPool={isCreatingPool}
          onCreate={handleCreate}
          isWalletConnectedChainSupported={isConnectedChainSupported}
        />
        <StatusMessages
          loading={loading}
          chainStates={chainStates}
          isConnected={isConnected}
          isConnectedChainSupported={isConnectedChainSupported}
          currentChainName={currentChainName}
          supportedChainsList={getSupportedChains()}
          getChainConfig={getChainConfig}
        />
        <PoolSearch
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          onClearSearch={clearSearch}
        />
        <PoolList
          loading={loading}
          filteredPools={filteredPools}
          groupedPools={groupedPools}
          sortedChainIds={sortedChainIds}
          searchQuery={searchQuery}
          onUsePool={handleUsePool}
          onClearSearch={clearSearch}
        />
      </div>
    </div>
  );
}