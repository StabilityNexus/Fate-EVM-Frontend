'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import {
  useAccount,
  useWalletClient,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { formatUnits, parseUnits, type Address, createPublicClient, http, isAddress } from 'viem';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';
import { CoinABI } from '@/utils/abi/Coin';
import { ERC20ABI } from '@/utils/abi/ERC20';
import { ChainlinkOracleABI } from '@/utils/abi/ChainlinkOracle';
import { toast } from 'sonner';
import { updateOracle } from '@/lib/vaultUtils';
import { useSearchParams } from 'next/navigation';
import { getPriceFeedName, CHAIN_PRICE_FEED_OPTIONS } from '@/utils/supportedChainFeed';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { formatNumber, formatNumberDown } from '@/utils/format';
import { validateTransactionInput } from '@/lib/validation';
import { withErrorHandling, createTransactionError } from '@/lib/errorHandler';

// Note: ChainlinkAdapterFactories is imported but can be used for future oracle management features
import TradingViewWidget from '@/components/ui/TradingViewWidget';
import Navbar from '@/components/layout/Navbar';
import { useTheme } from "next-themes";
import { Info } from 'lucide-react';
import { logger } from "@/lib/logger";

// Utility function for safe BigInt subtraction to prevent underflow
const safeBigIntSubtract = (a: bigint, b: bigint): bigint => {
  return a > b ? a - b : BigInt(0);
};

// EVM-based pool hook
const usePool = (poolId: Address | undefined, isConnected: boolean) => {
  const { chain } = useAccount();
  const { address } = useAccount();

  const [pool, setPool] = useState<{
    id: { id: string };
    name: string;
    asset_address: string;
    oracle_address: string;
    current_price: number;
    bull_reserve: bigint;
    bear_reserve: bigint;
    bull_token: { id: string; fields: { symbol: string; total_supply: bigint; name: string } };
    bear_token: { id: string; fields: { symbol: string; total_supply: bigint; name: string } };
    vault_creator: string;
    creator_fee: number;
    mint_fee: number;
    burn_fee: number;
    treasury_fee: number;
    bull_percentage: number;
    bear_percentage: number;
    chainId: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: poolData, refetch: refetchPool } = useReadContracts({
    contracts: [
      { address: poolId, abi: PredictionPoolABI, functionName: 'baseToken' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'bullCoin' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'bearCoin' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'previousPrice' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'oracle' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'poolName' },
    ],
    query: {
      enabled: !!poolId,
    }
  });

  const baseToken = poolData?.[0]?.result as Address;
  const bullAddr = poolData?.[1]?.result as Address;
  const bearAddr = poolData?.[2]?.result as Address;
  // const prevPrice = poolData?.[3]?.result as bigint;
  const oracle = poolData?.[4]?.result as Address;
  const poolName = poolData?.[5]?.result as string;

  const { data: tokenData } = useReadContracts({
    contracts: bullAddr && bearAddr ? [
      { address: bullAddr, abi: CoinABI, functionName: 'name' },
      { address: bullAddr, abi: CoinABI, functionName: 'symbol' },
      { address: bullAddr, abi: CoinABI, functionName: 'totalSupply' },
      { address: bearAddr, abi: CoinABI, functionName: 'name' },
      { address: bearAddr, abi: CoinABI, functionName: 'symbol' },
      { address: bearAddr, abi: CoinABI, functionName: 'totalSupply' },
      { address: baseToken, abi: ERC20ABI, functionName: 'balanceOf', args: [bullAddr] },
      { address: baseToken, abi: ERC20ABI, functionName: 'balanceOf', args: [bearAddr] },
    ] : [],
    query: {
      enabled: !!(bullAddr && bearAddr),
    }
  });

  const { data: userBalancesData } = useReadContracts({
    contracts: address && bullAddr && bearAddr ? [
      { address: bullAddr, abi: CoinABI, functionName: 'balanceOf', args: [address] },
      { address: bearAddr, abi: CoinABI, functionName: 'balanceOf', args: [address] },
    ] : [],
    query: {
      enabled: !!(address && bullAddr && bearAddr),
    }
  });

  const { data: vaultCreatorData } = useReadContracts({
    contracts: bullAddr ? [
      { address: bullAddr, abi: CoinABI, functionName: 'vaultCreator' },
    ] : [],
    query: {
      enabled: !!bullAddr,
    }
  });

  // Read fee data from prediction pool contract
  const { data: poolFeeData } = useReadContracts({
    contracts: poolId ? [
      { address: poolId, abi: PredictionPoolABI, functionName: 'mintFee' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'burnFee' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'creatorFee' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'treasuryFee' },
    ] : [],
    query: {
      enabled: !!poolId,
    }
  });


  const vaultCreator = vaultCreatorData?.[0]?.result as Address;


  useEffect(() => {
    if (!poolId || !tokenData) {
      setLoading(true);
      return;
    }

    try {
      const bullName = tokenData?.[0]?.result as string || 'Bull Token';
      const bullSymbol = tokenData?.[1]?.result as string || 'BULL';
      const bullSupply = tokenData?.[2]?.result as bigint || BigInt(0);
      const bearName = tokenData?.[3]?.result as string || 'Bear Token';
      const bearSymbol = tokenData?.[4]?.result as string || 'BEAR';
      const bearSupply = tokenData?.[5]?.result as bigint || BigInt(0);
      const bullReserve = tokenData?.[6]?.result as bigint || BigInt(0);
      const bearReserve = tokenData?.[7]?.result as bigint || BigInt(0);

      const totalReserves = Number(formatUnits(bullReserve, 18)) + Number(formatUnits(bearReserve, 18));
      const bullPercentage = totalReserves > 0 ? (Number(formatUnits(bullReserve, 18)) / totalReserves) * 100 : 50;
      const bearPercentage = 100 - bullPercentage;

      // const userBullBalance = userBalancesData?.[0]?.result as bigint || BigInt(0);
      // const userBearBalance = userBalancesData?.[1]?.result as bigint || BigInt(0);
      
      const newPool = {
        id: { id: poolId },
        name: poolName || "Prediction Pool",
        asset_address: baseToken,
        oracle_address: oracle, // Add the actual oracle address
        current_price: totalReserves > 0 ? totalReserves * 1e18 : 0,
        bull_reserve: bullReserve,
        bear_reserve: bearReserve,
        bull_token: { 
        id: bullAddr,
          fields: { 
            symbol: bullSymbol, 
            total_supply: bullSupply,
            name: bullName
          } 
        },
        bear_token: { 
          id: bearAddr,
          fields: { 
            symbol: bearSymbol, 
            total_supply: bearSupply,
            name: bearName
          } 
        },
        vault_creator: vaultCreator,
        creator_fee: poolFeeData?.[2]?.result ? Number(poolFeeData[2].result) / 1000 : 0,
        mint_fee: poolFeeData?.[0]?.result ? Number(poolFeeData[0].result) / 1000 : 0,
        burn_fee: poolFeeData?.[1]?.result ? Number(poolFeeData[1].result) / 1000 : 0,
        treasury_fee: poolFeeData?.[3]?.result ? Number(poolFeeData[3].result) / 1000 : 0,
        bull_percentage: bullPercentage,
        bear_percentage: bearPercentage,
        chainId: chain?.id || 1,
      };

      setPool(newPool);
      setLoading(false);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load pool data");
      setLoading(false);
    }
  }, [poolId, tokenData, userBalancesData, isConnected, poolName, baseToken, bullAddr, bearAddr, vaultCreator, chain, poolFeeData, oracle]);

  const userBalances = {
    bull_tokens: userBalancesData?.[0]?.result as bigint || BigInt(0),
    bear_tokens: userBalancesData?.[1]?.result as bigint || BigInt(0),
  };
  const userAvgPrices = { bull_avg_price: 0, bear_avg_price: 0 };

  return { pool, userBalances, userAvgPrices, loading, error, refetch: refetchPool };
};


const formatValue = (value: number) => `${formatNumber(value, 3)} WETH`;


function VaultSection({ isBull, poolData, userTokens, price, value, symbol, connected, handlePoll, reserve, supply, tokenAddress }: {
  isBull: boolean;
  poolData: {
    id: { id: string };
    name: string;
    asset_address: string;
    oracle_address: string;
    current_price: number;
    bull_reserve: bigint;
    bear_reserve: bigint;
    bull_token: { id: string; fields: { symbol: string; total_supply: bigint; name: string } };
    bear_token: { id: string; fields: { symbol: string; total_supply: bigint; name: string } };
    vault_creator: string;
    creator_fee: number;
    mint_fee: number;
    burn_fee: number;
    treasury_fee: number;
    bull_percentage: number;
    bear_percentage: number;
    chainId: number;
  };
  userTokens: bigint;
  price: number;
  value: number;
  symbol: string;
  connected: boolean;
  handlePoll: () => void;
  reserve: number;
  supply: number;
  tokenAddress: string;
}) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending: isTransactionPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const isTransacting = isTransactionPending || isConfirming;

  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [baseTokenBalance, setBaseTokenBalance] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [pendingApproval, setPendingApproval] = useState<{ amount: string; type: 'buy' | 'sell' } | null>(null);

  // Get base token balance for MAX calculation
  const { data: baseTokenBalanceData } = useReadContracts({
    contracts: address && poolData?.asset_address ? [
      { address: poolData.asset_address as `0x${string}`, abi: ERC20ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
    ] : [],
    query: {
      enabled: !!(address && poolData?.asset_address),
    }
  });

  // Get allowance for the token
  const { data: allowanceData } = useReadContracts({
    contracts: address && poolData?.asset_address && tokenAddress ? [
      { address: poolData.asset_address as `0x${string}`, abi: ERC20ABI, functionName: 'allowance', args: [address as `0x${string}`, tokenAddress as `0x${string}`] },
    ] : [],
    query: {
      enabled: !!(address && poolData?.asset_address && tokenAddress),
    }
  });

  useEffect(() => {
    if (baseTokenBalanceData?.[0]?.result) {
      setBaseTokenBalance(baseTokenBalanceData[0].result as bigint);
    }
  }, [baseTokenBalanceData]);

  useEffect(() => {
    if (allowanceData?.[0]?.result) {
      setAllowance(allowanceData[0].result as bigint);
    }
  }, [allowanceData]);




  const handleBuyTransaction = useCallback(async (amount: string) => {
    let loadingToast: string | number | undefined;
    
    try {
      const amountWei = parseUnits(amount, 18);
      
      loadingToast = toast.loading("Processing buy transaction...");
      await writeContract({
        address: tokenAddress! as `0x${string}`,
        abi: CoinABI,
        functionName: 'buy',
        args: [address!, amountWei],
      });
      
      // Wait for the transaction to be confirmed and get the hash
      // The hash will be available in the data property after the transaction is submitted
      // For now, we'll handle the cache update in the useEffect when isConfirmed becomes true
      toast.success("Transaction submitted! Waiting for confirmation...");
    } catch (err: unknown) {
      logger.error("Buy transaction error:", err instanceof Error ? err : undefined);
      toast.error((err as Error).message || "Failed to buy tokens");
    } finally {
      if (loadingToast !== undefined) {
        toast.dismiss(loadingToast);
      }
    }
  }, [tokenAddress, address, writeContract]);

  const handleBuy = withErrorHandling(async () => {
    if (!address || !connected) {
      const errorMessage = "Please connect your wallet";
      toast.error(errorMessage);
      throw createTransactionError(errorMessage);
    }

    if (!tokenAddress || !poolData?.asset_address) {
      const errorMessage = "Token information not available";
      toast.error(errorMessage);
      throw createTransactionError(errorMessage);
    }

    // Validate input with new validation system
    let validatedInput;
    try {
      validatedInput = validateTransactionInput({
        amount: buyAmount,
        poolId: poolData?.asset_address as Address,
        chainId: poolData?.chainId || 1, // Use pool chain or fallback to mainnet
        userAddress: address
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid transaction input";
      toast.error(errorMessage);
      throw createTransactionError(errorMessage);
    }

    const amountWei = parseUnits(validatedInput.amount.toString(), 18);
    
    // Check user's base token balance
    const userBaseTokenBalance = baseTokenBalance || BigInt(0);
    if (userBaseTokenBalance < amountWei) {
      const errorMessage = `Insufficient balance. You have ${formatUnits(userBaseTokenBalance, 18)} base tokens available.`;
      toast.error(errorMessage);
      throw createTransactionError(errorMessage);
    }

    // Check allowance
    const currentAllowance = allowance || BigInt(0);
    if (currentAllowance < amountWei) {
      const approvalToast = toast.loading("Approving tokens...");
      setPendingApproval({ amount: buyAmount, type: 'buy' });
      await writeContract({
        address: poolData.asset_address as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [tokenAddress, amountWei],
      });
      toast.dismiss(approvalToast);
      return;
    }

    await handleBuyTransaction(buyAmount);
  }, { functionName: 'handleBuy' });

  const handleSell = async () => {
    if (!address || !connected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!sellAmount || isNaN(Number(sellAmount)) || Number(sellAmount) <= 0) {
      toast.error("Please enter a valid amount greater than zero");
      return;
    }

    if (!tokenAddress) {
      toast.error("Token information not available");
      return;
    }

    let loadingToast: string | number | undefined;
    
    try {
      const amountWei = parseUnits(sellAmount, 18);
      
      // Check user's token balance
      if (userTokens < amountWei) {
        toast.error(`Insufficient ${symbol} balance. You have ${formatUnits(userTokens, 18)} ${symbol} available.`);
        return;
      }

      loadingToast = toast.loading("Processing sell transaction...");
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: CoinABI,
        functionName: 'sell',
        args: [amountWei],
      });
      setSellAmount('');
      
      // Wait for the transaction to be confirmed
      // The hash will be available in the data property after the transaction is submitted
      // For now, we'll handle the cache update in the useEffect when isConfirmed becomes true
      toast.success("Transaction submitted! Waiting for confirmation...");
    } catch (err: unknown) {
      logger.error('Sell error:', err instanceof Error ? err : undefined);
      toast.error((err as Error).message || 'Failed to sell tokens');
    } finally {
      if (loadingToast !== undefined) {
        toast.dismiss(loadingToast);
      }
    }
  };

  useEffect(() => {
    if (isConfirmed && !isTransactionPending) {
      if (pendingApproval && pendingApproval.type === 'buy') {
        setPendingApproval(null);
        handleBuyTransaction(pendingApproval.amount);
      } else {
        handlePoll();
      }
    }
  }, [isConfirmed, isTransactionPending, pendingApproval, handlePoll, handleBuyTransaction, poolData.id.id]);

  const vaultTitle = isBull ? 'Bull Vault' : 'Bear Vault';
  const vaultIcon = isBull ? (
    <TrendingUp className="w-5 h-5 text-white" />
  ) : (
    <TrendingDown className="w-5 h-5 text-white" />
  );
  // const vaultColor = isBull ? 'text-green-600' : 'text-red-600';
  const buttonColor = isBull ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded flex items-center justify-center ${isBull ? 'bg-black' : 'bg-gray-400'}`}>
          {vaultIcon}
        </div>
        <h3 className="text-sm md:text-lg font-bold text-black dark:text-white">{vaultTitle}</h3>
      </div>

      {/* Divider */}
      <div className="border-b border-gray-200 dark:border-neutral-700 mb-4"></div>

      {/* Vault Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Reserve</span>
          <span className="font-medium text-black dark:text-white">{formatNumber(reserve, 6)} WETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Supply</span>
          <span className="font-medium text-black dark:text-white">{formatNumber(supply, 6)} {symbol}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Price</span>
          <span className="font-medium text-black dark:text-white">{formatNumber(price, 6)} WETH</span>
        </div>
      </div>

      {/* Connect Wallet Section - Show when wallet is not connected */}
      {!connected ? (
        <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-neutral-600">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Connect your wallet to start trading
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Your Position */}
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 mb-4">
            <h4 className="font-bold text-sm md:text-base text-black dark:text-white mb-3">YOUR POSITION</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tokens</span>
                <span className="font-medium text-black dark:text-white">{formatNumber(Number(formatUnits(userTokens, 18)), 4)} {symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Value</span>
                <span className="font-medium text-black dark:text-white">{formatNumber(value, 4)} WETH</span>
              </div>
            </div>
          </div>

          {/* Buy Section */}
          <div className="mb-4">
            <h4 className="font-bold text-sm md:text-base text-black dark:text-white mb-3">BUY {symbol}</h4>
            <div className="space-y-2">
              <div>
                <Input
                  type="number"
                  placeholder="Enter WETH amount"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="w-full"
                  disabled={isTransacting}
                />
                <div 
                  className="mt-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => setBuyAmount(formatNumberDown(Number(formatUnits(baseTokenBalance, 18)), 4))}
                >
                  Max: {formatNumberDown(Number(formatUnits(baseTokenBalance, 18)), 4)} WETH
                </div>
              </div>
              <Button 
                onClick={() => handleBuy()} 
                className={`w-full ${buttonColor} text-white`} 
                disabled={!buyAmount || !connected || isTransacting}
              >
                {isTransacting ? 'Processing...' : `Buy ${symbol} Tokens`}
              </Button>
            </div>
          </div>

          {/* Sell Section */}
          <div>
            <h4 className="font-bold text-sm md:text-base text-black dark:text-white mb-3">SELL {symbol}</h4>
            <div className="space-y-2">
              <div>
                <Input
                  type="number"
                  placeholder="Enter token amount"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  className="w-full"
                  disabled={isTransacting}
                />
                <div 
                  className="mt-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => setSellAmount(formatNumberDown(Number(formatUnits(userTokens, 18)), 4))}
                >
                  Max: {formatNumberDown(Number(formatUnits(userTokens, 18)), 4)} {symbol}
                </div>
              </div>
              <Button 
                onClick={() => handleSell()} 
                className="w-full bg-gray-100 hover:bg-gray-200 text-black border border-gray-300" 
                disabled={!sellAmount || !connected || isTransacting}
              >
                {isTransacting ? 'Processing...' : `Sell ${symbol} Tokens`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// const formatAddress = (address: Address | string | undefined): string => {
//   if (!address) return 'N/A';
//   if (typeof address !== 'string' || address.length < 10) {
//     return address;
//   }
//   return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
// };

export default function InteractionClient() {
  // const stickyRef = useRef<HTMLElement | null>(null);
  const { theme } = useTheme();
  const params = useSearchParams();
  const { address, isConnected, chain } = useAccount(); // eslint-disable-line @typescript-eslint/no-unused-vars
  // Validate poolId from query params - don't default to zero address
  const poolIdParam = params.get("id");
  const poolId = poolIdParam && isAddress(poolIdParam) ? (poolIdParam as Address) : undefined;

  const { pool, userBalances, loading, error, refetch } = usePool(poolId, isConnected);
  const { data: walletClient } = useWalletClient();

  // Read oracle prices from prediction pool contract
  const { data: oraclePriceData } = useReadContracts({
    contracts: poolId ? [
      { address: poolId, abi: PredictionPoolABI, functionName: 'getCurrentPrice' },
      { address: poolId, abi: PredictionPoolABI, functionName: 'previousPrice' },
    ] : [],
    query: {
      enabled: !!poolId,
    }
  });

  // Fetch the underlying price feed address from the ChainlinkOracle contract
  const { data: underlyingPriceFeedData } = useReadContracts({
    contracts: pool?.oracle_address && pool.oracle_address !== "0x0000000000000000000000000000000000000000" ? [
      { address: pool.oracle_address as Address, abi: ChainlinkOracleABI, functionName: 'priceFeed' },
    ] : [],
    query: {
      enabled: !!(pool?.oracle_address && pool.oracle_address !== "0x0000000000000000000000000000000000000000"),
    }
  });

  const [isDistributeLoading, setIsDistributeLoading] = useState(false);
  const [distributeError, setDistributeError] = useState("");
  // const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [lastRebalanceTime, setLastRebalanceTime] = useState<Date | null>(null);
  
  // Initialize from localStorage on mount
  useEffect(() => {
    if (poolId) {
      const stored = localStorage.getItem(`lastRebalance_${poolId}`);
      if (stored) {
        setLastRebalanceTime(new Date(stored));
        logger.debug('Loaded rebalance time from localStorage:', { rebalanceTime: new Date(stored).toLocaleString() });
      }
    }
  }, [poolId]);
  // const [gasEstimate, setGasEstimate] = useState<bigint>(BigInt(150000));
  // const [gasPrice, setGasPrice] = useState<bigint>(BigInt(0));
  const [newOracleAddress, setNewOracleAddress] = useState<string>('');
  const [isFetchingRebalanceEvents, setIsFetchingRebalanceEvents] = useState(false);
  
  // const POLLING_INTERVAL = 5000;
  const [pollingEnabledState, setPollingEnabledState] = useState(true);

  // Fetch the last rebalance event from blockchain
  const fetchLastRebalanceEvent = useCallback(async () => {
    if (!poolId || !walletClient) {
      logger.debug('fetchLastRebalanceEvent: Missing poolId or walletClient', { poolId, walletClient: !!walletClient });
      return;
    }

    try {
      logger.debug('fetchLastRebalanceEvent: Starting to fetch events for pool:', { poolId });
      setIsFetchingRebalanceEvents(true);
      const publicClient = createPublicClient({
        chain: walletClient.chain,
        transport: http()
      });

      logger.debug('fetchLastRebalanceEvent: Created public client for chain:', { chainName: walletClient.chain.name });
      
      // Use the correct Rebalanced event signature from the ABI
      const rebalancedEventABI = {
        type: 'event',
        name: 'Rebalanced',
        inputs: [
          { name: 'caller', type: 'address', indexed: true, internalType: 'address' },
          { name: 'blockNumber', type: 'uint256', indexed: true, internalType: 'uint256' },
          { name: 'oldPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
          { name: 'newPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
          { name: 'priceChangePercent', type: 'uint256', indexed: false, internalType: 'uint256' },
          { name: 'bullReservesBefore', type: 'uint256', indexed: false, internalType: 'uint256' },
          { name: 'bearReservesBefore', type: 'uint256', indexed: false, internalType: 'uint256' },
          { name: 'bullReservesAfter', type: 'uint256', indexed: false, internalType: 'uint256' },
          { name: 'bearReservesAfter', type: 'uint256', indexed: false, internalType: 'uint256' }
        ]
      } as const;

      // Approach 1: Use the exact event ABI definition
      try {
        logger.debug('Approach 1: Trying with correct Rebalanced event ABI...');
        const logs = await publicClient.getLogs({
          address: poolId as Address,
          event: rebalancedEventABI,
          fromBlock: 'earliest',
          toBlock: 'latest'
        });

        logger.debug('Approach 1: Found Rebalanced logs:', { logCount: logs.length });
        
        if (logs.length > 0) {
          const latestEvent = logs[logs.length - 1];
          const block = await publicClient.getBlock({ blockNumber: latestEvent.blockNumber });
          const rebalanceTime = new Date(Number(block.timestamp) * 1000);
          setLastRebalanceTime(rebalanceTime);
          localStorage.setItem(`lastRebalance_${poolId}`, rebalanceTime.toISOString());
          
          logger.debug('Success with Approach 1 - Last rebalance event found:', {
            blockNumber: latestEvent.blockNumber,
            timestamp: block.timestamp,
            rebalanceTime: rebalanceTime.toLocaleString(),
            eventArgs: latestEvent.args
          });
          return;
        }
      } catch (approach1Error) {
        logger.debug('Approach 1 failed:', { error: approach1Error });
      }

      // Approach 2: Use event topic hash to find rebalance events
      try {
        logger.debug('Approach 2: Searching by event topic hash...');
        
        // Get the event topic hash (keccak256 of event signature)
        // const eventSignature = 'Rebalanced(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)';
        const allLogs = await publicClient.getLogs({
          address: poolId as Address,
          fromBlock: 'earliest',
          toBlock: 'latest'
        });

        logger.debug('Approach 2: Found total logs:', { logCount: allLogs.length });
        
        // Look for rebalance events by checking if they have the expected number of topics
        const rebalanceEvents = allLogs.filter((log: { topics: string[] }) => {
          // Rebalanced event has 2 indexed parameters (caller, blockNumber) + event signature = 3 topics total
          return log.topics && log.topics.length === 3;
        });

        logger.debug('Approach 2: Potential rebalance events (by topic count):', { eventCount: rebalanceEvents.length });
        
        if (rebalanceEvents.length > 0) {
          const latestEvent = rebalanceEvents[rebalanceEvents.length - 1];
          const block = await publicClient.getBlock({ blockNumber: latestEvent.blockNumber });
          const rebalanceTime = new Date(Number(block.timestamp) * 1000);
          setLastRebalanceTime(rebalanceTime);
          localStorage.setItem(`lastRebalance_${poolId}`, rebalanceTime.toISOString());
          
          logger.debug('Success with Approach 2 - Found rebalance event:', {
            blockNumber: latestEvent.blockNumber,
            timestamp: block.timestamp,
            rebalanceTime: rebalanceTime.toLocaleString(),
            topics: latestEvent.topics
          });
          return;
        }
      } catch (approach2Error) {
        logger.debug('Approach 2 failed:', { error: approach2Error });
      }

      // Approach 3: Check recent blocks for any pool activity
      try {
        logger.debug('Approach 3: Checking recent pool activity...');
        const latestBlock = await publicClient.getBlockNumber();
        const startBlock = safeBigIntSubtract(latestBlock, BigInt(10000)); // Check last 10000 blocks, but never go below 0
        
        const recentLogs = await publicClient.getLogs({
          address: poolId as Address,
          fromBlock: startBlock,
          toBlock: 'latest'
        });

        logger.debug('Approach 3: Found recent logs in last 10000 blocks:', { logCount: recentLogs.length });
        
        if (recentLogs.length > 0) {
          // Use the most recent activity as a potential rebalance indicator
          const latestActivity = recentLogs[recentLogs.length - 1];
          const block = await publicClient.getBlock({ blockNumber: latestActivity.blockNumber });
          const rebalanceTime = new Date(Number(block.timestamp) * 1000);
          setLastRebalanceTime(rebalanceTime);
          localStorage.setItem(`lastRebalance_${poolId}`, rebalanceTime.toISOString());
          
          logger.debug('Success with Approach 3 - Using latest pool activity:', {
            blockNumber: latestActivity.blockNumber,
            timestamp: block.timestamp,
            rebalanceTime: rebalanceTime.toLocaleString()
          });
          return;
        }
      } catch (approach3Error) {
        logger.debug('Approach 3 failed:', { error: approach3Error });
      }

      logger.warn('All approaches failed - No rebalance events found for pool:', { poolId });
      // Don't set to null immediately, check localStorage first
      const storedTime = localStorage.getItem(`lastRebalance_${poolId}`);
      if (!storedTime) {
        setLastRebalanceTime(null);
      }
      
    } catch (error) {
      logger.error('Error fetching rebalance events:', error instanceof Error ? error : undefined);
      // Don't set to null on error, keep existing value
    } finally {
      setIsFetchingRebalanceEvents(false);
    }
  }, [poolId, walletClient]);

  // Fetch gas data
  useEffect(() => {
    const fetchGasData = async () => {
      if (!walletClient) return;
      
      try {
        // const publicClient = createPublicClient({
        //   chain: walletClient.chain,
        //   transport: http()
        // });
        
        // const gasPrice = await publicClient.getGasPrice();
        // setGasPrice(gasPrice);
        
        // Estimate gas for a typical buy transaction
        if (poolId) {
          try {
            // const gasEstimate = await publicClient.estimateContractGas({
            //   address: poolId,
            //   abi: PredictionPoolABI,
            //   functionName: 'rebalance',
            //   account: address,
            // });
            // setGasEstimate(gasEstimate);
          } catch {
            // Use default estimate if specific estimation fails
            // setGasEstimate(BigInt(150000));
          }
        }
      } catch (error) {
        logger.error('Error fetching gas data:', error instanceof Error ? error : undefined);
      }
    };

    fetchGasData();
  }, [walletClient, poolId, address]);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (poolId) {
      const storedTime = localStorage.getItem(`lastRebalance_${poolId}`);
      if (storedTime) {
        try {
          const parsedTime = new Date(storedTime);
          if (!isNaN(parsedTime.getTime())) {
            logger.debug('Loaded last rebalance time from localStorage:', { rebalanceTime: parsedTime.toLocaleString() });
            setLastRebalanceTime(parsedTime);
          }
        } catch (error) {
          logger.error('Error parsing stored rebalance time:', error instanceof Error ? error : undefined);
        }
      }
    }
  }, [poolId]);

  // Fetch last rebalance event on mount and when pool changes
  useEffect(() => {
    logger.debug('Initial fetch effect triggered:', { poolId, walletClient: !!walletClient });
    if (poolId && walletClient) {
      logger.debug('Calling fetchLastRebalanceEvent from initial effect');
      fetchLastRebalanceEvent();
    }
  }, [poolId, walletClient, fetchLastRebalanceEvent]);

  const handlePoll = useCallback(async () => {
    if (!pool?.id?.id || loading) return;

    try {
      await refetch?.();
      // setLastUpdateTime(new Date());
    } catch (err) {
      logger.error("Polling error:", err instanceof Error ? err : undefined);
    }
  }, [pool?.id?.id, loading, refetch]);

  const { writeContract, isPending, data: rebalanceHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isRebalanceConfirmed } = useWaitForTransactionReceipt({ hash: rebalanceHash });
  const isTransactionPending = isPending || isConfirming;

  const handleDistribute = async () => {
    if (!isConnected || !address || !poolId) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsDistributeLoading(true);
      setDistributeError("");
      
      // Store the rebalance time immediately when called
      const rebalanceCallTime = new Date();
      setLastRebalanceTime(rebalanceCallTime);
      localStorage.setItem(`lastRebalance_${poolId}`, rebalanceCallTime.toISOString());
      logger.debug('Stored rebalance time in localStorage:', { rebalanceTime: rebalanceCallTime.toLocaleString() });
      
      const loadingToast = toast.loading("Rebalancing pool...");
      await writeContract({
        address: poolId,
        abi: PredictionPoolABI,
        functionName: 'rebalance',
      });
      toast.dismiss(loadingToast);
    } catch (err: unknown) {
      logger.error('Rebalance error:', err instanceof Error ? err : undefined);
      let errorMessage = 'Failed to rebalance pool';
      if ((err as Error).message.includes("user rejected transaction")) {
        errorMessage = "Transaction rejected";
      } else if ((err as Error).message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds";
      }
      setDistributeError(errorMessage);
      setIsDistributeLoading(false);
    }
  };

  const handleUpdateOracle = async () => {
    if (!walletClient || !isConnected || !address || !poolId || !newOracleAddress) {
      toast.error('Please provide a valid oracle address');
      return;
    }

    try {
      setIsDistributeLoading(true);
      await updateOracle(walletClient, poolId, newOracleAddress as Address);
      toast.success('Oracle updated successfully!');
      setNewOracleAddress('');
      await handlePoll();
    } catch (err: unknown) {
      logger.error('Update oracle error:', err instanceof Error ? err : undefined);
      let errorMessage = 'Failed to update oracle';
      if ((err as Error).message.includes("user rejected transaction")) {
        errorMessage = "Transaction rejected";
      } else if ((err as Error).message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds";
      }
      setDistributeError(errorMessage);
    } finally {
      setIsDistributeLoading(false);
    }
  };

  const poolData = useMemo(() => pool
    ? {
        id: { id: pool.id?.id || "" },
        name: pool.name || "Prediction Pool",
        asset_address: pool.asset_address || "0x...",
        oracle_address: pool.oracle_address || "0x...", // Use actual oracle address
        current_price: pool.current_price || 0,
        bull_reserve: pool.bull_reserve || BigInt(0),
        bear_reserve: pool.bear_reserve || BigInt(0),
        bull_token: pool.bull_token || { id: "0x...", fields: { symbol: "BULL", total_supply: BigInt(0), name: "Bull Token" } },
        bear_token: pool.bear_token || { id: "0x...", fields: { symbol: "BEAR", total_supply: BigInt(0), name: "Bear Token" } },
        vault_creator: pool.vault_creator || "",
        creator_fee: pool.creator_fee || 0,
        mint_fee: pool.mint_fee || 0,
        burn_fee: pool.burn_fee || 0,
        treasury_fee: pool.treasury_fee || 0,
        bull_percentage: pool.bull_percentage || 50,
        bear_percentage: pool.bear_percentage || 50,
        chainId: pool.chainId || 1,
      }
    : {
        id: { id: "" },
        name: "Loading...",
        asset_address: "0x...",
        oracle_address: "0x...",
        current_price: 0,
        bull_reserve: BigInt(0),
        bear_reserve: BigInt(0),
        bull_token: { id: "0x...", fields: { symbol: "BULL", total_supply: BigInt(0), name: "Bull Token" } },
        bear_token: { id: "0x...", fields: { symbol: "BEAR", total_supply: BigInt(0), name: "Bear Token" } },
        vault_creator: "",
        creator_fee: 0,
        mint_fee: 0,
        burn_fee: 0,
        treasury_fee: 0,
        bull_percentage: 50,
        bear_percentage: 50,
        chainId: 1,
      }, [pool]);

  const calculations = useMemo(() => {
    const bullReserveNum = Number(formatUnits(poolData.bull_reserve, 18));
    const bearReserveNum = Number(formatUnits(poolData.bear_reserve, 18));
    const bullSupplyNum = Number(formatUnits(poolData.bull_token.fields.total_supply, 18));
    const bearSupplyNum = Number(formatUnits(poolData.bear_token.fields.total_supply, 18));
    const userBullTokens = Number(formatUnits(userBalances.bull_tokens, 18));
    const userBearTokens = Number(formatUnits(userBalances.bear_tokens, 18));

    const totalReserves = bullReserveNum + bearReserveNum;
    const bullPercentage = pool?.bull_percentage || (totalReserves > 0 ? (bullReserveNum / totalReserves) * 100 : 50);
    const bearPercentage = pool?.bear_percentage || (totalReserves > 0 ? (bearReserveNum / totalReserves) * 100 : 50);

    const bullPrice = bullSupplyNum > 0 ? bullReserveNum / bullSupplyNum : 1;
    const bearPrice = bearSupplyNum > 0 ? bearReserveNum / bearSupplyNum : 1;

    const userBullValue = userBullTokens * bullPrice;
    const userBearValue = userBearTokens * bearPrice;

    const userBullReturns = 0;
    const userBearReturns = 0;

    return {
      totalReserves,
      bullPercentage,
      bearPercentage,
      bullPrice,
      bearPrice,
      userBullTokens,
      userBearTokens,
      userBullValue,
      userBearValue,
      userBullReturns,
      userBearReturns,
      bullReserveNum,
      bearReserveNum,
      bullSupplyNum,
      bearSupplyNum,
    };
  }, [poolData, userBalances, pool]);

  // Get the current chain ID from the pool data or use default
  const chainId = poolData.chainId || 1;
  
  // Get the underlying price feed address (the actual Chainlink price feed)
  const underlyingPriceFeedAddress = underlyingPriceFeedData?.[0]?.result as Address;
  const oracleAddress = underlyingPriceFeedAddress || poolData.oracle_address || '';
  const priceFeedName = getPriceFeedName(oracleAddress, chainId);
  
  // Create asset configuration based on the price feed
  const asset = {
    name: priceFeedName,
    color: '#627EEA', // Default color
    coinId: priceFeedName.toLowerCase().replace(' / ', '').replace(' ', '') // Convert "ETH / USD" to "ethusd"
  };

  // Debug logging for price feed detection
  logger.debug('=== PRICE FEED DEBUG ===');
  logger.debug('Pool Oracle Address (wrapper):', { oracleAddress: pool?.oracle_address });
  logger.debug('Underlying Price Feed Address:', { underlyingPriceFeedAddress });
  logger.debug('Final Oracle Address used:', { oracleAddress });
  logger.debug('Chain ID:', { chainId });
  logger.debug('Available feeds for this chain:', { feeds: CHAIN_PRICE_FEED_OPTIONS[chainId] });
  logger.debug('Price Feed Name:', { priceFeedName });
  logger.debug('Asset CoinId:', { coinId: asset.coinId });
  logger.debug('Is Oracle Address Valid:', { isValid: oracleAddress && oracleAddress.length === 42 && oracleAddress.startsWith('0x') });
  logger.debug('Oracle Address Length:', { length: oracleAddress?.length });
  logger.debug('=== END DEBUG ===');


  const previousPoolData = useRef(poolData);
  const changes = useMemo(() => {
    return {
      bull_reserve: poolData.bull_reserve !== previousPoolData.current.bull_reserve,
      bear_reserve: poolData.bear_reserve !== previousPoolData.current.bear_reserve,
    };
  }, [poolData]);

  // Handle rebalance transaction confirmation
  useEffect(() => {
    logger.debug('Rebalance confirmation effect:', { 
      isRebalanceConfirmed, 
      isTransactionPending, 
      rebalanceHash 
    });
    
    if (isRebalanceConfirmed && !isTransactionPending) {
      logger.debug('Rebalance confirmed! Setting current time as last rebalance time...');
      toast.success('Pool rebalanced successfully!');
      setIsDistributeLoading(false);
      
      // Immediately set the current time as the last rebalance time
      const currentTime = new Date();
      setLastRebalanceTime(currentTime);
      localStorage.setItem(`lastRebalance_${poolId}`, currentTime.toISOString());
      logger.debug('Updated last rebalance time to current time:', { rebalanceTime: currentTime.toLocaleString() });
      
      handlePoll();
      
      // Also fetch from blockchain to verify (but don't override if it fails)
      setTimeout(() => {
        logger.debug('Fetching rebalance events from blockchain to verify...');
        fetchLastRebalanceEvent();
      }, 3000); // Wait 3 seconds for blockchain to update
    }
  }, [isRebalanceConfirmed, isTransactionPending, handlePoll, fetchLastRebalanceEvent, rebalanceHash, poolId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setPollingEnabledState(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (loading && !pool)
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
        <Loading size="xl" />
      </div>
    );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="text-center">
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-neutral-900 dark:text-white">
            Error Loading Pool
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white">
      <Navbar />

        <div className="container mx-auto px-5 py-4">
          {distributeError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 font-medium">
              {distributeError}
        </div>
          )}

          <div className="border rounded-xl border-black dark:border-neutral-600 p-3 bg-white dark:bg-neutral-900 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-2 p-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl md:text-3xl font-bold text-neutral-900 dark:text-white">
                    {poolData.name}
               </h1>
                 <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        pollingEnabledState ? "bg-green-500" : "bg-red-500"
                      } ${pollingEnabledState ? "animate-pulse" : ""}`}
                    ></div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {pollingEnabledState ? "Live Updates" : "Updates Paused"}
                   </span>
                 </div>
                 </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">
                  Prediction Pool
                </p>

                 <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Price: {priceFeedName || "N/A"}
                   </span>
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    |
                    </span>
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center space-x-1">
                    <span>Fees</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 cursor-pointer transition-colors" />
                  </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <div className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-2 rounded-xl shadow-lg text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">Creator Fee:</span>
                              <span>{poolData.creator_fee}%</span>
                </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Treasury Fee:</span>
                              <span>{poolData.treasury_fee}%</span>
              </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Mint Fee:</span>
                              <span>{poolData.mint_fee}%</span>
                </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Burn Fee:</span>
                              <span>{poolData.burn_fee}%</span>
                </div>
                </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <span>
                    Last rebalanced: {isFetchingRebalanceEvents ? 'Loading...' : (lastRebalanceTime ? lastRebalanceTime.toLocaleString() : 'Never')}
                   </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                        <RefreshCw
                          className={`w-3 h-3 cursor-pointer ${
                            isTransactionPending || isFetchingRebalanceEvents ? "animate-spin" : ""
                          }`}
                          onClick={() => {
                            handlePoll();
                            fetchLastRebalanceEvent();
                          }}
                        />
                  </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh data and rebalance time</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
                </div>
                </div>
              <div className="lg:min-w-[300px] mt-1 mr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <div className="bg-neutral-200 dark:bg-neutral-800 rounded-lg p-3 justify-center items-center flex flex-col">
                    <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Total Value Locked
                </div>
                    <div className="text-sm md:text-lg font-bold transition-all duration-300">
                      {formatValue(calculations.totalReserves)}
              </div>
                    <div className="w-full rounded-full h-2 my-2 flex overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className="h-2 transition-all duration-500 ease-in-out"
                        style={{
                          width: `${calculations.bullPercentage}%`,
                          backgroundColor: theme === "dark" ? "#111" : "#333",
                        }}
                      ></div>
                      <div
                        className="h-2 transition-all duration-500 ease-in-out"
                        style={{
                          width: `${calculations.bearPercentage}%`,
                          backgroundColor: theme === "dark" ? "gray-500" : "#fff",
                          borderLeft: theme === "dark" ? "1px solid #888" : "1px solid #ddd",
                        }}
                      ></div>
          </div>
                    <div className="flex justify-between w-full text-xs font-medium">
                      <span className={`text-black transition-colors duration-300 ${changes.bull_reserve ? "font-bold" : ""}`}>
                        {calculations.bullPercentage.toFixed(1)}% Bull
                      </span>
                      <span className={`text-gray-500 dark:text-white transition-colors duration-300 ${changes.bear_reserve ? "font-bold" : ""}`}>
                        {calculations.bearPercentage.toFixed(1)}% Bear
                  </span>
        </div>
              </div>
                  </div>
                      </div>
                        </div>
                        </div>
                        
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16 mt-3">
            <VaultSection
              isBull={true}
              poolData={poolData}
              userTokens={userBalances.bull_tokens}
              price={calculations.bullPrice}
              value={calculations.userBullValue}
              symbol={poolData.bull_token.fields.symbol}
              connected={isConnected}
              handlePoll={handlePoll}
              reserve={calculations.bullReserveNum}
              supply={calculations.bullSupplyNum}
              tokenAddress={poolData.bull_token.id}
            />

            <div className="lg:col-span-2">
              <div className="border rounded-xl border-black dark:border-neutral-600 bg-white dark:bg-neutral-900 shadow-sm">
                <div className="p-6">
                  <TradingViewWidget
                    assetId={asset.coinId}
                    theme={theme === "dark" ? "dark" : "light"}
                    heightPx={453}
                    showHeader={true}
                  />

                  <div className="mt-6 p-4 md:p-6 border rounded-xl border-black dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                    <h4 className="font-bold mb-3 text-sm md:text-lg text-neutral-900 dark:text-white">
                      Rebalance Pool
                    </h4>
                    <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 md:mb-6 leading-relaxed">
                      Fetch the current oracle price and move funds from the losing vault to the winning vault.
                    </p>
                    
                    {/* Token Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                      {/* Bull Token */}
                      <div className="space-y-2">
                        <h5 className="font-bold text-sm md:text-base text-green-600 dark:text-green-400">Bull Token (BULL)</h5>
                        <div className="text-xs md:text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Current price:</span>
                            <span className="font-medium text-right">{calculations.bullPrice.toFixed(4)} WETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Underlying asset:</span>
                            <span className="font-medium">BULL</span>
                        </div>
                      </div>
                    </div>

                      {/* Bear Token */}
                      <div className="space-y-2">
                        <h5 className="font-bold text-sm md:text-base text-red-600 dark:text-red-400">Bear Token (BEAR)</h5>
                        <div className="text-xs md:text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Current price:</span>
                            <span className="font-medium text-right">{calculations.bearPrice.toFixed(4)} WETH</span>
                        </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Underlying asset:</span>
                            <span className="font-medium">BEAR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Oracle Price Information */}
                    <div className="bg-white dark:bg-neutral-900 p-3 md:p-4 rounded-lg border border-black dark:border-neutral-600 mb-4 md:mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-bold text-xs md:text-sm text-neutral-900 dark:text-white">Oracle Price Information</h5>
                        <RefreshCw 
                          className="w-4 h-4 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-white" 
                          onClick={handlePoll}
                        />
                      </div>
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex justify-between items-center">
                          <span className="text-neutral-600 dark:text-neutral-400">Current price:</span>
                          <span className="font-medium text-right">
                            {oraclePriceData?.[0]?.result 
                              ? (Number(oraclePriceData[0].result) / 1e18).toFixed(4) 
                              : 'Loading...'
                            }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-neutral-600 dark:text-neutral-400">Previous price:</span>
                          <span className="font-medium text-right">
                            {oraclePriceData?.[1]?.result 
                              ? (Number(oraclePriceData[1].result) / 1e18).toFixed(4) 
                              : 'Loading...'
                            }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-neutral-600 dark:text-neutral-400">Price change:</span>
                          <span className={`font-medium text-right flex items-center gap-1 ${
                            oraclePriceData?.[0]?.result && oraclePriceData?.[1]?.result
                              ? (Number(oraclePriceData[0].result) > Number(oraclePriceData[1].result) 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400')
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {oraclePriceData?.[0]?.result && oraclePriceData?.[1]?.result ? (
                              <>
                                <span>{Number(oraclePriceData[0].result) > Number(oraclePriceData[1].result) ? '▲' : '▼'}</span>
                                {(((Number(oraclePriceData[0].result) - Number(oraclePriceData[1].result)) / Number(oraclePriceData[1].result)) * 100).toFixed(2)}%
                              </>
                            ) : (
                              'Loading...'
                            )}
                    </span>
                </div>
                </div>
                </div>
            
                    {/* Rebalance Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                <Button
                              className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold py-2 md:py-3 text-sm md:text-base transition-all duration-200 shadow-lg hover:shadow-xl"
                              onClick={handleDistribute}
                              disabled={
                                address !== pool?.vault_creator && address !== undefined ||
                                isDistributeLoading
                              }
                            >
                              {isDistributeLoading && (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              )}
                              Rebalance Pool
                </Button>
                </div>
                        </TooltipTrigger>
                        {address !== pool?.vault_creator && (
                          <TooltipContent>
                            <p className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 p-2 rounded-md text-xs md:text-sm">
                              This action can only be performed by the pool creator
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                </div>

                </div>
                </div>
            </div>
            
            <VaultSection
              isBull={false}
              poolData={poolData}
              userTokens={userBalances.bear_tokens}
              price={calculations.bearPrice}
              value={calculations.userBearValue}
              symbol={poolData.bear_token.fields.symbol}
              connected={isConnected}
              handlePoll={handlePoll}
              reserve={calculations.bearReserveNum}
              supply={calculations.bearSupplyNum}
              tokenAddress={poolData.bear_token.id}
            />
        </div>

          {/* Creator Tools Section - Full Width at Bottom */}
          {address === pool?.vault_creator && (
            <div className="w-full mt-8 p-6 border rounded-xl border-black dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
              <h4 className="font-bold mb-4 text-lg md:text-xl text-neutral-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-6 h-6" />
              Creator Tools
              </h4>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Update Oracle Address
                  </label>
                  <div className="flex gap-2 max-w-md">
                  <Input
                      placeholder="New oracle address"
                      className="flex-1"
                    value={newOracleAddress}
                    onChange={(e) => setNewOracleAddress(e.target.value)}
                  />
                <Button
                  onClick={handleUpdateOracle}
                      disabled={!newOracleAddress || isDistributeLoading}
                      className="bg-black dark:bg-white text-white dark:text-black"
                >
                      Update
                </Button>
              </div>
            </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-black dark:border-neutral-600">
                    <div className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Mint Fee</div>
                    <div className="font-bold text-sm md:text-lg text-neutral-900 dark:text-white">{poolData.mint_fee}%</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Charged when buying tokens</div>
          </div>
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-black dark:border-neutral-600">
                    <div className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Burn Fee</div>
                    <div className="font-bold text-sm md:text-lg text-neutral-900 dark:text-white">{poolData.burn_fee}%</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Charged when selling tokens</div>
      </div>
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-black dark:border-neutral-600">
                    <div className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Creator Fee</div>
                    <div className="font-bold text-sm md:text-lg text-neutral-900 dark:text-white">{poolData.creator_fee}%</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Paid to pool creator</div>
    </div>
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-black dark:border-neutral-600">
                    <div className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Treasury Fee</div>
                    <div className="font-bold text-sm md:text-lg text-neutral-900 dark:text-white">{poolData.treasury_fee}%</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Paid to treasury</div>
      </div>
    </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
                  <strong>Note:</strong> Fees are set during pool creation and cannot be changed. They are immutable for the lifetime of the pool.
    </div>
    </div>
      </div>
          )}
       </div>
    </div>
  );
}