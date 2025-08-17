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
import { InfoIcon, Coins } from "lucide-react";
import type { FormData } from "../FormData";

interface PoolConfigurationStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: { [key: string]: string };
  priceFeeds: { id: string; name: string }[];
}

const PoolConfigurationStep: React.FC<PoolConfigurationStepProps> = ({
  formData,
  updateFormData,
  errors,
  priceFeeds,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Pool Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure basic pool settings
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
                    The contract address of the token being predicted (must be a valid Ethereum address)
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

        {/* Oracle Address (readonly) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Oracle Address
          </Label>
          <Input
            type="text"
            value={formData.oracleAddress}
            readOnly
            className="transition-all bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-black dark:text-white"
          />
        </div>

        {/* Asset ID (Price Feed) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Price Feed *
          </Label>
          <select
            value={formData.assetId || ""}
            onChange={(e) => updateFormData({ assetId: e.target.value })}
            className={`w-full px-3 py-2 border ${
              errors.assetId ? "border-red-500" : "border-gray-200 dark:border-gray-700"
            } text-black dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
          >
            <option value="" disabled>
              Select a Price Feed
            </option>
            {priceFeeds.map((feed) => (
              <option key={feed.id} value={feed.id}>
                {feed.name}
              </option>
            ))}
          </select>
          {errors.assetId && (
            <p className="text-red-500 text-sm">{errors.assetId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolConfigurationStep;