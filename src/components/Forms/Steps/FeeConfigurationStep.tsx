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
import { Info, Percent } from "lucide-react";
import type { FormData } from "../FormData";

interface FeeConfigurationStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: { [key: string]: string };
  devFeePercent?: number;
}

const FeeConfigurationStep: React.FC<FeeConfigurationStepProps> = ({
  formData,
  updateFormData,
  errors,
  devFeePercent,
}) => {
  
  // Set default values if empty - only run once
  const hasSetDefaults = React.useRef(false);
  React.useEffect(() => {
    if (!hasSetDefaults.current) {
      const defaults = {
        mintFee: formData.mintFee || "3.0",
        burnFee: formData.burnFee || "3.0",
        creatorFee: formData.creatorFee || "2.0",
      };
      updateFormData(defaults);
      hasSetDefaults.current = true;
    }
  }, [formData.mintFee, formData.burnFee, formData.creatorFee, updateFormData]);

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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-black dark:text-white mb-2">
          Fee Configuration
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Configure fee structure for your pool
        </p>
      </div>

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
                  <Info className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
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
                  <Info className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
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
                  <Info className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
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
              Dev Fee
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Set by the protocol for every new pool. Your pool keeps this fee for good.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-black dark:text-white">
            {devFeePercent === undefined ? "Loading..." : `${devFeePercent}%`}
          </div>
          {errors.devFee && (
            <p className="text-red-500 text-sm">{errors.devFee}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeConfigurationStep;