'use client';
import { useState, useEffect } from 'react';
import { Coins, AlertCircle } from 'lucide-react';
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
import { getCurrentPrice, updatePriceAndDistribute } from '@/lib/prices';
import { useSearchParams } from 'next/navigation';
import { FatePoolFactories } from '@/utils/addresses';

interface Token {
  id: Address;
  name: string;
  symbol: string;
  asset: Address;
  vault_creator: Address;
  vault_fee: bigint;
  vault_creator_fee: bigint;
  treasury_fee: bigint;
  asset_balance: bigint;
  supply: bigint;
  prediction_pool: Address;
  other_token: Address;
  price?: number;
  balance?: bigint;
  priceBuy?: number;
  priceSell?: number;
}

interface Pool {
  id: Address;
  bullToken: Token;
  bearToken: Token;
  bullPercentage: number;
  bearPercentage: number;
  previous_price: bigint;
  baseToken: Address;
}

interface ProcessingError extends Error {
  message: string;
}

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
  const chainNames: { [key: number]: string } = {
    1: "Ethereum Mainnet",
    11155111: "Sepolia Testnet",
  };
  
  return Object.keys(FatePoolFactories)
    .map(chainId => chainNames[Number(chainId)] || `Chain ${chainId}`)
    .join(", ");
};

export default function InteractionClient() {
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

  // Write contract hook
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check chain support
  useEffect(() => {
    if (chain?.id && !isChainSupported) {
      toast.error(
        `Chain "${chain.name}" is not supported. Please switch to one of: ${getSupportedChains()}`
      );
    }
  }, [chain, isChainSupported]);

  // Read pool basic data
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
    ],
    query: {
      enabled: !!(poolId || defaultPoolId) && isChainSupported,
    }
  });

  // Get token addresses from pool data
  const baseToken = poolData?.[0]?.result as Address;
  const bullAddr = poolData?.[1]?.result as Address;
  const bearAddr = poolData?.[2]?.result as Address;
  const prevPrice = poolData?.[3]?.result as bigint;

  // Read token data for both bull and bear tokens
  const { data: tokenData } = useReadContracts({
    contracts: bullAddr && bearAddr ? [
      // Bull token data
      { address: bullAddr, abi: CoinABI, functionName: 'name' },
      { address: bullAddr, abi: CoinABI, functionName: 'symbol' },
      { address: bullAddr, abi: CoinABI, functionName: 'asset' },
      { address: bullAddr, abi: CoinABI, functionName: 'vaultCreator' },
      { address: bullAddr, abi: CoinABI, functionName: 'vaultFee' },
      { address: bullAddr, abi: CoinABI, functionName: 'vaultCreatorFee' },
      { address: bullAddr, abi: CoinABI, functionName: 'treasuryFee' },
      { address: bullAddr, abi: CoinABI, functionName: 'totalSupply' },
      // Bear token data
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

  // Read asset balances
  const { data: assetBalances } = useReadContracts({
    contracts: baseToken && bullAddr && bearAddr ? [
      {
        address: baseToken,
        abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }],
        functionName: 'balanceOf',
        args: [bullAddr],
      },
      {
        address: baseToken,
        abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }],
        functionName: 'balanceOf',
        args: [bearAddr],
      },
    ] : [],
    query: {
      enabled: !!(baseToken && bullAddr && bearAddr),
    }
  });

  // Read user token balances
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

  // Read allowances for buying
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

  // Read token allowances for selling
  const { data: tokenAllowances, refetch: refetchTokenAllowances } = useReadContracts({
    contracts: address && bullAddr && bearAddr ? [
      {
        address: bullAddr,
        abi: CoinABI,
        functionName: 'allowance',
        args: [address, bullAddr],
      },
      {
        address: bearAddr,
        abi: CoinABI,
        functionName: 'allowance',
        args: [address, bearAddr],
      },
    ] : [],
    query: {
      enabled: !!(address && bullAddr && bearAddr),
    }
  });

  // Process data when all reads are complete
  useEffect(() => {
    if (!poolData || !tokenData || !assetBalances || !(poolId || defaultPoolId)) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract token data
      const [
        bullName, bullSymbol, bullAsset, bullVcreator, bullVaultFee, bullVcFee, bullTreFee, bullSupply,
        bearName, bearSymbol, bearAsset, bearVcreator, bearVaultFee, bearVcFee, bearTreFee, bearSupply
      ] = tokenData.map(item => item.result);

      const [bullAssetBal, bearAssetBal] = assetBalances.map(item => item.result as bigint);

      // Get user balances
      const bullBalance = userBalances?.[0]?.result as bigint || BigInt(0);
      const bearBalance = userBalances?.[1]?.result as bigint || BigInt(0);

      // Calculate percentages and prices
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
        bullToken,
        bearToken,
        bullPercentage,
        bearPercentage,
        previous_price: prevPrice || BigInt(0),
        baseToken: baseToken!
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
  }, [poolData, tokenData, assetBalances, userBalances, poolId, defaultPoolId, bullAddr, bearAddr, baseToken, prevPrice]);

  // Handle transaction confirmations
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction confirmed!");
      // Refetch data after transaction
      setTimeout(() => {
        refetchPool();
        refetchUserBalances();
        refetchAllowances();
        refetchTokenAllowances();
      }, 2000);
    }
  }, [isConfirmed, refetchPool, refetchUserBalances, refetchAllowances, refetchTokenAllowances]);

  // Fetch current price
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (!walletClient || !(poolId || defaultPoolId)) return;
      
      try {
        setLoadingPrice(true);
        const price = await getCurrentPrice(walletClient, poolId || defaultPoolId!);
        
        if (currentPrice !== null) {
          setPreviousPrice(currentPrice);
        }
        setCurrentPrice(price);
      } catch (err: unknown) {
        console.error('Error fetching current price:', err);
        toast.error((err as Error).message || 'Failed to fetch current price');
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchCurrentPrice();
  }, [walletClient, poolId, defaultPoolId, currentPrice]);

  const handleBuy = async (token: Token, amount: string) => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const amountWei = parseUnits(amount, 18);
      const tokenIndex = token.id === bullAddr ? 0 : 1;
      const currentAllowance = allowances?.[tokenIndex]?.result as bigint || BigInt(0);

      // Check if approval is needed
      if (currentAllowance < amountWei) {
        toast.loading("Approving tokens...");
        await writeContract({
          address: baseToken!,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [token.id, amountWei],
        });
        
        // Wait for approval confirmation before proceeding
        return;
      }

      // Proceed with buy
      await writeContract({
        address: token.id,
        abi: CoinABI,
        functionName: 'buy',
        args: [address, amountWei],
      });

      toast.loading("Processing buy transaction...");
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

    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const amountWei = parseUnits(amount, 18);
      const tokenIndex = token.id === bullAddr ? 0 : 1;
      const currentAllowance = tokenAllowances?.[tokenIndex]?.result as bigint || BigInt(0);

      // Check if approval is needed
      if (currentAllowance < amountWei) {
        toast.loading("Approving tokens...");
        await writeContract({
          address: token.id,
          abi: CoinABI,
          functionName: 'approve',
          args: [token.id, amountWei],
        });
        
        // Wait for approval confirmation before proceeding
        return;
      }

      // Proceed with sell
      await writeContract({
        address: token.id,
        abi: CoinABI,
        functionName: 'sell',
        args: [amountWei],
      });

      toast.loading("Processing sell transaction...");
    } catch (err: unknown) {
      console.error('Sell error:', err);
      toast.error((err as Error).message || 'Failed to sell tokens');
    }
  };

  const handleUpdatePrice = async () => {
    if (!walletClient || !isConnected || !address || !(poolId || defaultPoolId)) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setUpdatingPrice(true);

      // Store current price as previous before updating
      if (currentPrice !== null) {
        setPreviousPrice(currentPrice);
      }

      await updatePriceAndDistribute(walletClient, poolId || defaultPoolId!);
      
      // After tx confirmation, refresh current price
      try {
        const newPrice = await getCurrentPrice(walletClient, poolId || defaultPoolId!);
        setCurrentPrice(newPrice);
        toast.success(`Price updated to $${newPrice.toFixed(4)}`);
      } catch (priceRefreshError) {
        console.error("Failed to refresh price:", priceRefreshError);
        toast.success('Price updated (refresh to see new value)');
      }

    } catch (err: unknown) {
      console.error('Update price error:', err);
      let errorMessage = 'Failed to update price';
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

  // Render unsupported chain message
  if (chain && !isChainSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-center p-4 max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Pool</h2>
          <p>{error}</p>
          <button 
            onClick={() => {
              refetchPool();
              setError(null);
            }} 
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Pool Not Found</h2>
          <p>The requested pool could not be loaded</p>
          <button 
            onClick={() => refetchPool()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
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

  return (
    <div className="w-full pt-14 bg-white dark:bg-black">
      <div className="w-full md:px-24 lg:px-24">
        <div className="container mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center border-b dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Coins className="h-8 w-8 text-black dark:text-white" />
            <h1 className="text-3xl font-bold dark:text-white">
              {`${bullToken.name} / ${bearToken.name} Vault`}
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 p-3 rounded-md text-center border dark:border-gray-700">
              <div className="font-bold dark:text-white">{bullToken.name} Balance</div>
              <div className="font-mono dark:text-white">
                {formatUnits(bullBalance, 18)} {bullToken.symbol}
                <div className="text-sm dark:text-gray-400">
                  ${bullValue.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-md text-center border dark:border-gray-700">
              <div className="font-bold dark:text-white">{bearToken.name} Balance</div>
              <div className="font-mono dark:text-white">
                {formatUnits(bearBalance, 18)} {bearToken.symbol}
                <div className="text-sm dark:text-gray-400">
                  ${bearValue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto space-y-8 py-8">
          <section className="p-6 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
            <h2 className="text-2xl font-bold dark:text-white mb-6">Vault Overview</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                <h3 className="font-semibold dark:text-white mb-2">Market Position</h3>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${bullPercentage}%` }} 
                  />
                </div>
                <div className="flex justify-between text-sm dark:text-gray-400">
                  <span>Bull: {bullPercentage.toFixed(2)}%</span>
                  <span>Bear: {bearPercentage.toFixed(2)}%</span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                <h3 className="font-semibold dark:text-white mb-2">Total Value</h3>
                <p className="text-2xl font-mono dark:text-white">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm dark:text-gray-400 mt-1">
                  {loadingPrice ? (
                    'Loading current price...'
                  ) : currentPrice ? (
                    <>
                      Current Price: ${currentPrice.toFixed(4)}
                      {previousPrice && (
                        <span className="block">
                          Previous Price: ${previousPrice.toFixed(4)}
                          {currentPrice > previousPrice ? (
                            <span className="text-green-500"> ▲</span>
                          ) : currentPrice < previousPrice ? (
                            <span className="text-red-500"> ▼</span>
                          ) : null}
                        </span>
                      )}
                    </>
                  ) : (
                    'Price not available'
                  )}
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                <h3 className="font-semibold dark:text-white mb-2">Token Prices</h3>
                <div className="space-y-2">
                  <p className="dark:text-white">
                    <span className="font-bold">{bullToken.symbol}:</span> ${bullPrice.toFixed(4)}
                    <span className="text-xs dark:text-gray-400 block">Supply: {formatUnits(bullToken.supply, 18)}</span>
                  </p>
                  <p className="dark:text-white">
                    <span className="font-bold">{bearToken.symbol}:</span> ${bearPrice.toFixed(4)}
                    <span className="text-xs dark:text-gray-400 block">Supply: {formatUnits(bearToken.supply, 18)}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-xl bg-white dark:bg-gray-900 border dark:border-gray-700">
            <h2 className="text-2xl font-bold dark:text-white text-center mb-6">Vault Actions</h2>
            
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
              />
            </div>
            
            <div className="mt-8 text-center space-y-4">
              <button
                onClick={handleUpdatePrice}
                className="px-8 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-xl hover:bg-purple-700 dark:hover:bg-purple-800 transition-colors w-full max-w-md"
                disabled={!isConnected || updatingPrice}
              >
                {updatingPrice ? 'Updating Price...' : 'Update Price & Distribute'}
              </button>
              
              <button
                onClick={async () => {
                  try {
                    setLoadingPrice(true);
                    const price = await getCurrentPrice(walletClient!, poolId || defaultPoolId!);
                    setCurrentPrice(price);
                    toast.success(`Current price: $${price.toFixed(4)}`);
                  } catch (priceError) {
                    console.error('Price refresh error:', priceError);
                    toast.error('Failed to refresh price');
                  } finally {
                    setLoadingPrice(false);
                  }
                }}
                className="px-8 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors w-full max-w-md text-sm"
                disabled={!isConnected || loadingPrice}
              >
                {loadingPrice ? 'Refreshing...' : 'Refresh Current Price'}
              </button>
            </div>
          </section>

          <section className="p-6 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
            <h2 className="text-2xl font-bold dark:text-white mb-6">Vault Details</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <DetailCard title="Fees Structure">
                <ul className="space-y-1">
                  <li>Entry Fee: {formatNum(bullToken.vault_fee, 0)}%</li>
                  <li>Exit Fee: {formatNum(bullToken.vault_fee, 0)}%</li>
                  <li>Treasury Fee: {formatNum(bullToken.treasury_fee, 0)}%</li>
                </ul>
              </DetailCard>
              
              <DetailCard title="Contract Addresses">
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">Bull Token:</span>
                    <br />
                    <code className="text-sm break-all">{bullToken.id}</code>
                  </p>
                  <p>
                    <span className="font-semibold">Bear Token:</span>
                    <br />
                    <code className="text-sm break-all">{bearToken.id}</code>
                  </p>
                  <p>
                    <span className="font-semibold">Base Token:</span>
                    <br />
                    <code className="text-sm break-all">{base}</code>
                  </p>
                </div>
              </DetailCard>
              
              <DetailCard title="Vault Information">
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">Creator:</span>
                    <br />
                    <code className="text-sm break-all">{bullToken.vault_creator}</code>
                  </p>
                  <p>
                    <span className="font-semibold">Pool ID:</span>
                    <br />
                    <code className="text-sm break-all">{bullToken.prediction_pool}</code>
                  </p>
                </div>
              </DetailCard>
            </div>
          </section>
        </div>
      </div>
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
}: {
  token: Token;
  amount: string;
  setAmount: (value: string) => void;
  onBuy: () => void;
  onSell: () => void;
  color: 'red' | 'green';
  label: string;
  isPending: boolean;
  isConfirming: boolean;
}) {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  const tokenBalance = token.balance || BigInt(0);
  const tokenPrice = token.price || 0;

  const isTransacting = isPending || isConfirming;

  return (
    <div className={`border rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900`}>
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-green-500'} mr-2`}></div>
        <h3 className="font-semibold dark:text-white">{label} Token ({token.symbol})</h3>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Amount</label>
        <div className="relative">
          <input
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
        <button
          onClick={onBuy}
          className={`flex-1 py-3 ${colorClasses[color]} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={!amount || isNaN(Number(amount)) || isTransacting}
        >
          {isTransacting ? 'Processing...' : `Buy ${label}`}
        </button>
        <button
          onClick={onSell}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!amount || isNaN(Number(amount)) || isTransacting}
        >
          {isTransacting ? 'Processing...' : `Sell ${label}`}
        </button>
      </div>
      
      <div className="mt-3 text-sm dark:text-gray-400">
        <p>Price: ${tokenPrice.toFixed(4)}</p>
        <p>Available: {formatUnits(tokenBalance, 18)} {token.symbol}</p>
      </div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 h-full">
      <h3 className="font-semibold dark:text-white mb-3">{title}</h3>
      <div className="text-sm dark:text-gray-300 space-y-2">{children}</div>
    </div>
  );
}