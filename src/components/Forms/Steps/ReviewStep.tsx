"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { FormData } from "../FormData";
interface ReviewStepProps {
  formData: FormData;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  isSubmitting: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Review & Submit
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review your configuration before creating the pool
        </p>
      </div>

      <div className="space-y-6">
        {/* Pool Configuration Review */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Pool Configuration
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Pool Name:
              </span>
              <span className="font-medium text-black dark:text-white">
                {formData.poolName || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Base Token Address:
              </span>
              <span className="font-medium text-black dark:text-white break-all">
                {formData.baseTokenAddress || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Price Feed ID:
              </span>
              <span className="font-medium text-black dark:text-white break-all">
                {formData.assetId || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Token Configuration Review */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Token Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                Bull Token
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Name:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bullCoinName || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Symbol:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bullCoinSymbol || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                Bear Token
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Name:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bearCoinName || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Symbol:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bearCoinSymbol || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Configuration Review */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Address Configuration
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Fee Recipient:
              </span>
              <span className="font-medium text-black dark:text-white break-all">
                {formData.creatorAddress || "Will use connected wallet"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Oracle Address:
              </span>
              <span className="font-medium text-black dark:text-white break-all">
                {formData.oracleAddress || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Fee Configuration Review */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Fee Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Vault Fee:
              </span>
              <span className="font-medium text-black dark:text-white">
                {formData.vaultFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Creator Fee:
              </span>
              <span className="font-medium text-black dark:text-white">
                {formData.vaultCreatorFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Treasury Fee:
              </span>
              <span className="font-medium text-black dark:text-white">
                {formData.treasuryFee || "0"}%
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full mt-6 text-lg h-12 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
        >
          {isSubmitting ? "Creating Pool..." : "Create Fate Pool"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;