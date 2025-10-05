"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { FormData } from "../FormData";
import { useAccount } from "wagmi";

interface ReviewStepProps {
  formData: FormData;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const { address } = useAccount();

  const totalFees = (
    parseFloat(formData.mintFee || "0") +
    parseFloat(formData.burnFee || "0") +
    parseFloat(formData.creatorFee || "0") +
    parseFloat(formData.treasuryFee || "0")
  ).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-black dark:text-white mb-2">
          Review & Submit
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
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
              <span className="text-gray-600 dark:text-gray-400">Pool Name:</span>
              <span className="font-medium text-black dark:text-white">
                {formData.poolName || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Base Token Address:</span>
              <span className="font-medium text-black dark:text-white break-all">
                {formData.baseTokenAddress || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Oracle Type:</span>
              <span className="font-medium text-black dark:text-white capitalize">
                {formData.oracleType || "Not specified"}
              </span>
            </div>
            {formData.oracleType === 'chainlink' ? (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Chainlink Price Feed:</span>
                <span className="font-medium text-black dark:text-white break-all">
                  {formData.priceFeedAddress || "Not specified"}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Hebeswap Pair Address:</span>
                  <span className="font-medium text-black dark:text-white break-all">
                    {formData.hebeswapPairAddress || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Quote Token Address:</span>
                  <span className="font-medium text-black dark:text-white break-all">
                    {formData.hebeswapQuoteToken || "Not specified"}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pool Creator:</span>
              <span className="font-medium text-black dark:text-white break-all">
                {address || "Not specified"}
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
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Bull Token</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bullCoinName || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Symbol:</span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bullCoinSymbol || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Bear Token</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bearCoinName || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Symbol:</span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bearCoinSymbol || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Configuration Review */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Fee Configuration
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Mint Fee:</span>
              <span className="font-medium text-black dark:text-white">
                {formData.mintFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Burn Fee:</span>
              <span className="font-medium text-black dark:text-white">
                {formData.burnFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Creator Fee:</span>
              <span className="font-medium text-black dark:text-white">
                {formData.creatorFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Treasury Fee:</span>
              <span className="font-medium text-black dark:text-white">
                {formData.treasuryFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">Total Fees:</span>
              <span className="font-bold text-black dark:text-white">{totalFees}%</span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className={`
              px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-medium text-sm md:text-base
              transition-all duration-300 ease-in-out
              bg-gray-300 text-gray-800 hover:bg-gray-200
              dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
              border border-transparent shadow-sm hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            Back
          </button>

          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault();
              console.log("Review step submit button clicked");

              onSubmit({
                preventDefault: () => {},
              } as React.FormEvent<HTMLFormElement>);
            }}
            className="px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold text-sm md:text-base
                      transition-all duration-300 ease-in-out 
                      bg-neutral-900 text-white hover:bg-neutral-700
                      dark:bg-neutral-100 dark:text-black dark:hover:bg-neutral-200 
                      shadow-sm hover:shadow-md
                      border border-transparent dark:border-neutral-300
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Pool...
              </div>
            ) : (
              "Create Fate Pool"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
