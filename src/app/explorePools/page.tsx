"use client";
import { useEffect, useState } from "react";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

// Token & Pool interfaces
interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  price: number;
  vault_creator: string;
  vault_fee: number;
  vault_creator_fee: number;
  treasury_fee: number;
  asset_balance: number;
  supply: number;
  prediction_pool: string;
  other_token: string;
}

interface Pool {
  id: string;
  name: string;
  bullPercentage: number;
  bearPercentage: number;
  bullToken?: Token;
  bearToken?: Token;
  volume?: string;
  participants?: number;
}

// Main component
const ExploreFatePools = () => {
  const navigate = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy data
  const dummyPools: Pool[] = [
    {
      id: "1",
      name: "ETH/USD Prediction",
      bullPercentage: 65,
      bearPercentage: 35,
      bullToken: {
        id: "bull-eth",
        name: "Bull ETH",
        symbol: "BETH",
        balance: 1000,
        price: 2000,
        vault_creator: "0x123",
        vault_fee: 0.02,
        vault_creator_fee: 0.01,
        treasury_fee: 0.01,
        asset_balance: 20000,
        supply: 1000,
        prediction_pool: "1",
        other_token: "bear-eth"
      },
      bearToken: {
        id: "bear-eth",
        name: "Bear ETH",
        symbol: "BEAR",
        balance: 500,
        price: 1900,
        vault_creator: "0x456",
        vault_fee: 0.02,
        vault_creator_fee: 0.01,
        treasury_fee: 0.01,
        asset_balance: 9500,
        supply: 500,
        prediction_pool: "1",
        other_token: "bull-eth"
      }
    },
    {
      id: "2",
      name: "BTC Price Battle",
      bullPercentage: 40,
      bearPercentage: 60,
      bullToken: {
        id: "bull-btc",
        name: "Bull BTC",
        symbol: "BBTC",
        balance: 800,
        price: 30000,
        vault_creator: "0x789",
        vault_fee: 0.02,
        vault_creator_fee: 0.01,
        treasury_fee: 0.01,
        asset_balance: 24000,
        supply: 800,
        prediction_pool: "2",
        other_token: "bear-btc"
      },
      bearToken: {
        id: "bear-btc",
        name: "Bear BTC",
        symbol: "BRBTC",
        balance: 700,
        price: 29000,
        vault_creator: "0xabc",
        vault_fee: 0.02,
        vault_creator_fee: 0.01,
        treasury_fee: 0.01,
        asset_balance: 21000,
        supply: 700,
        prediction_pool: "2",
        other_token: "bull-btc"
      }
    }
  ];

  useEffect(() => {
    // Simulate fetching pools
    setTimeout(() => {
      setPools(dummyPools);
      setLoading(false);
    }, 500); // Optional delay to simulate loading
  }, []);

  const filteredPools = pools.filter((pool) =>
    pool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 mt-10">
            <div>
              <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
                Explore Fate Pools
              </h1>
            </div>
            <button
              className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 dark:bg-white dark:text-black shadow-md"
              onClick={() => navigate.push('/createPool')}
            >
              <Plus size={20} />
              Create New Pool
            </button>
          </div>

          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800/50 rounded-xl p-6 shadow-lg">
              <div className="relative w-full md:w-auto">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search pools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:text-white dark:bg-gray-900/60 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-all"
                />
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Active Pools
                  </p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {pools.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pool Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[400px] bg-white dark:bg-gray-700/30 rounded-xl shadow-lg animate-pulse"
                >
                  <div className="h-48 bg-gray-200 dark:bg-gray-600/50 rounded-t-xl" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600/50 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-600/50 rounded w-1/2" />
                    <div className="h-24 bg-gray-200 dark:bg-gray-600/50 rounded" />
                  </div>
                </div>
              ))
            ) : filteredPools.length > 0 ? (
              filteredPools.map((pool) => (
                <PredictionCard
                  key={pool.id}
                  name={pool.name}
                  bullPercentage={pool.bullPercentage}
                  bearPercentage={pool.bearPercentage}
                  bullCoinName={pool.bullToken?.name || "Bull Token"}
                  bullCoinSymbol={pool.bullToken?.symbol || "BULL"}
                  bearCoinName={pool.bearToken?.name || "Bear Token"}
                  bearCoinSymbol={pool.bearToken?.symbol || "BEAR"}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {pools.length === 0
                    ? "No pools found"
                    : "No pools matching your search"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExploreFatePools;
