// src/app/explorePools/page.tsx
"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { ChainlinkOracleABI } from "@/utils/abi/ChainlinkOracle";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatUnits, isAddress, Address, PublicClient, createPublicClient, http } from "viem";
import { FatePoolFactories } from "@/utils/addresses";
import { getPriceFeedName } from "@/utils/supportedChainFeed";
import { getChainConfig } from "@/utils/chainConfig";
import type { Token, Pool, ChainLoadingState } from "@/lib/types";
import { useFatePoolsStorage } from "@/lib/fatePoolHook";
import type { SupportedChainId } from "@/utils/indexedDBTypes";

// Import the reusable sub-components
import ExploreHeader from "@/components/Explore/ExploreHeader";
import PoolSearch from "@/components/Explore/PoolSearch";
import StatusMessages from "@/components/Explore/StatusMessages";
import PoolList from "@/components/Explore/PoolList";
import { Loading } from "@/components/ui/loading";

// Constants for configuration
const DENOMINATOR = 100_000;
const BATCH_SIZE = 3;
const BATCH_DELAY = 200;
const FETCH_COOLDOWN = 5000;

// Type for factory addresses
type FactoryAddresses = Record<string, string>;

// Helper function
const getSupportedChains = (): string => {
  return Object.keys(FatePoolFactories as FactoryAddresses)
    .map(chainId => getChainConfig(Number(chainId))?.name || `Chain ${chainId}`)
    .join(", ");
};

