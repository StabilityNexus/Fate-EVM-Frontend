"use client";
import React, { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { formatUnits } from "viem";

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

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;

export default function ExploreFatePools() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();


  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchPools = async () => {
      if (!publicClient) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Option 1: Type assertion
        const poolAddresses = await publicClient.readContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: PredictionPoolFactoryABI,
          functionName: "getAllPools",
        }) as `0x${string}`[];

        const result = await Promise.all(
          poolAddresses.map(async (addr) => {
            try {
              const [name, oracle, feedId, bullAddr, bearAddr] = await Promise.all([
                publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "name" }),
                publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "oracle" }),
                publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "priceFeedId" }),
                publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "bullCoin" }),
                publicClient.readContract({ address: addr, abi: PredictionPoolABI, functionName: "bearCoin" }),
              ]);

              const fetchCoin = async (coinAddr: string, other: string): Promise<Token> => {
                const [
                  cname, csymbol, ccreator, cvaultFee, csupply, cpriceBuy, cpriceSell,
                  ctreasuryFee, ccreatorFee, casset
                ] = await Promise.all([
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "name" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "symbol" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "vaultCreator" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "vaultFee" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "totalSupply" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "priceBuy" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "priceSell" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "treasuryFee" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "vaultCreatorFee" }),
                  publicClient.readContract({ address: coinAddr as `0x${string}`, abi: CoinABI, functionName: "asset" }),
                ]);

                return {
                  id: coinAddr,
                  prediction_pool: addr,
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
              };

              const bull = await fetchCoin(bullAddr as string, bearAddr as string);
              const bear = await fetchCoin(bearAddr as string, bullAddr as string);

              const totalVal = bull.priceBuy * bull.supply + bear.priceBuy * bear.supply;
              const bullPct = totalVal ? (bull.priceBuy * bull.supply) / totalVal * 100 : 50;
              const bearPct = 100 - bullPct;

              return {
                id: addr,
                name: name as string,
                oracle: oracle as string,
                feedId: feedId as string,
                bullPercentage: bullPct,
                bearPercentage: bearPct,
                bullToken: bull,
                bearToken: bear,
              } as Pool;
            } catch (e) {
              console.error("Error loading pool", addr, e);
              return null;
            }
          })
        );

        setPools(result.filter(Boolean) as Pool[]);
      } catch (e) {
        toast.error("Failed to fetch pools");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [publicClient]);

  const handleCreate = () => {
    if (!isConnected || !walletClient) {
      toast.error("Connect your wallet first.");
      return;
    }
    setIsCreatingPool(true);
    router.push("/createPool");
  };

  const filteredPools = pools.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bullToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bearToken.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white">Explore Fate Pools</h1>
          <button
            onClick={handleCreate}
            disabled={isCreatingPool}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition transform hover:scale-105 dark:bg-white dark:text-black shadow-md disabled:opacity-50"
          >
            <Plus size={20} />
            Create New Pool
          </button>
        </div>

        <input
          type="text"
          placeholder="Search pools..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full p-3 mb-6 border rounded dark:bg-gray-800 dark:text-white"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ))
          ) : filteredPools.length > 0 ? (
            filteredPools.map(pool => (
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
            ))
          ) : (
            <div className="col-span-full text-center text-gray-700 dark:text-gray-300">
              No pools found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}