"use client";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InteractionClient from "./InteractionClient";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { PredictionPoolABI } from "@/utils/abi/PredictionPool";
import { CoinABI } from "@/utils/abi/Coin";
import { toast } from "sonner";

interface Token {
  id: string;
  name: string;
  symbol: string;
  asset: string;
  vault_creator: string;
  vault_fee: bigint;
  vault_creator_fee: bigint;
  treasury_fee: bigint;
  asset_balance: bigint;
  supply: bigint;
  prediction_pool: string;
  other_token: string;
  price?: number;
  balance?: bigint;
}

interface Pool {
  id: string;
  bullToken: Token;
  bearToken: Token;
  bullPercentage: number;
  bearPercentage: number;
  previous_price: bigint;
  baseToken: string;
}

const formatNum = (value: bigint | null | undefined, decimals = 18): number => {
  if (value === null || value === undefined) return 0;
  try {
    return Number(ethers.formatUnits(value, decimals));
  } catch (error) {
    console.error("Error formatting number:", error);
    return 0;
  }
};

export default function PoolPage() {
  const { id } = useParams();
  const poolId = Array.isArray(id) ? id[0] : id || '';
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    if (!poolId) {
      setError("Missing pool address");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rpc = process.env.NEXT_PUBLIC_RPC_URL;
      if (!rpc) throw new Error("Missing RPC URL in .env");

      const provider = new ethers.JsonRpcProvider(rpc);
      const poolContract = new ethers.Contract(poolId, PredictionPoolABI, provider);

      // Fetch all pool data with error handling
      const [
        baseToken,
        bullAddr,
        bearAddr,
        prevPrice,
        vaultCreator,
        vaultFee,
        vaultCreatorFee,
        treasuryFee
      ] = await Promise.all([
        poolContract.baseToken().catch(() => ""),
        poolContract.bullCoin().catch(() => ""),
        poolContract.bearCoin().catch(() => ""),
        poolContract.previousPrice().catch(() => BigInt(0)),
        poolContract.vaultCreator().catch(() => ""),
        poolContract.vaultFee().catch(() => BigInt(0)),
        poolContract.vaultCreatorFee().catch(() => BigInt(0)),
        poolContract.treasuryFee().catch(() => BigInt(0))
      ]);

      if (!bullAddr || !bearAddr) {
        throw new Error("Invalid token addresses returned from contract");
      }

      const bullTokenContract = new ethers.Contract(bullAddr, CoinABI, provider);
      const bearTokenContract = new ethers.Contract(bearAddr, CoinABI, provider);

      // Create asset contract to get balances
      const assetContract = new ethers.Contract(baseToken, [
        "function balanceOf(address) view returns (uint256)"
      ], provider);

      const [
        bullName, bullSymbol, bullAsset, bullVcreator, bullVaultFee, bullVcFee, bullTreFee, bullSupply,
        bearName, bearSymbol, bearAsset, bearVcreator, bearVaultFee, bearVcFee, bearTreFee, bearSupply,
        bullAssetBal, bearAssetBal
      ] = await Promise.all([
        bullTokenContract.name().catch(() => "Bull Token"),
        bullTokenContract.symbol().catch(() => "BULL"),
        bullTokenContract.asset().catch(() => ""),
        bullTokenContract.vaultCreator().catch(() => ""),
        bullTokenContract.vaultFee().catch(() => BigInt(0)),
        bullTokenContract.vaultCreatorFee().catch(() => BigInt(0)),
        bullTokenContract.treasuryFee().catch(() => BigInt(0)),
        bullTokenContract.totalSupply().catch(() => BigInt(0)),
        bearTokenContract.name().catch(() => "Bear Token"),
        bearTokenContract.symbol().catch(() => "BEAR"),
        bearTokenContract.asset().catch(() => ""),
        bearTokenContract.vaultCreator().catch(() => ""),
        bearTokenContract.vaultFee().catch(() => BigInt(0)),
        bearTokenContract.vaultCreatorFee().catch(() => BigInt(0)),
        bearTokenContract.treasuryFee().catch(() => BigInt(0)),
        bearTokenContract.totalSupply().catch(() => BigInt(0)),
        assetContract.balanceOf(bullAddr).catch(() => BigInt(0)),
        assetContract.balanceOf(bearAddr).catch(() => BigInt(0))
      ]);

      // Get user balances if wallet is connected
      let bullBalance = BigInt(0);
      let bearBalance = BigInt(0);
      
      if (userAddress) {
        [bullBalance, bearBalance] = await Promise.all([
          bullTokenContract.balanceOf(userAddress).catch(() => BigInt(0)),
          bearTokenContract.balanceOf(userAddress).catch(() => BigInt(0))
        ]);
      }

      // Calculate percentages and prices
      const bullSupplyNum = formatNum(bullSupply);
      const bearSupplyNum = formatNum(bearSupply);
      const totalSupply = bullSupplyNum + bearSupplyNum;
      const bullPercentage = totalSupply > 0 ? (bullSupplyNum / totalSupply) * 100 : 50;
      const bearPercentage = 100 - bullPercentage;

      const bullPrice = bullSupplyNum > 0 ? formatNum(bullAssetBal) / bullSupplyNum : 1;
      const bearPrice = bearSupplyNum > 0 ? formatNum(bearAssetBal) / bearSupplyNum : 1;

      const bullToken: Token = {
        id: bullAddr,
        name: bullName,
        symbol: bullSymbol,
        asset: bullAsset,
        vault_creator: bullVcreator,
        vault_fee: bullVaultFee,
        vault_creator_fee: bullVcFee,
        treasury_fee: bullTreFee,
        asset_balance: bullAssetBal,
        supply: bullSupply,
        prediction_pool: poolId,
        other_token: bearAddr,
        price: bullPrice,
        balance: bullBalance
      };

      const bearToken: Token = {
        id: bearAddr,
        name: bearName,
        symbol: bearSymbol,
        asset: bearAsset,
        vault_creator: bearVcreator,
        vault_fee: bearVaultFee,
        vault_creator_fee: bearVcFee,
        treasury_fee: bearTreFee,
        asset_balance: bearAssetBal,
        supply: bearSupply,
        prediction_pool: poolId,
        other_token: bullAddr,
        price: bearPrice,
        balance: bearBalance
      };

      const poolObj: Pool = {
        id: poolId,
        bullToken,
        bearToken,
        bullPercentage,
        bearPercentage,
        previous_price: prevPrice,
        baseToken
      };

      setPool(poolObj);
    } catch (e: any) {
      console.error("Error loading pool:", e);
      setError(e.message || "Failed to load pool data");
      toast.error("Failed to load pool data");
    } finally {
      setLoading(false);
    }
  }, [poolId, userAddress]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      setUserAddress(accounts[0] || null);
    };

    if (window.ethereum) {
      // Get initial account
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => setUserAddress(accounts[0] || null))
        .catch(console.error);

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center p-4 max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Pool</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Pool Not Found</h2>
          <p>The requested pool could not be loaded</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <InteractionClient
          tokens={{ bullToken: pool.bullToken, bearToken: pool.bearToken }}
          vault={{
            id: pool.id,
            baseToken: pool.baseToken,
            bullToken: pool.bullToken,
            bearToken: pool.bearToken,
            bullPercentage: pool.bullPercentage,
            bearPercentage: pool.bearPercentage,
            previous_price: formatNum(pool.previous_price),
            vault_creator: pool.bullToken.vault_creator,
            vault_fee: pool.bullToken.vault_fee,
            vault_creator_fee: pool.bullToken.vault_creator_fee,
            treasury_fee: pool.bullToken.treasury_fee,
            fees: {
              entry: formatNum(pool.bullToken.vault_fee, 0),
              exit: formatNum(pool.bullToken.vault_fee, 0),
              performance: formatNum(pool.bullToken.vault_creator_fee, 0)
            }
          }}
        />
      </main>
    </div>
  );
}