// Client-side wrapper component
function ExploreFatePoolsClient() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreatingPool, setIsCreatingPool] = useState<boolean>(false);
  const [chainStates, setChainStates] = useState<ChainLoadingState[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const router = useRouter();
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const {
    isInitialized,
    isOnline,
    batchSavePools,
    batchSaveTokens,
    getAllPools,
    getTokensForPool,
    saveChainStatus,
  } = useFatePoolsStorage();

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
      poolCount: 0,
      chainName: getChainConfig(chainId)?.name || `Chain ${chainId}`
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
    publicClient: PublicClient,
    sourceChainId: SupportedChainId
  ): Promise<Token | null> => {
    if (!publicClient || !isAddress(coinAddr) || coinAddr === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    try {
      const coinAddress = coinAddr as Address;
      const [
        cname, csymbol, ccreator, cmintFee, cburnFee, ccreatorFee, ctreasuryFee, csupply, cpriceBuy, cpriceSell, casset
      ] = await Promise.all([
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "name" }).catch((): string => "Unknown"),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "symbol" }).catch((): string => "N/A"),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "vaultCreator" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "mintFee" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "burnFee" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "creatorFee" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "treasuryFee" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "totalSupply" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "priceBuy" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "priceSell" }).catch((): bigint => BigInt(0)),
        publicClient.readContract({ address: coinAddress, abi: CoinABI, functionName: "asset" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
      ]);
      const token: Token = {
        id: coinAddress, prediction_pool: poolAddr as Address, other_token: other as Address, asset: casset as Address,
        name: cname as string, symbol: csymbol as string, vault_creator: ccreator as Address, mint_fee: cmintFee as bigint,
        burn_fee: cburnFee as bigint, creator_fee: ccreatorFee as bigint, treasury_fee: ctreasuryFee as bigint, asset_balance: BigInt(0), supply: csupply as bigint,
        priceBuy: Number(formatUnits(cpriceBuy as bigint, 5)), priceSell: Number(formatUnits(cpriceSell as bigint, 5)),
      };
      if (isInitialized) {
        // Convert Token to TokenDetails format for storage
        const tokenDetails = {
          id: token.id,
          chainId: sourceChainId,
          prediction_pool: token.prediction_pool,
          other_token: token.other_token,
          asset: token.asset,
          name: token.name,
          symbol: token.symbol,
          vault_creator: token.vault_creator,
          mint_fee: token.mint_fee,
          burn_fee: token.burn_fee,
          creator_fee: token.creator_fee,
          treasury_fee: token.treasury_fee,
          asset_balance: token.asset_balance,
          supply: token.supply,
          priceBuy: token.priceBuy || 0,
          priceSell: token.priceSell || 0
        };
        await batchSaveTokens([tokenDetails]);
      }
      return token;
    } catch (error) {
      console.error(`Error fetching coin data for ${coinAddr}:`, error);
      return null;
    }
  }, [isInitialized, batchSaveTokens]);

  const fetchPoolsFromChain = useCallback(async (chainId: number, factoryAddress: string): Promise<Pool[]> => {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      updateChainState(chainId, { error: `Unsupported chain`, loading: false });
      return [];
    }
    
    // If factory address is zero, show error and return empty
    if (!isAddress(factoryAddress) || factoryAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`Chain ${chainId} has no factory address configured`);
      updateChainState(chainId, { error: `No factory address configured for this chain`, loading: false });
      return [];
    }
    
    // Try to fetch from factory first (when online)
    if (isOnline) {
      try {
        updateChainState(chainId, { loading: true, error: null });
        const publicClient = createPublicClient({
          chain: chainConfig.chain,
          transport: http(),
          batch: { multicall: true }
        });
        
        await publicClient.getBlockNumber();
        
        console.log(`Fetching pools from chain ${chainId} (${chainConfig.name}) using factory: ${factoryAddress}`);
        
        const poolAddresses = (await publicClient.readContract({
          address: factoryAddress as Address,
          abi: PredictionPoolFactoryABI,
          functionName: "getAllPools"
        }).catch((error) => {
          console.error(`Failed to call getAllPools on chain ${chainId}:`, error);
          return [];
        })) as Address[];

        console.log(`Found ${poolAddresses.length} pools on chain ${chainId}:`, poolAddresses);
        
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
            const [name, baseToken, oracleAddress, bullAddr, bearAddr, vaultCreator, mintFee, burnFee, creatorFee, treasuryFee] = await Promise.all([
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "poolName" }).catch((): string => "Unknown Pool"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "baseToken" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "oracle" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "bullCoin" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "bearCoin" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "vaultCreator" }).catch((): Address => "0x0000000000000000000000000000000000000000"),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "mintFee" }).catch((): bigint => BigInt(0)),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "burnFee" }).catch((): bigint => BigInt(0)),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "creatorFee" }).catch((): bigint => BigInt(0)),
              publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "treasuryFee" }).catch((): bigint => BigInt(0)),
            ]);

            // Get the underlying pricefeed address from the ChainlinkOracle contract
            // The factory creates a wrapper oracle that references the actual Chainlink pricefeed
            // We need to fetch the underlying pricefeed address to show users what they actually selected
            let underlyingPriceFeedAddress = oracleAddress as Address;
            if (oracleAddress && oracleAddress !== "0x0000000000000000000000000000000000000000") {
              try {
                const priceFeedAddress = await publicClient.readContract({
                  address: oracleAddress as Address,
                  abi: ChainlinkOracleABI,
                  functionName: "priceFeed"
                });
                underlyingPriceFeedAddress = priceFeedAddress as Address;
                console.log(`Pool ${addr}: Oracle ${oracleAddress} -> Underlying Pricefeed ${underlyingPriceFeedAddress}`);
              } catch (oracleError) {
                console.warn(`Failed to get underlying pricefeed from oracle ${oracleAddress}:`, oracleError);
                // Fallback to oracle address if we can't get the underlying pricefeed
                console.log(`Pool ${addr}: Using oracle address as fallback: ${oracleAddress}`);
              }
            } else {
              console.log(`Pool ${addr}: No oracle address found, using fallback`);
            }
            const [bull, bear] = await Promise.all([
              fetchCoin(bullAddr as Address, bearAddr as Address, addr, publicClient, chainId as SupportedChainId),
              fetchCoin(bearAddr as Address, bullAddr as Address, addr, publicClient, chainId as SupportedChainId)
            ]);
            if (!bull || !bear) { console.warn(`Failed to fetch token data for pool ${addr} on chain ${chainId}`); return null; }
            const bullSupply = Number(formatUnits(bull.supply, 18));
            const bearSupply = Number(formatUnits(bear.supply, 18));
            const bullPriceBuy = bull.priceBuy ?? 0;
            const bearPriceBuy = bear.priceBuy ?? 0;
            const totalValue = bullPriceBuy * bullSupply + bearPriceBuy * bearSupply;
            const bullPercentage = totalValue > 0 ? (bullPriceBuy * bullSupply / totalValue * 100) : 50;
            const bearPercentage = 100 - bullPercentage;
            const pool: Pool = { id: addr, name: name as string, baseToken: baseToken as Address, priceFeedAddress: underlyingPriceFeedAddress, creator: vaultCreator as Address, bullPercentage: bullPercentage, bearPercentage: bearPercentage, bullToken: bull, bearToken: bear, chainId, chainName: chainConfig.name, vaultFee: Number(mintFee) / DENOMINATOR * 100, vaultCreatorFee: Number(creatorFee) / DENOMINATOR * 100, treasuryFee: Number(treasuryFee) / DENOMINATOR * 100, mintFee: Number(mintFee) / DENOMINATOR * 100, burnFee: Number(burnFee) / DENOMINATOR * 100, previous_price: BigInt(0) };
            return pool;
          });
          const successfulPools = (await Promise.all(batchPromises)).filter((pool): pool is Pool => pool !== null);
          pools.push(...successfulPools);
          if (i + BATCH_SIZE < poolAddresses.length) { await new Promise(res => setTimeout(res, BATCH_DELAY)); }
        }
        
        if (isInitialized) {
          // Convert Pool to PoolDetails format for storage
          const poolDetails = pools.map(pool => ({
            id: pool.id,
            chainId: pool.chainId as SupportedChainId,
            name: pool.name,
            baseToken: pool.baseToken,
            priceFeedAddress: pool.priceFeedAddress,
            creator: pool.creator,
            bullPercentage: pool.bullPercentage,
            bearPercentage: pool.bearPercentage,
            vaultFee: pool.vaultFee,
            vaultCreatorFee: pool.vaultCreatorFee,
            treasuryFee: pool.treasuryFee,
            chainName: pool.chainName
          }));
          await batchSavePools(poolDetails);
          await saveChainStatus({
            chainId: chainId as SupportedChainId,
            chainName: chainConfig.name,
            poolCount: pools.length,
            lastSyncTime: Date.now(),
            isLoading: false,
            error: null
          });
        }

        updateChainState(chainId, { loading: false, error: null });
        return pools;
      } catch (error) {
        console.error(`Failed to fetch pools from factory on chain ${chainId}:`, error);
        // Fall back to cached data if factory fetch fails
      }
    }
    
    // Fallback to cached data when offline or factory fetch fails
    if (isInitialized) {
      console.log(`Falling back to cached data for chain ${chainId}`);
      try {
        const cachedPools = await getAllPools();
        const filteredPools = cachedPools.filter(p => p.chainId === chainId);
        updateChainState(chainId, { poolCount: filteredPools.length, loading: false });
        
        const convertedPools: Pool[] = [];
        for (const poolDetails of filteredPools) {
          try {
            const tokenDetails = await getTokensForPool(poolDetails.id);
            if (tokenDetails.length === 2) {
              const bullDetails = tokenDetails.find(t => t.symbol.includes('BULL'));
              const bearDetails = tokenDetails.find(t => t.symbol.includes('BEAR'));

              if (bullDetails && bearDetails) {
                const bull: Token = {
                  ...bullDetails,
                  id: bullDetails.id as Address,
                  prediction_pool: bullDetails.prediction_pool as Address,
                  other_token: bullDetails.other_token as Address,
                  asset: bullDetails.asset as Address,
                  vault_creator: bullDetails.vault_creator as Address,
                  mint_fee: bullDetails.mint_fee as bigint,
                  burn_fee: bullDetails.burn_fee as bigint,
                  creator_fee: bullDetails.creator_fee as bigint,
                  treasury_fee: bullDetails.treasury_fee as bigint,
                };
                const bear: Token = {
                  ...bearDetails,
                  id: bearDetails.id as Address,
                  prediction_pool: bearDetails.prediction_pool as Address,
                  other_token: bearDetails.other_token as Address,
                  asset: bearDetails.asset as Address,
                  vault_creator: bearDetails.vault_creator as Address,
                  mint_fee: bearDetails.mint_fee as bigint,
                  burn_fee: bearDetails.burn_fee as bigint,
                  creator_fee: bearDetails.creator_fee as bigint,
                  treasury_fee: bearDetails.treasury_fee as bigint,
                };
                
                convertedPools.push({
                  id: poolDetails.id as Address,
                  name: poolDetails.name,
                  baseToken: poolDetails.baseToken as Address,
                  priceFeedAddress: poolDetails.priceFeedAddress as Address,
                  creator: poolDetails.creator as Address,
                  chainId: poolDetails.chainId,
                  chainName: poolDetails.chainName,
                  vaultFee: poolDetails.vaultFee,
                  vaultCreatorFee: poolDetails.vaultCreatorFee,
                  treasuryFee: poolDetails.treasuryFee,
                  mintFee: poolDetails.vaultFee ?? 0, // Use vaultFee as mintFee for cached data
                  burnFee: 0, // Default burnFee for cached data
                  bullPercentage: poolDetails.bullPercentage,
                  bearPercentage: poolDetails.bearPercentage,
                  bullToken: bull,
                  bearToken: bear,
                  previous_price: BigInt(0)
                });
              }
            }
          } catch (tokenError) {
            console.error(`Failed to load tokens for pool ${poolDetails.id} from cache:`, tokenError);
          }
        }
        return convertedPools;
      } catch (cacheError) {
        console.error(`Failed to load cached pools for chain ${chainId}:`, cacheError);
        updateChainState(chainId, { loading: false, error: `Failed to load cached data` });
        return [];
      }
    }
    
    updateChainState(chainId, { loading: false, error: `Unable to fetch pools` });
    return [];
  }, [isInitialized, isOnline, fetchCoin, updateChainState, batchSavePools, saveChainStatus, getAllPools, getTokensForPool]);

  const fetchAllPools = useCallback(async (showToast = true): Promise<void> => {
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) { if (showToast) { toast.info("Refreshed recently. Please wait a moment."); } return; }
    setLastFetchTime(now);
    setLoading(true);

    // Fetch from all chains initially, but only from connected chain when wallet is connected
    const chainsToFetch = isConnected && currentChainId && isConnectedChainSupported 
      ? [currentChainId] 
      : supportedChainIds;

    // Set loading states for chains being fetched
    const newChainStates: ChainLoadingState[] = chainsToFetch.map(chainId => ({
      chainId,
      loading: true,
      error: null,
      poolCount: 0,
      chainName: getChainConfig(chainId)?.name || `Chain ${chainId}`
    }));
    
    // If wallet is connected, only update states for the connected chain
    // If no wallet, update states for all supported chains
    if (isConnected && currentChainId && isConnectedChainSupported) {
      setChainStates(prev => prev.map(state => 
        state.chainId === currentChainId 
          ? { ...state, loading: true, error: null }
          : { ...state, loading: false, error: null }
      ));
    } else {
      setChainStates(newChainStates);
    }

    try {
      console.log(`Fetching pools from ${chainsToFetch.length} chains:`, chainsToFetch);
      const allPools: Pool[] = [];
      let successfulChains = 0;
      let totalErrors = 0;

      for (const chainId of chainsToFetch) {
        const factoryAddress = (FatePoolFactories as FactoryAddresses)[chainId.toString()];
        console.log(`Processing chain ${chainId} with factory address: ${factoryAddress}`);
        
        try {
          const poolsFromChain = await fetchPoolsFromChain(chainId, factoryAddress);
          console.log(`Chain ${chainId} returned ${poolsFromChain.length} pools`);
          allPools.push(...poolsFromChain);
          if (poolsFromChain.length > 0) {
            successfulChains++;
          }
          updateChainState(chainId, { loading: false, error: null, poolCount: poolsFromChain.length });
        } catch (error) {
          totalErrors++;
          console.error(`Chain ${chainId} failed:`, error);
          updateChainState(chainId, { loading: false, error: (error as Error)?.message || 'Unknown error' });
        }
      }

      // Always process fetched pools from all chains
      const uniquePools = allPools.filter((pool, index, self) => index === self.findIndex(p => p.id === pool.id));
      setPools(uniquePools);
      
      const chainCount = chainsToFetch.length;
      const message = isConnected && currentChainId && isConnectedChainSupported
        ? `Loaded ${uniquePools.length} pools from connected chain (${getChainConfig(currentChainId)?.name})`
        : `Loaded ${uniquePools.length} pools from ${successfulChains}/${chainCount} chains`;
      
      console.log(isConnected && currentChainId && isConnectedChainSupported
        ? `🚀 Pools from connected chain (${getChainConfig(currentChainId)?.name}):`
        : "🚀 All fetched pools from all supported chains:", uniquePools);
              if (showToast) {
          if (totalErrors > 0) { 
            toast.warning(`${message}. ${totalErrors} chains had errors.`); 
          } else if (uniquePools.length > 0) { 
            toast.success(message); 
          } else { 
            if (isConnected && currentChainId && isConnectedChainSupported) {
              toast.info(`No pools found on ${getChainConfig(currentChainId)?.name}. Try switching to a different chain.`);
            } else {
              toast.info('No pools found on any supported chain.');
            }
          }
        }
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      if (showToast) { toast.error("Failed to fetch pools. Please try again."); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    fetchPoolsFromChain,
    updateChainState,
    supportedChainIds,
    lastFetchTime,
    isConnected,
    currentChainId,
    isConnectedChainSupported
  ]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchAllPools();
  }, [fetchAllPools]);

  useEffect(() => {
    if (isInitialized) {
      fetchAllPools(false);
    }
  }, [fetchAllPools, isInitialized]);

  useEffect(() => {
    if (isInitialized && isConnected && currentChainId && isConnectedChainSupported) {
      fetchAllPools(false);
    }
  }, [isInitialized, isConnected, currentChainId, isConnectedChainSupported, fetchAllPools]);

  const handleCreate = useCallback((): void => {
    if (!isConnected || !walletClient) { toast.error("Please connect your wallet first."); return; }
    if (!isConnectedChainSupported) { toast.error(`Please switch to a supported chain: ${getSupportedChains()}`); return; }
    
    // Prevent wallet disconnection by using replace instead of push
    // and ensuring state is preserved
    setIsCreatingPool(true);
    
    // Use setTimeout to ensure state updates are processed before navigation
    setTimeout(() => {
      router.replace("/createPool");
    }, 100);
  }, [isConnected, router, walletClient, isConnectedChainSupported]);

  const handleUsePool = useCallback((poolId: string): void => {
    if (!isConnected) { 
      toast.error("Please connect your wallet to use this pool."); 
      return; 
    }
    
    // Validate address format before proceeding
    if (!isAddress(poolId)) {
      toast.error("Invalid pool address format. Please try again.");
      return;
    }
    
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
    <div className={`pt-28 min-h-screen transition-colors duration-500 ${
      loading 
        ? 'bg-white dark:bg-black' 
        : 'bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#1a1b1f] dark:to-[#1a1b1f]'
    }`}>
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
          currentChainId={currentChainId}
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
          currentChainId={currentChainId}
          isConnected={isConnected}
          isConnectedChainSupported={isConnectedChainSupported}
        />
      </div>
    </div>
  );
}

export default function ExploreFatePools() {
  // ALL HOOKS MUST BE CALLED FIRST, before any conditional logic
  const [isClient, setIsClient] = useState(false);

  // Client-side only check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Early return for SSR - AFTER all hooks have been called
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
        <Loading size="xl" />
      </div>
    );
  }

  return <ExploreFatePoolsClient />;
}