'use client';
import { useState, useEffect, useCallback } from 'react';
import { Coins } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { PredictionPoolABI } from '@/utils/abi/PredictionPool';
import { CoinABI } from '@/utils/abi/Coin';
import { ERC20ABI } from '@/utils/abi/ERC20';
import { toast } from 'sonner';
import { getCurrentPrice, updatePriceAndDistribute } from '@/lib/prices';
import { useSearchParams } from 'next/navigation';

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
  priceBuy?: number;
  priceSell?: number;
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

export default function InteractionClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const poolId = Array.isArray(id) ? id[0] : id || '';
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [bullAmount, setBullAmount] = useState<string>('');
  const [bearAmount, setBearAmount] = useState<string>('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

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
      ] = await Promise.all([
        poolContract.baseToken().catch(() => ""),
        poolContract.bullCoin().catch(() => ""),
        poolContract.bearCoin().catch(() => ""),
        poolContract.previousPrice().catch(() => BigInt(0)),
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

  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (!walletClient || !poolId) return;
      
      try {
        setLoadingPrice(true);
        const price = await getCurrentPrice(walletClient, poolId);
        
        // Store the current price as previous before updating
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
  }, [walletClient, poolId, currentPrice]);

  const handleBuy = async (token: Token, amount: string) => {
    if (!walletClient || !isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(token.id, CoinABI, signer);
      const amountWei = ethers.parseUnits(amount, 18);

      const baseTokenContract = new ethers.Contract(token.asset, ERC20ABI, signer);
      const allowance = await baseTokenContract.allowance(address, token.id);

      if (allowance < amountWei) {
        const approveTx = await baseTokenContract.approve(token.id, amountWei);
        await toast.promise(approveTx.wait(), {
          loading: "Approving tokens...",
          success: "Approval successful!",
          error: "Approval failed",
        });
      }

      const tx = await tokenContract.buy(address, amountWei);
      toast.promise(tx.wait(), {
        loading: "Processing transaction...",
        success: () => {
          setTimeout(() => fetchPool(), 3000);
          return "Tokens purchased successfully!";
        },
        error: (err) => err.reason || "Transaction failed",
      });
    } catch (err: unknown) {
      console.error("Buy error:", err);
      toast.error( (err as Error).message || "Failed to buy tokens");
    }
  };

  const handleSell = async (token: Token, amount: string) => {
    if (!walletClient || !isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(token.id, CoinABI, signer);
      const amountWei = ethers.parseUnits(amount, 18);
      
      const allowance = await tokenContract.allowance(address, token.id);
      
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(token.id, amountWei);
        await toast.promise(approveTx.wait(), {
          loading: 'Approving tokens...',
          success: 'Approval successful!',
          error: 'Approval failed'
        });
      }
      
      const tx = await tokenContract.sell(amountWei);
      toast.promise(tx.wait(), {
        loading: 'Processing transaction...',
        success: () => {
          setTimeout(() => fetchPool(), 3000);
          return 'Tokens sold successfully!';
        },
        error: (err) => err.reason || 'Transaction failed'
      });
    } catch (err: unknown) {
      console.error('Sell error:', err);
      toast.error( (err as Error).message || 'Failed to sell tokens');
    }
  };

  const handleUpdatePrice = async () => {
    if (!walletClient || !isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setUpdatingPrice(true);

      // Check if prediction pool is initialized before calling updatePriceAndDistribute
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const poolContract = new ethers.Contract(poolId, PredictionPoolABI, signer);
      const isInitialized = await poolContract.isInitialized();
      if (!isInitialized) {
        throw new Error("Prediction pool not initialized yet");
      }

      // Store current price as previous before updating
      if (currentPrice !== null) {
        setPreviousPrice(currentPrice);
      }

      toast.promise(
        updatePriceAndDistribute(walletClient, poolId).then(async (receipt) => {
          // After tx confirmation, refresh current price
          try {
            const newPrice = await getCurrentPrice(walletClient, poolId);
            setCurrentPrice(newPrice);
            return newPrice;
          } catch (err) {
            console.error("Failed to refresh price:", err);
            return null;
          }
        }),
        {
          loading: 'Updating price and distributing outcome...',
          success: (newPrice: unknown) => {
            return newPrice
              ? `Price updated to $${(newPrice as number).toFixed(4)}`
              : 'Price updated (refresh to see new value)';
          },
          error: (err) => {
            if ((err as any).data) {
              switch ((err as any).data) {
                case '0x14aebe68':
                  return "Invalid price data";
                case '0x92e98407':
                  return "Stale price data";
                case '0x5b34b966':
                  return "Insufficient fee";
                default:
                  return (err as any).reason || "Update failed";
              }
            }
            return (err as any).reason || (err as any).message || "Update failed";
          }
        }
      );

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
            onClick={() => fetchPool()} 
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
            onClick={() => fetchPool()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { bullToken, bearToken, bullPercentage, bearPercentage, baseToken } = pool;
  const bullBalance = bullToken.balance || BigInt(0);
  const bearBalance = bearToken.balance || BigInt(0);
  const bullPrice = bullToken.price || 0;
  const bearPrice = bearToken.price || 0;
  
  const bullValue = bullPrice * Number(ethers.formatUnits(bullBalance, 18));
  const bearValue = bearPrice * Number(ethers.formatUnits(bearBalance, 18));
  const totalValue = bullValue + bearValue;

  return (
    <div className="w-full pt-14 bg-white dark:bg-black">
      <div className="w-full md:px-24 lg:px-24">
        <div className="container mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center border-b dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Coins className="h-8 w-8 text-black dark:text-white" />
            <h1 className="text-3xl font-bold dark:text-white">
              { `${bullToken.name} / ${bearToken.name} Vault`}
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 p-3 rounded-md text-center border dark:border-gray-700">
              <div className="font-bold dark:text-white">{bullToken.name} Balance</div>
              <div className="font-mono dark:text-white">
                {ethers.formatUnits(bullBalance, 18)} {bullToken.symbol}
                <div className="text-sm dark:text-gray-400">
                  ${bullValue.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-md text-center border dark:border-gray-700">
              <div className="font-bold dark:text-white">{bearToken.name} Balance</div>
              <div className="font-mono dark:text-white">
                {ethers.formatUnits(bearBalance, 18)} {bearToken.symbol}
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
                    <span className="text-xs dark:text-gray-400 block">Supply: {ethers.formatUnits(bullToken.supply, 18)}</span>
                  </p>
                  <p className="dark:text-white">
                    <span className="font-bold">{bearToken.symbol}:</span> ${bearPrice.toFixed(4)}
                    <span className="text-xs dark:text-gray-400 block">Supply: {ethers.formatUnits(bearToken.supply, 18)}</span>
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
              />
              
              <TokenActionPanel
                token={bearToken}
                amount={bearAmount}
                setAmount={setBearAmount}
                onBuy={() => handleBuy(bearToken, bearAmount)}
                onSell={() => handleSell(bearToken, bearAmount)}
                color="red"
                label="Bear"
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
                    const price = await getCurrentPrice(walletClient!, poolId);
                    setCurrentPrice(price);
                    toast.success(`Current price: $${price.toFixed(4)}`);
                  } catch (err) {
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
                    <code className="text-sm break-all">{baseToken}</code>
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
}: {
  token: Token;
  amount: string;
  setAmount: (value: string) => void;
  onBuy: () => void;
  onSell: () => void;
  color: 'red' | 'green';
  label: string;
}) {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  const tokenBalance = token.balance || BigInt(0);
  const tokenPrice = token.price || 0;

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
          />
          <span className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">{token.symbol}</span>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={onBuy}
          className={`flex-1 py-3 ${colorClasses[color]} text-white rounded-lg transition-colors`}
          disabled={!amount || isNaN(Number(amount))}
        >
          Buy {label}
        </button>
        <button
          onClick={onSell}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
          disabled={!amount || isNaN(Number(amount))}
        >
          Sell {label}
        </button>
      </div>
      
      <div className="mt-3 text-sm dark:text-gray-400">
        <p>Price: ${tokenPrice.toFixed(4)}</p>
        <p>Available: {ethers.formatUnits(tokenBalance, 18)} {token.symbol}</p>
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