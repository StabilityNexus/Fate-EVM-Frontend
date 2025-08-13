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
import { InfoIcon, Percent } from "lucide-react";
import type { FormData } from "../FormData";

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
  // Set default values if empty
  React.useEffect(() => {
    const defaults = {
      vaultFee: formData.vaultFee || "3.0",
      vaultCreatorFee: formData.vaultCreatorFee || "2.0",
      treasuryFee: formData.treasuryFee || "0.5"
    };
    updateFormData(defaults);
  }, []);

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    const value = e.target.value;
    // Ensure value is a valid number between 0-100
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      updateFormData({ [field]: value });
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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Vault Fee *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    Percentage fee charged by the vault on transactions (0-100%)
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
            value={formData.vaultFee}
            onChange={(e) => handleFeeChange(e, 'vaultFee')}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.vaultFee ? "border-red-500" : ""
            }`}
          />
          {errors.vaultFee && (
            <p className="text-red-500 text-sm">{errors.vaultFee}</p>
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
            value={formData.vaultCreatorFee}
            onChange={(e) => handleFeeChange(e, 'vaultCreatorFee')}
            className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
              errors.vaultCreatorFee ? "border-red-500" : ""
            }`}
          />
          {errors.vaultCreatorFee && (
            <p className="text-red-500 text-sm">{errors.vaultCreatorFee}</p>
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