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
import type { FormData } from "../FormData";
import { useAccount } from "wagmi";

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

  React.useEffect(() => {
    if (address && address !== formData.creatorAddress) {
      updateFormData({ creatorAddress: address });
    }
  }, [address, formData.creatorAddress, updateFormData]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Pool Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          General settings for your new prediction pool
        </p>
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

        {/* Chainlink Price Feed Dropdown */}
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
                  <p className="w-64 text-sm">
                    Select the Chainlink price feed for the asset you want to create predictions for
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <select
            value={formData.priceFeedAddress}
            onChange={(e) => updateFormData({ priceFeedAddress: e.target.value })}
            className={`w-full px-3 py-2.5 border rounded-md transition-all duration-200 cursor-pointer ${
              errors.priceFeedAddress 
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black dark:focus:ring-white"
            } text-black dark:text-white bg-white dark:bg-gray-800 focus:outline-none`}
          >
            <option value="" disabled className="text-gray-500">
              Select a Price Feed
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
      </div>
    </div>
  );
};

export default PoolConfigurationStep;