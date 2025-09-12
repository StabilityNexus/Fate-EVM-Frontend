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
import { InfoIcon, Percent, Coins } from "lucide-react";
import type { FormData } from "../FormData";
import { useChainId } from "wagmi";
import { HEBESWAP_PAIRS } from "@/utils/hebeswapConfig";

interface FeeConfigurationStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: { [key: string]: string };
}

const FeeConfigurationStep: React.FC<FeeConfigurationStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const chainId = useChainId();
  
  // Set default values if empty - only run once
  const hasSetDefaults = React.useRef(false);
  React.useEffect(() => {
    if (!hasSetDefaults.current) {
      const defaults = {
        mintFee: formData.mintFee || "3.0",
        burnFee: formData.burnFee || "3.0",
        creatorFee: formData.creatorFee || "2.0",
        treasuryFee: formData.treasuryFee || "0.5"
      };
      updateFormData(defaults);
      hasSetDefaults.current = true;
    }
  }, [formData.mintFee, formData.burnFee, formData.creatorFee, formData.treasuryFee, updateFormData]);

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    const value = e.target.value.trim();
    if (value === "") {
      updateFormData({ [field]: value } as Partial<FormData>);
      return;
    }
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0 && n <= 100) {
      updateFormData({ [field]: value } as Partial<FormData>);
    }
  };

  const handleHebeswapPairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPair = HEBESWAP_PAIRS.find(pair => pair.pairAddress === e.target.value);
    if (selectedPair) {
      updateFormData({
        hebeswapPairAddress: selectedPair.pairAddress,
        hebeswapQuoteToken: selectedPair.quoteToken
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Fee Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure fee structure for your pool
        </p>
      </div>

      {/* Hebeswap Pair Selection (only for Ethereum Classic) */}
      {chainId === 61 && formData.oracleType === 'hebeswap' && (
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
                    Select a Hebeswap trading pair for price feeds on Ethereum Classic
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <select
            value={formData.hebeswapPairAddress}
            onChange={handleHebeswapPairChange}
            className={`w-full px-3 py-2.5 border rounded-md transition-all duration-200 cursor-pointer ${
              errors.hebeswapPairAddress 
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black dark:focus:ring-white"
            } text-black dark:text-white bg-white dark:bg-gray-800 focus:outline-none`}
          >
            <option value="" disabled className="text-gray-500">
              Select a Hebeswap Pair
            </option>
            {HEBESWAP_PAIRS.map((pair) => (
              <option 
                key={pair.pairAddress} 
                value={pair.pairAddress}
                className="text-black dark:text-white bg-white dark:bg-gray-800"
              >
                {pair.description}
              </option>
            ))}
          </select>
          {errors.hebeswapPairAddress && (
            <p className="text-red-500 text-sm">{errors.hebeswapPairAddress}</p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Mint Fee *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Percentage fee charged when minting tokens (0-100%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            placeholder="3.0"
            step="0.01"
            min="0"
            max="100"
            value={formData.mintFee}
            onChange={(e) => handleFeeChange(e, 'mintFee')}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.mintFee ? "border-red-500" : ""
            }`}
          />
          {errors.mintFee && (
            <p className="text-red-500 text-sm">{errors.mintFee}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Burn Fee *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Percentage fee charged when burning tokens (0-100%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            placeholder="3.0"
            step="0.01"
            min="0"
            max="100"
            value={formData.burnFee}
            onChange={(e) => handleFeeChange(e, 'burnFee')}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.burnFee ? "border-red-500" : ""
            }`}
          />
          {errors.burnFee && (
            <p className="text-red-500 text-sm">{errors.burnFee}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Creator Fee *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Percentage fee that goes to the pool creator (0-100%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            placeholder="2.0"
            step="0.01"
            min="0"
            max="100"
            value={formData.creatorFee}
            onChange={(e) => handleFeeChange(e, 'creatorFee')}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.creatorFee ? "border-red-500" : ""
            }`}
          />
          {errors.creatorFee && (
            <p className="text-red-500 text-sm">{errors.creatorFee}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Treasury Fee *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Percentage fee that goes to the protocol treasury (0-100%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            placeholder="0.5"
            step="0.01"
            min="0"
            max="100"
            value={formData.treasuryFee}
            onChange={(e) => handleFeeChange(e, 'treasuryFee')}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.treasuryFee ? "border-red-500" : ""
            }`}
          />
          {errors.treasuryFee && (
            <p className="text-red-500 text-sm">{errors.treasuryFee}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeConfigurationStep;