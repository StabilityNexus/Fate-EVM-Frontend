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
import { InfoIcon, Wallet } from "lucide-react";
import type { FormData } from "../FormData";
import { useAccount } from "wagmi";

type AddressConfigurationStepProps = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
};

const AddressConfigurationStep = ({
  formData,
  updateFormData,
}: AddressConfigurationStepProps) => {
  const { address } = useAccount();

  // Always use the connected wallet address as the default
  React.useEffect(() => {
    if (address) {
      updateFormData({ creatorAddress: address });
    }
  }, [address, updateFormData]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Address Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Fee recipient address (uses your connected wallet)
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Wallet Address
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    This is your currently connected wallet address that will receive fees.
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
            className="transition-all bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-black dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Note: Fees will be sent to this address. Connect a different wallet to change.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddressConfigurationStep;