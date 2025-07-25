"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { PredictionPoolFactoryABI } from "../../utils/abi/PredictionPoolFactory";
import { PredictionPoolABI } from "../../utils/abi/PredictionPool";
import { CoinABI } from "../../utils/abi/Coin";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

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

const SEPOLIA_CHAIN_ID = 11155111;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

export default function ExploreFatePools() {
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL, SEPOLIA_CHAIN_ID);
        const factory = new ethers.Contract(FACTORY_ADDRESS, PredictionPoolFactoryABI, provider);
        const poolAddresses: string[] = await factory.getAllPools();

        const fetchedPools = await Promise.all(poolAddresses.map(async (addr, idx) => {
          try {
            const pool = new ethers.Contract(addr, PredictionPoolABI, provider);
            const name = (await pool.name()).toString() || `Pool ${idx + 1}`;
            const [oracle, feedIdBytes] = await Promise.all([
              pool.oracle(),
              pool.priceFeedId()
            ]);
            const feedId = feedIdBytes.toString();

            const [bullAddr, bearAddr] = await Promise.all([pool.bullCoin(), pool.bearCoin()]);
            const bull = new ethers.Contract(bullAddr, CoinABI, provider);
            const bear = new ethers.Contract(bearAddr, CoinABI, provider);

            const [
              bName, bSym, bCreator, bVaultFee, bSupplyBN, bPriceBuyBN, bPriceSellBN, bTreasuryFee, bVaultCrFee, bAsset,
              brName, brSym, brCreator, brVaultFee, brSupplyBN, brPriceBuyBN, brPriceSellBN, brTreasuryFee, brVaultCrFee, brAsset,
            ] = await Promise.all([
              bull.name(), bull.symbol(), bull.vaultCreator(), bull.vaultFee(), bull.totalSupply(), bull.priceBuy(), bull.priceSell(), bull.treasuryFee(), bull.vaultCreatorFee(), bull.asset(),
              bear.name(), bear.symbol(), bear.vaultCreator(), bear.vaultFee(), bear.totalSupply(), bear.priceBuy(), bear.priceSell(), bear.treasuryFee(), bear.vaultCreatorFee(), bear.asset(),
            ]);

            const bullSupply = Number(ethers.formatUnits(bSupplyBN, 18));
            const bearSupply = Number(ethers.formatUnits(brSupplyBN, 18));
            const bullPrice = Number(ethers.formatUnits(bPriceBuyBN, 5));
            const bearPrice = Number(ethers.formatUnits(brPriceBuyBN, 5));

            const totalValue = bullPrice * bullSupply + bearPrice * bearSupply;
            const bullPct = totalValue ? (bullPrice * bullSupply) / totalValue * 100 : 50;
            const bearPct = 100 - bullPct;

            const makeToken = (id: string, name: string, sym: string, creator: string, vaultFee: ethers.BigNumberish, vaultCrFee: ethers.BigNumberish, treasuryFee: ethers.BigNumberish, asset: string, supply: number, priceBuy: number, priceSellBN: ethers.BigNumberish, other: string): Token => ({
              id,
              asset,
              name,
              symbol: sym,
              vault_creator: creator,
              vault_fee: Number(vaultFee),
              vault_creator_fee: Number(vaultCrFee),
              treasury_fee: Number(treasuryFee),
              supply,
              priceBuy,
              priceSell: Number(ethers.formatUnits(priceSellBN, 5)),
              prediction_pool: addr,
              other_token: other,
            });

            return {
              id: addr,
              name,
              oracle,
              feedId,
              bullPercentage: bullPct,
              bearPercentage: bearPct,
              bullToken: makeToken(bullAddr, bName, bSym, bCreator, bVaultFee, bVaultCrFee, bTreasuryFee, bAsset, bullSupply, bullPrice, bPriceSellBN, bearAddr),
              bearToken: makeToken(bearAddr, brName, brSym, brCreator, brVaultFee, brVaultCrFee, brTreasuryFee, brAsset, bearSupply, bearPrice, brPriceSellBN, bullAddr),
            } as Pool;
          } catch (err) {
            console.error("Pool error", addr, err);
            throw err;
          }
        }));
        setPools(fetchedPools);
      } catch (err) {
        console.error("Fetch pools failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = pools.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bullToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bearToken.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold dark:text-white">Explore Fate Pools</h1>
          <button
            className="flex px-5 py-2 bg-black gap-x-2 text-white rounded dark:bg-white dark:text-black"
            onClick={() => router.push("/createPool")}
          >
            <Plus size={20} /> Create Pool
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
          {loading
            ? Array.from({ length: 3 }, (_, i) => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded" />)
            : (
              filtered.length
                ? filtered.map(pool => (
                  <PredictionCard
                    key={pool.id}
                    name={pool.name}
                    bullPercentage={pool.bullPercentage}
                    bearPercentage={pool.bearPercentage}
                    bullCoinName={pool.bullToken.name}
                    bullCoinSymbol={pool.bullToken.symbol}
                    bearCoinName={pool.bearToken.name}
                    bearCoinSymbol={pool.bearToken.symbol}
                    onUse={() => router.push(`/usePool/${pool.id}`)}
                  />
                ))
                : <p className="text-center dark:text-white">No pools found.</p>
            )}
        </div>
      </div>
    </div>
  );
}
