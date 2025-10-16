"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, Coins, Wallet } from "lucide-react";
import { logger } from "@/lib/logger";
import type { FormData } from "../FormData";
import { useAccount, useChainId } from "wagmi";
import { HEBESWAP_PAIRS } from "@/utils/hebeswapConfig";

interface PoolConfigurationStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: { [key: string]: string };
  priceFeedOptions: { address: string; name: string }[];
}

const PoolConfigurationStep: React.FC<PoolConfigurationStepProps> = ({
  formData,
  updateFormData,
  errors,
  priceFeedOptions,
}) => {
  const { address } = useAccount();
  const chainId = useChainId();

  React.useEffect(() => {
    if (address && address !== formData.creatorAddress) {
      updateFormData({ creatorAddress: address });
    }
  }, [address, formData.creatorAddress, updateFormData]);

  // Automatically set oracle type based on connected chain
  React.useEffect(() => {
    if (chainId === 61) {
      // Ethereum Classic - use Hebeswap
      updateFormData({ 
        oracleType: 'hebeswap',
        priceFeedAddress: '',
        hebeswapPairAddress: '',
        hebeswapQuoteToken: ''
      });
    } else {
      // All other chains - use Chainlink
      updateFormData({ 
        oracleType: 'chainlink',
        priceFeedAddress: '',
        hebeswapPairAddress: '',
        hebeswapQuoteToken: ''
      });
    }
  }, [chainId, updateFormData]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-black dark:text-white mb-2">
          Pool Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm md:text-base">
          General settings for your new prediction pool
        </p>
        
        {/* Chain Indicator 
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          chainId === 61
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            chainId === 61 ? 'bg-blue-500' : 'bg-green-500'
          }`}></div>
          Connected to: {chainId === 61 ? 'Ethereum Classic (ETC)' : 'Chain ID ' + chainId}
        </div>
        */}
      </div>
      <div className="space-y-4">
        {/* Pool Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pool Name *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Enter a unique and descriptive name for your Fate Pool
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="text"
            placeholder="e.g. FateBTC"
            value={formData.poolName}
            onChange={(e) => updateFormData({ poolName: e.target.value })}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.poolName ? "border-red-500" : ""
            }`}
          />
          {errors.poolName && (
            <p className="text-red-500 text-sm">{errors.poolName}</p>
          )}
        </div>

        {/* Base Token Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Base Token Address *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    The contract address of the token used for vault reserves (e.g., USDT, USDC)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="text"
            placeholder="0x123..."
            value={formData.baseTokenAddress}
            onChange={(e) => updateFormData({ baseTokenAddress: e.target.value })}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.baseTokenAddress ? "border-red-500" : ""
            }`}
          />
          {errors.baseTokenAddress && (
            <p className="text-red-500 text-sm">{errors.baseTokenAddress}</p>
          )}
        </div>

        {/* Creator Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Creator Address (Fee Recipient)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    This is your currently connected wallet address that will receive creator fees.
                    To change it, please connect a different wallet.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="text"
            value={address || "No wallet connected"}
            readOnly
            className="transition-all bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-black dark:text-white cursor-not-allowed"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Note: Creator fees will be sent to this address. Connect a different wallet to change.
          </p>
        </div>

        {/* Initial Deposit */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Initial Deposit (Optional)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Optional: Add an initial deposit of base tokens to the pool. This helps bootstrap liquidity and ensures the pool can function immediately. You can set this to 0 if you prefer to deposit later.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            placeholder="0"
            min="0"
            step="any"
            value={formData.initialDeposit}
            onChange={(e) => updateFormData({ initialDeposit: e.target.value })}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.initialDeposit ? "border-red-500" : ""
            }`}
          />
          {errors.initialDeposit && (
            <p className="text-red-500 text-sm">{errors.initialDeposit}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Amount in base token units. Set to 0 if you don&apos;t want to deposit now.
          </p>
        </div>

        {/* Oracle Type Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Oracle Type *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Oracle type is automatically selected based on your connected chain. Chainlink for most chains, Hebeswap for Ethereum Classic.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className={`p-3 border rounded-lg ${
            formData.oracleType === 'hebeswap' 
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' 
              : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected Oracle:
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.oracleType === 'hebeswap' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {formData.oracleType === 'hebeswap' ? 'Hebeswap' : 'Chainlink'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
              {formData.oracleType === 'hebeswap' 
                ? '🔵 Hebeswap is the native oracle system for ETC'
                : '🟢 Chainlink provides reliable price feeds across most networks'
              }
            </p>
            {formData.oracleType === 'hebeswap' && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Note: You can select from available Hebeswap trading pairs below.
              </p>
            )}
          </div>
        </div>

        {/* Oracle Configuration */}
        {formData.oracleType === 'chainlink' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Chainlink Price Feed *
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                    <p className="w-80 text-sm">
                      Smart Oracle Management: The system will automatically create an oracle adapter for this price feed if it doesn&apos;t exist, or use an existing one if available. This ensures efficient gas usage and prevents duplicate oracle deployments.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <select
              value={formData.priceFeedAddress}
              onChange={(e) => updateFormData({ priceFeedAddress: e.target.value })}
              className={`w-full px-3 py-2.5 border rounded-md transition-all duration-200 cursor-pointer text-sm md:text-base ${
                errors.priceFeedAddress 
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                  : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black dark:focus:ring-white"
              } text-black dark:text-white bg-white dark:bg-gray-800 focus:outline-none`}
            >
              <option value="" disabled className="text-gray-500">
                Select a price feed (oracle adapter will be created automatically)...
              </option>
              {priceFeedOptions.map((feed) => (
                <option 
                  key={feed.address} 
                  value={feed.address}
                  className="text-black dark:text-white bg-white dark:bg-gray-800"
                >
                  {feed.name}
                </option>
              ))}
            </select>
            {errors.priceFeedAddress && (
              <p className="text-red-500 text-sm">{errors.priceFeedAddress}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Hebeswap Trading Pair *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                      <p className="w-64 text-sm">
                        Select the Hebeswap trading pair you want to use for price feeds
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <select
                value={formData.hebeswapPairAddress}
                onChange={(e) => {
                  logger.debug('Hebeswap pair selection changed:', { value: e.target.value });
                  const selectedPair = HEBESWAP_PAIRS.find(pair => pair.pairAddress === e.target.value);
                  logger.debug('Selected pair:', { selectedPair });
                  if (selectedPair) {
                    logger.debug('Updating form data with:', {
                      hebeswapPairAddress: selectedPair.pairAddress,
                      hebeswapQuoteToken: selectedPair.quoteToken
                    });
                    updateFormData({ 
                      hebeswapPairAddress: selectedPair.pairAddress,
                      hebeswapQuoteToken: selectedPair.quoteToken
                    });
                  }
                }}
                className={`w-full px-3 py-2.5 border rounded-md transition-all duration-200 cursor-pointer text-sm md:text-base ${
                  errors.hebeswapPairAddress 
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                    : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                } text-black dark:text-white bg-white dark:bg-gray-800 focus:outline-none`}
              >
                <option value="" disabled className="text-gray-500">
                  Select a Trading Pair
                </option>
                {HEBESWAP_PAIRS.map((pair) => (
                  <option 
                    key={pair.pairAddress} 
                    value={pair.pairAddress}
                    className="text-black dark:text-white bg-white dark:bg-gray-800"
                  >
                    {pair.baseTokenSymbol}/{pair.quoteTokenSymbol} - {pair.description}
                  </option>
                ))}
              </select>
              {errors.hebeswapPairAddress && (
                <p className="text-red-500 text-sm">{errors.hebeswapPairAddress}</p>
              )}
            </div>

            {/* Display selected pair info */}
            {formData.hebeswapPairAddress && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p><strong>Selected Pair:</strong> {HEBESWAP_PAIRS.find(p => p.pairAddress === formData.hebeswapPairAddress)?.description}</p>
                  <p><strong>Pair Address:</strong> {formData.hebeswapPairAddress}</p>
                  <p><strong>Quote Token:</strong> {formData.hebeswapQuoteToken}</p>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Note: The quote token address is automatically set when you select a trading pair.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoolConfigurationStep;