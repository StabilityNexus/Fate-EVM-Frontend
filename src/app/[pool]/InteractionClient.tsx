'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Coins, AlertCircle, Info, RefreshCw, Wrench } from 'lucide-react';
import {
  useAccount,
  useWalletClient,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { formatUnits, parseUnits, type Address } from 'viem';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';
import { CoinABI } from '@/utils/abi/Coin';
import { ERC20ABI } from '@/utils/abi/ERC20';
import { toast } from 'sonner';
import { getBothPrices, rebalancePool, updatePriceFeed } from '@/lib/vaultUtils';
import { useSearchParams } from 'next/navigation';
import { FatePoolFactories } from '@/utils/addresses';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Token, Pool, PendingApproval, ProcessingError, TokenActionPanelProps } from '@/lib/types';
import { getChainConfig } from '@/utils/chainConfig';

const formatNum = (value: bigint | null | undefined, decimals = 18): number => {
  if (value === null || value === undefined) return 0;
  try {
    return Number(formatUnits(value, decimals));
  } catch (error) {
    console.error("Error formatting number:", error);
    return 0;
  }
};

const getSupportedChains = (): string => {
  return Object.keys(FatePoolFactories)
    .map(chainId => {
      const config = getChainConfig(Number(chainId));
      return config?.name || `Chain ${chainId}`;
    })
    .join(", ");
};

const formatAddress = (address: Address | string | undefined): string => {
  if (!address) return 'N/A';
  if (typeof address !== 'string' || address.length < 10) {
    return address;
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Main component that uses search params
function InteractionClientContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const { chain } = useAccount();
  const poolId = (Array.isArray(id) ? id[0] : id || '') as Address;
  const defaultPoolId = chain?.id ? FatePoolFactories[chain.id] : undefined;
  const isChainSupported = chain?.id ? Boolean(FatePoolFactories[chain.id]) : false;

  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [bullAmount, setBullAmount] = useState<string>('');
  const [bearAmount, setBearAmount] = useState<string>('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [baseTokenSymbol, setBaseTokenSymbol] = useState<string>('');
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [newPriceFeedAddress, setNewPriceFeedAddress] = useState<string>('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const isTransacting = isPending || isConfirming;

  useEffect(() => {
    if (chain?.id && !isChainSupported) {
      toast.error(
        `Chain "${chain.name}" is not supported. Please switch to one of: ${getSupportedChains()}`
      );
    }
  }, [chain, isChainSupported]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (!walletClient || !(poolId || defaultPoolId)) return;

      try {
        setLoadingPrice(true);
        const { currentPrice, previousPrice } = await getBothPrices(
          walletClient,
          poolId || defaultPoolId!
        );
        setCurrentPrice(currentPrice);
        setPreviousPrice(previousPrice);
      } catch (err) {
        console.error('Error fetching prices:', err);
        toast.error('Failed to fetch price data');
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrices();
  }, [walletClient, poolId, defaultPoolId]);

  const handleBuyTransaction = useCallback(async (token: Token, amount: string) => {
    try {
      const amountWei = parseUnits(amount, 18);
      
      const loadingToast = toast.loading("Processing buy transaction...");
      await writeContract({
        address: token.id,
        abi: CoinABI,
        functionName: 'buy',
        args: [address!, amountWei],
      });
      toast.dismiss(loadingToast);
    } catch (err: unknown) {
      console.error("Buy transaction error:", err);
      toast.error((err as Error).message || "Failed to buy tokens");
    }
  }, [address, writeContract]);

  useEffect(() => {
    if (isConfirmed && pendingApproval && !isPending) {
      const { token, amount } = pendingApproval;
      
      setPendingApproval(null);
      
      handleBuyTransaction(token, amount);
    }
  }, [isConfirmed, pendingApproval, isPending, handleBuyTransaction]);

  const { data: poolData, refetch: refetchPool } = useReadContracts({
    contracts: [
      {
        address: poolId || defaultPoolId,
        abi: PredictionPoolABI,
        functionName: 'baseToken',
      },
      {
        address: poolId || defaultPoolId,
        abi: PredictionPoolABI,
        functionName: 'bullCoin',
      },
      {
        address: poolId || defaultPoolId,
        abi: PredictionPoolABI,
        functionName: 'bearCoin',
      },
      {
        address: poolId || defaultPoolId,
        abi: PredictionPoolABI,
        functionName: 'previousPrice',
      },
      {
        address: poolId || defaultPoolId,
        abi: PredictionPoolABI,
        functionName: 'priceFeed',
      },
      {
        address: poolId || defaultPoolId,
        abi: PredictionPoolABI,
        functionName: 'poolName',
      },
    ],
    query: {
      enabled: !!(poolId || defaultPoolId) && isChainSupported,
    }
  });

  const baseToken = poolData?.[0]?.result as Address;
  const bullAddr = poolData?.[1]?.result as Address;
  const bearAddr = poolData?.[2]?.result as Address;
  const prevPrice = poolData?.[3]?.result as bigint;
  const priceFeed = poolData?.[4]?.result as Address;
  const poolName = poolData?.[5]?.result as string;

  const { data: baseTokenData } = useReadContracts({
    contracts: baseToken ? [
      {
        address: baseToken,
        abi: ERC20ABI,
        functionName: 'symbol',
      },
    ] : [],
    query: {
      enabled: !!baseToken,
    }
  });

  const { data: tokenData } = useReadContracts({
    contracts: bullAddr && bearAddr ? [
      { address: bullAddr, abi: CoinABI, functionName: 'name' },
      { address: bullAddr, abi: CoinABI, functionName: 'symbol' },
      { address: bullAddr, abi: CoinABI, functionName: 'asset' },
      { address: bullAddr, abi: CoinABI, functionName: 'vaultCreator' },
      { address: bullAddr, abi: CoinABI, functionName: 'vaultFee' },
      { address: bullAddr, abi: CoinABI, functionName: 'vaultCreatorFee' },
      { address: bullAddr, abi: CoinABI, functionName: 'treasuryFee' },
      { address: bullAddr, abi: CoinABI, functionName: 'totalSupply' },
      { address: bearAddr, abi: CoinABI, functionName: 'name' },
      { address: bearAddr, abi: CoinABI, functionName: 'symbol' },
      { address: bearAddr, abi: CoinABI, functionName: 'asset' },
      { address: bearAddr, abi: CoinABI, functionName: 'vaultCreator' },
      { address: bearAddr, abi: CoinABI, functionName: 'vaultFee' },
      { address: bearAddr, abi: CoinABI, functionName: 'vaultCreatorFee' },
      { address: bearAddr, abi: CoinABI, functionName: 'treasuryFee' },
      { address: bearAddr, abi: CoinABI, functionName: 'totalSupply' },
    ] : [],
    query: {
      enabled: !!(bullAddr && bearAddr),
    }
  });

  const { data: assetBalances } = useReadContracts({
    contracts: baseToken && bullAddr && bearAddr ? [
      {
        address: baseToken,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [bullAddr],
      },
      {
        address: baseToken,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [bearAddr],
      },
    ] : [],
    query: {
      enabled: !!(baseToken && bullAddr && bearAddr),
    }
  });

  const { data: userBalances, refetch: refetchUserBalances } = useReadContracts({
    contracts: address && bullAddr && bearAddr ? [
      {
        address: bullAddr,
        abi: CoinABI,
        functionName: 'balanceOf',
        args: [address],
      },
      {
        address: bearAddr,
        abi: CoinABI,
        functionName: 'balanceOf',
        args: [address],
      },
    ] : [],
    query: {
      enabled: !!(address && bullAddr && bearAddr),
    }
  });

  const { data: baseTokenBalance, refetch: refetchBaseTokenBalance } = useReadContracts({
    contracts: address && baseToken ? [
      {
        address: baseToken,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [address],
      },
    ] : [],
    query: {
      enabled: !!(address && baseToken),
    }
  });

  const { data: allowances, refetch: refetchAllowances } = useReadContracts({
    contracts: address && baseToken && bullAddr && bearAddr ? [
      {
        address: baseToken,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address, bullAddr],
      },
      {
        address: baseToken,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address, bearAddr],
      },
    ] : [],
    query: {
      enabled: !!(address && baseToken && bullAddr && bearAddr),
    }
  });

  useEffect(() => {
    if (baseTokenData?.[0]?.result) {
      setBaseTokenSymbol(baseTokenData[0].result as string);
    }
  }, [baseTokenData]);

  useEffect(() => {
    if (!poolData || !tokenData || !assetBalances || !(poolId || defaultPoolId)) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        bullName, bullSymbol, bullAsset, bullVcreator, bullVaultFee, bullVcFee, bullTreFee, bullSupply,
        bearName, bearSymbol, bearAsset, bearVcreator, bearVaultFee, bearVcFee, bearTreFee, bearSupply
      ] = tokenData.map(item => item.result);

      const [bullAssetBal, bearAssetBal] = assetBalances.map(item => item.result as bigint);

      const bullBalance = userBalances?.[0]?.result as bigint || BigInt(0);
      const bearBalance = userBalances?.[1]?.result as bigint || BigInt(0);

      const bullSupplyNum = formatNum(bullSupply as bigint);
      const bearSupplyNum = formatNum(bearSupply as bigint);
      const totalSupply = bullSupplyNum + bearSupplyNum;
      const bullPercentage = totalSupply > 0 ? (bullSupplyNum / totalSupply) * 100 : 50;
      const bearPercentage = 100 - bullPercentage;

      const bullPrice = bullSupplyNum > 0 ? formatNum(bullAssetBal) / bullSupplyNum : 1;
      const bearPrice = bearSupplyNum > 0 ? formatNum(bearAssetBal) / bearSupplyNum : 1;

      const bullToken: Token = {
        id: bullAddr,
        name: bullName as string || "Bull Token",
        symbol: bullSymbol as string || "BULL",
        asset: bullAsset as Address,
        vault_creator: bullVcreator as Address,
        vault_fee: bullVaultFee as bigint,
        vault_creator_fee: bullVcFee as bigint,
        treasury_fee: bullTreFee as bigint,
        asset_balance: bullAssetBal,
        supply: bullSupply as bigint,
        prediction_pool: poolId || defaultPoolId!,
        other_token: bearAddr,
        price: bullPrice,
        balance: bullBalance
      };

      const bearToken: Token = {
        id: bearAddr,
        name: bearName as string || "Bear Token",
        symbol: bearSymbol as string || "BEAR",
        asset: bearAsset as Address,
        vault_creator: bearVcreator as Address,
        vault_fee: bearVaultFee as bigint,
        vault_creator_fee: bearVcFee as bigint,
        treasury_fee: bearTreFee as bigint,
        asset_balance: bearAssetBal,
        supply: bearSupply as bigint,
        prediction_pool: poolId || defaultPoolId!,
        other_token: bullAddr,
        price: bearPrice,
        balance: bearBalance
      };

      const poolObj: Pool = {
        id: poolId || defaultPoolId!,
        name: poolName || `${bullToken.name} / ${bearToken.name} Vault`,
        bullToken,
        bearToken,
        bullPercentage,
        bearPercentage,
        previous_price: prevPrice || BigInt(0),
        baseToken: baseToken!,
        priceFeedAddress: priceFeed || '0x',
        creator: bullVcreator as Address,
        chainId: chain?.id || 1,
        chainName: chain?.name || 'Unknown',
        vaultFee: Number(bullVaultFee || 0) / 1000,
        vaultCreatorFee: Number(bullVcFee || 0) / 1000,
        treasuryFee: Number(bullTreFee || 0) / 1000
      };

      setPool(poolObj);
    } catch (e) {
      const processingError = e as ProcessingError;
      console.error("Error processing pool data:", processingError);
      setError(processingError.message || "Failed to process pool data");
      toast.error("Failed to load pool data");
    } finally {
      setLoading(false);
    }
  }, [poolData, tokenData, assetBalances, userBalances, poolId, defaultPoolId, bullAddr, bearAddr, baseToken, prevPrice, priceFeed, chain, poolName]);

  useEffect(() => {
    if (isConfirmed && !isPending) {
      if (!pendingApproval) {
        toast.success("Transaction completed successfully!");
        setBullAmount('');
        setBearAmount('');
      }
      setTimeout(() => {
        refetchPool();
        refetchUserBalances();
        refetchBaseTokenBalance();
        refetchAllowances();
      }, 2000);
    }
  }, [isConfirmed, isPending, pendingApproval, refetchPool, refetchUserBalances, refetchBaseTokenBalance, refetchAllowances]);

  const handleSellTransaction = useCallback(async (token: Token, amount: string) => {
    try {
      const amountWei = parseUnits(amount, 18);
      
      const loadingToast = toast.loading("Processing sell transaction...");
      await writeContract({
        address: token.id,
        abi: CoinABI,
        functionName: 'sell',
        args: [amountWei],
      });
      toast.dismiss(loadingToast);
    } catch (err: unknown) {
      console.error("Sell transaction error:", err);
      toast.error((err as Error).message || "Failed to sell tokens");
    }
  }, [writeContract]);

  const handleBuy = async (token: Token, amount: string) => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount greater than zero");
      return;
    }

    try {
      const amountWei = parseUnits(amount, 18);
      
      const userBaseTokenBalance = baseTokenBalance?.[0]?.result as bigint || BigInt(0);
      if (userBaseTokenBalance < amountWei) {
        toast.error(`Insufficient balance. You have ${formatUnits(userBaseTokenBalance, 18)} base tokens available.`);
        return;
      }

      const tokenIndex = token.id === bullAddr ? 0 : 1;
      const currentAllowance = allowances?.[tokenIndex]?.result as bigint || BigInt(0);

      if (currentAllowance < amountWei) {
        const approvalToast = toast.loading("Approving tokens...");
        setPendingApproval({ token, amount, type: 'buy' });
        await writeContract({
          address: baseToken!,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [token.id, amountWei],
        });
        toast.dismiss(approvalToast);
        return;
      }

      await handleBuyTransaction(token, amount);
    } catch (err: unknown) {
      console.error("Buy error:", err);
      toast.error((err as Error).message || "Failed to buy tokens");
    }
  };

  const handleSell = async (token: Token, amount: string) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount greater than zero");
      return;
    }

    try {
      const amountWei = parseUnits(amount, 18);
      
      const tokenIndex = token.id === bullAddr ? 0 : 1;
      const userTokenBalance = userBalances?.[tokenIndex]?.result as bigint || BigInt(0);
      if (userTokenBalance < amountWei) {
        toast.error(`Insufficient ${token.symbol} balance. You have ${formatUnits(userTokenBalance, 18)} ${token.symbol} available.`);
        return;
      }

      await handleSellTransaction(token, amount);
    } catch (err: unknown) {
      console.error('Sell error:', err);
      toast.error((err as Error).message || 'Failed to sell tokens');
    }
  };

  const handleRebalance = async () => {
    if (!walletClient || !isConnected || !address || !(poolId || defaultPoolId)) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setUpdatingPrice(true);
      
      if (currentPrice !== null) {
        setPreviousPrice(currentPrice);
      }

      await rebalancePool(walletClient, poolId || defaultPoolId!);
      toast.success('Pool rebalanced successfully!');
      
      try {
        const { currentPrice, previousPrice } = await getBothPrices(
          walletClient,
          poolId || defaultPoolId!
        );
        setCurrentPrice(currentPrice);
        setPreviousPrice(previousPrice);
      } catch (priceRefreshError) {
        console.error("Failed to refresh price after rebalance:", priceRefreshError);
      }
    } catch (err: unknown) {
      console.error('Rebalance error:', err);
      let errorMessage = 'Failed to rebalance pool';
      if ((err as Error).message.includes("user rejected transaction")) {
        errorMessage = "Transaction rejected";
      } else if ((err as Error).message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds";
      }
      toast.error(errorMessage);
    } finally {
      setUpdatingPrice(false);
    }
  };

  const handleUpdatePriceFeed = async () => {
    if (!walletClient || !isConnected || !pool) {
      toast.error("Please connect your wallet and wait for pool data to load.");
      return;
    }
    
    if (!newPriceFeedAddress || newPriceFeedAddress.length === 0) {
      toast.error("Please enter a valid price feed address");
      return;
    }

    try {
      const loadingToast = toast.loading("Updating price feed address...");
      await updatePriceFeed(walletClient, pool.id, newPriceFeedAddress as Address);
      toast.dismiss(loadingToast);
      setNewPriceFeedAddress('');
      toast.success("Price feed updated successfully!");
    } catch (err: unknown) {
      console.error("Update price feed error:", err);
      toast.error((err as Error).message || "Failed to update price feed address");
    }
  };

  if (chain && !isChainSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
              Unsupported Chain
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              You&apos;re currently connected to <strong>{chain.name}</strong> which is not supported.
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
          <Button
            onClick={() => {
              refetchPool();
              setError(null);
            }}
            className="mt-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-4">
          <h2 className="text-xl font-bold mb-2 dark:text-white">Pool Not Found</h2>
          <p className="dark:text-gray-400">The requested pool could not be loaded</p>
          <Button
            onClick={() => refetchPool()}
            className="mt-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { bullToken, bearToken, bullPercentage, bearPercentage, baseToken: base } = pool;
  const bullBalance = bullToken.balance || BigInt(0);
  const bearBalance = bearToken.balance || BigInt(0);
  const bullPrice = bullToken.price || 0;
  const bearPrice = bearToken.price || 0;
  
  const bullValue = bullPrice * Number(formatUnits(bullBalance, 18));
  const bearValue = bearPrice * Number(formatUnits(bearBalance, 18));
  const totalValue = bullValue + bearValue;

  const hasTokens = bullBalance > BigInt(0) || bearBalance > BigInt(0);

  const getUnderlyingSymbol = (tokenSymbol: string) => {
    return tokenSymbol.replace(/^F/, '');
  };

  return (
    <div className="w-full pt-28 bg-[#f0f1f4] dark:bg-[#1a1b1f] min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-black rounded-xl shadow-lg p-6 sm:p-8 mb-8 border dark:border-gray-800">
          <div className="flex items-center space-x-4 mb-6">
            <Coins className="h-10 w-10 text-black dark:text-white" />
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white">
              {poolName || `${bullToken.name} / ${bearToken.name} Vault`}
            </h1>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoCard title="Market Position" className="bg-gray-100 dark:bg-[#1a1b1f]">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${bullPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-400">
                <span className="text-green-600 dark:text-green-400">Bull: {bullPercentage.toFixed(2)}%</span>
                <span className="text-red-600 dark:text-red-400">Bear: {bearPercentage.toFixed(2)}%</span>
              </div>
            </InfoCard>

            <InfoCard title="Total Vault Value" className="bg-gray-100 dark:bg-[#1a1b1f]">
              <p className="text-2xl sm:text-3xl font-mono text-black dark:text-white">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-help flex items-center gap-1">
                      (Based on current token prices) <Info size={12} />
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white dark:bg-white dark:text-black">
                    <p>This is the total value of all assets in the vault.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </InfoCard>

            <InfoCard title="Price Information" className="bg-gray-100 dark:bg-[#1a1b1f]">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Previous Pool Price</p>
                  <p className="text-xl font-mono text-black dark:text-white">
                    {loadingPrice ? '...' : previousPrice ? `${previousPrice.toFixed(4)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {isConnected && (
            <section className="md:w-1/3 md:flex-shrink-0 bg-white dark:bg-black rounded-xl shadow-lg p-6 sm:p-8 border dark:border-gray-800">
              <div className="flex items-center justify-center mb-6">
                <Coins className="h-6 w-6 text-blue-500 mr-2" />
                <h2 className="text-2xl font-bold text-black dark:text-white">My Portfolio</h2>
              </div>
              
              {hasTokens ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Total Portfolio Value</h3>
                    <p className="text-3xl font-bold font-mono text-blue-900 dark:text-blue-100">
                      {(bullValue + bearValue).toFixed(4)} {baseTokenSymbol}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ≈ ${(bullValue + bearValue).toFixed(2)} USD
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-800 dark:text-green-300">{bullToken.symbol} Holdings</h4>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                          <span className="font-mono text-green-700 dark:text-green-400">
                            {Number(formatUnits(bullBalance, 18)).toFixed(4)} {bullToken.symbol}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                            {bullPrice.toFixed(4)} {baseTokenSymbol}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-green-200 dark:border-green-800 pt-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Total Value:</span>
                          <div className="text-right">
                            <p className="font-bold text-green-700 dark:text-green-400">
                              {bullValue.toFixed(4)} {baseTokenSymbol}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ${bullValue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-red-800 dark:text-red-300">{bearToken.symbol} Holdings</h4>
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                          <span className="font-mono text-red-700 dark:text-red-400">
                            {Number(formatUnits(bearBalance, 18)).toFixed(4)} {bearToken.symbol}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                            {bearPrice.toFixed(4)} {baseTokenSymbol}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-red-200 dark:border-red-800 pt-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Total Value:</span>
                          <div className="text-right">
                            <p className="font-bold text-red-700 dark:text-red-400">
                              {bearValue.toFixed(4)} {baseTokenSymbol}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ${bearValue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#1a1b1f]/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Portfolio Insights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Dominant Position:</span>
                        <span className={`font-semibold ${bullValue > bearValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {bullValue > bearValue ? 'Bullish' : bearValue > bullValue ? 'Bearish' : 'Balanced'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Position Ratio:</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">
                          {totalValue > 0 ? `${(bullValue / bearValue || 0).toFixed(2)} : 1` : '1 : 1'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Base Token Holdings:</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">
                          {Number(formatUnits(baseTokenBalance?.[0]?.result as bigint || BigInt(0), 18)).toFixed(4)} {baseTokenSymbol}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No Positions Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    You don&apos;t currently hold any tokens from this vault.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs">
                    Use the actions panel to start trading and build your position!
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="md:w-3/4 md:flex-grow bg-white dark:bg-black rounded-xl shadow-lg p-6 sm:p-8 border dark:border-gray-800">
            <h2 className="text-2xl font-bold text-center mb-6 text-black dark:text-white">Vault Actions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <TokenActionPanel
                token={bullToken}
                amount={bullAmount}
                setAmount={setBullAmount}
                onBuy={() => handleBuy(bullToken, bullAmount)}
                onSell={() => handleSell(bullToken, bullAmount)}
                color="green"
                label="Bull"
                isPending={isPending}
                isConfirming={isConfirming}
                baseTokenSymbol={baseTokenSymbol}
              />
              <TokenActionPanel
                token={bearToken}
                amount={bearAmount}
                setAmount={setBearAmount}
                onBuy={() => handleBuy(bearToken, bearAmount)}
                onSell={() => handleSell(bearToken, bearAmount)}
                color="red"
                label="Bear"
                isPending={isPending}
                isConfirming={isConfirming}
                baseTokenSymbol={baseTokenSymbol}
              />
            </div>
            
            <div className="mt-8 p-6 bg-gray-100 dark:bg-[#1a1b1f] rounded-xl border dark:border-gray-700">
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Rebalance Pool</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Fetch the current oracle price and move funds from the losing vault to the winning vault.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-2 text-sm font-mono">
                <h4 className="font-bold text-green-600 dark:text-green-400">Bull Token ({bullToken.symbol})</h4>
                <div className="flex justify-between text-black dark:text-white">
                    <span>Current price:</span>
                    <span>
                    {bullPrice ? `1 ${bullToken.symbol} = ${bullPrice.toFixed(4)} ${baseTokenSymbol}` : 'N/A'}
                    </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Underlying asset:</span>
                    <span>{getUnderlyingSymbol(bullToken.symbol)}</span>
                </div>
                </div>
            
                <div className="space-y-2 text-sm font-mono">
                <h4 className="font-bold text-red-600 dark:text-red-400">Bear Token ({bearToken.symbol})</h4>
                <div className="flex justify-between text-black dark:text-white">
                    <span>Current price:</span>
                    <span>
                    {bearPrice ? `1 ${bearToken.symbol} = ${bearPrice.toFixed(4)} ${baseTokenSymbol}` : 'N/A'}
                    </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Underlying asset:</span>
                    <span>{getUnderlyingSymbol(bearToken.symbol)}</span>
                </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-black p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-black dark:text-white">Oracle Price Information</h4>
                <Button
                    onClick={async () => {
                    if (!walletClient || !(poolId || defaultPoolId)) {
                        toast.error('Wallet not connected');
                        return;
                    }
                    
                    try {
                        setLoadingPrice(true);
                        const { currentPrice, previousPrice } = await getBothPrices(
                        walletClient,
                        poolId || defaultPoolId!
                        );
                        setCurrentPrice(currentPrice);
                        setPreviousPrice(previousPrice);
                        toast.success('Price refreshed successfully!');
                    } catch (err) {
                        console.error('Error refreshing price:', err);
                        toast.error('Failed to refresh price data');
                    } finally {
                        setLoadingPrice(false);
                    }
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    disabled={loadingPrice || !walletClient}
                    title="Refresh oracle price"
                >
                    <RefreshCw className={`h-4 w-4 text-black dark:text-white ${loadingPrice ? 'animate-spin' : ''}`} />
                </Button>
                </div>
                <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between text-black dark:text-white">
                    <span>Current price:</span>
                    <span className="flex items-center gap-1">
                    {loadingPrice ? (
                        <span className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Loading...
                        </span>
                    ) : (
                        currentPrice ? `${currentPrice.toFixed(4)}` : 'N/A'
                    )}
                    </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Previous pool price:</span>
                    <span>{previousPrice ? `${previousPrice.toFixed(4)}` : 'N/A'}</span>
                </div>
                {currentPrice && previousPrice && (
                    <div className="flex justify-between">
                    <span className='text-black dark:text-white'>Price change:</span>
                    <span className={currentPrice > previousPrice ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {currentPrice > previousPrice ? '+' : ''}{((currentPrice - previousPrice) / previousPrice * 100).toFixed(2)}%
                        {currentPrice > previousPrice ? ' ▲' : ' ▼'}
                    </span>
                    </div>
                )}
                </div>
            </div>
            
            <Button
                onClick={handleRebalance}
                className="w-full text-white dark:text-black bg-black dark:bg-white"
                disabled={!isConnected || updatingPrice || isTransacting}
            >
                {updatingPrice ? 'Rebalancing...' : 'Rebalance Pool'}
            </Button>
            </div>
          </section>
        </div>

        {isConnected && address === bullToken.vault_creator && (
          <section className="mt-8 bg-white dark:bg-black rounded-xl shadow-lg p-6 sm:p-8 border dark:border-gray-800">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 flex items-center gap-2">
              <Wrench className="h-6 w-6 text-gray-500" />
              Creator Tools
            </h2>
            <div className="p-6 bg-gray-100 dark:bg-[#1a1b1f] rounded-xl border dark:border-gray-700">
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">Update Price Feed Address</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                As the vault creator, you can update the Chainlink oracle address used by this pool.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">New Price Feed Address</label>
                  <Input
                    type="text"
                    value={newPriceFeedAddress}
                    onChange={(e) => setNewPriceFeedAddress(e.target.value)}
                    className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="0x..."
                    disabled={isTransacting}
                  />
                </div>
                <Button
                  onClick={handleUpdatePriceFeed}
                  className="w-full text-white dark:text-black bg-black dark:bg-white"
                  disabled={!newPriceFeedAddress || isTransacting}
                >
                  {isTransacting ? 'Processing...' : 'Update Price Feed'}
                </Button>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white dark:bg-black rounded-xl shadow-lg p-6 sm:p-8 border dark:border-gray-800">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Vault Details</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <DetailCard title="Fees Structure">
              <DetailItem label="Vault Fee" value={`${formatNum(bullToken.vault_fee / BigInt(1000), 0)}%`} />
              <DetailItem label="Creator Fee" value={`${formatNum(bullToken.vault_creator_fee / BigInt(1000), 0)}%`} />
              <DetailItem label="Treasury Fee" value={`${formatNum(bullToken.treasury_fee / BigInt(1000), 0)}%`} />
            </DetailCard>

            <DetailCard title="Contract Addresses">
              <DetailItem label="Pool Address" value={bullToken.prediction_pool} isAddress />
              <DetailItem label="Bull Token" value={bullToken.id} isAddress />
              <DetailItem label="Bear Token" value={bearToken.id} isAddress />
              <DetailItem label="Base Token" value={base} isAddress />
            </DetailCard>

            <DetailCard title="Vault Information">
              <DetailItem label="Vault Creator" value={bullToken.vault_creator} isAddress />
              <DetailItem label="Price Feed" value={pool.priceFeedAddress} isAddress />
              <DetailItem label="Chain" value={chain?.name || "N/A"} />
            </DetailCard>
          </div>
        </section>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function InteractionClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <InteractionClientContent />
    </Suspense>
  );
}

function InfoCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 rounded-lg flex flex-col justify-between ${className}`}>
      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
      {children}
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-[#1a1b1f] border dark:border-gray-700 h-full">
      <h3 className="font-bold text-black dark:text-white mb-3">{title}</h3>
      <div className="text-sm dark:text-gray-300 space-y-3">{children}</div>
    </div>
  );
}

function DetailItem({ label, value, isAddress = false }: { label: string; value: string | Address; isAddress?: boolean }) {
  const displayValue = isAddress ? formatAddress(value as Address) : value;

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <span className="font-semibold text-gray-600 dark:text-gray-400">{label}</span>
      {isAddress ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <code className="text-xs break-all text-black dark:text-white cursor-pointer">{displayValue}</code>
            </TooltipTrigger>
            <TooltipContent className="bg-black text-white dark:bg-white dark:text-black">
              <p>{value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-sm text-black dark:text-white">{displayValue}</span>
      )}
    </div>
  );
}

function TokenActionPanel({
  token,
  amount,
  setAmount,
  onBuy,
  onSell,
  color,
  label,
  isPending,
  isConfirming,
  baseTokenSymbol,
}: TokenActionPanelProps) {
  const colorClasses = {
    red: 'bg-red-100 border-red-200 dark:border-red-800',
    green: 'bg-green-100 border-green-200 dark:border-green-800',
  };

  const colorClassesButton = {
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  const bgColorClasses = {
    red: 'bg-red-50 dark:bg-red-950/20',
    green: 'bg-green-50 dark:bg-green-950/20',
  };

  const textColorClasses = {
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
  };

  const isTransacting = isPending || isConfirming;

  return (
    <div className={`border rounded-xl p-5 ${bgColorClasses[color]} ${colorClasses[color]}`}>
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-green-500'} mr-2`}></div>
        <h3 className={`font-semibold ${textColorClasses[color]}`}>{label} Token ({token.symbol})</h3>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Amount</label>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="0.00"
            min="0"
            step="0.01"
            disabled={isTransacting}
          />
          <span className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">{token.symbol}</span>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button
          onClick={onBuy}
          className={`flex-1 py-3 ${colorClassesButton[color]} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={!amount || isNaN(Number(amount)) || isTransacting}
        >
          {isTransacting ? 'Processing...' : `Buy ${label}`}
        </Button>
        <Button
          onClick={onSell}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!amount || isNaN(Number(amount)) || isTransacting}
        >
          {isTransacting ? 'Processing...' : `Sell ${label}`}
        </Button>
      </div>

      <div className="mt-3 text-sm dark:text-gray-400">
        <p>Price: 1 {token.symbol} = {(token.price ?? 0).toFixed(4)} {baseTokenSymbol}</p>
        <p>Available: {Number(formatUnits(token.balance || BigInt(0), 18)).toFixed(4)} {token.symbol}</p>
      </div>
    </div>
  );
}