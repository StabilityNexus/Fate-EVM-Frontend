"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {FormData} from "@/types/FormData";
import { Coins } from "lucide-react";

type FormErrors = Partial<Record<keyof FormData, string>>;
interface TokenConfigurationStepProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  errors: FormErrors;
}

const TokenConfigurationStep: React.FC<TokenConfigurationStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Token Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your bull and bear tokens
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bull Token */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
            Bull Token
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bull Coin Name *
              </Label>
            </div>
            <Input
              type="text"
              placeholder="e.g. BullToken"
              value={formData.bullCoinName}
              onChange={(e) => updateFormData({ bullCoinName: e.target.value })}
              className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
                errors.bullCoinName ? "border-red-500" : ""
              }`}
            />
            {errors.bullCoinName && (
              <p className="text-red-500 text-sm">{errors.bullCoinName}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bull Coin Symbol *
              </Label>
            </div>
            <Input
              type="text"
              placeholder="e.g. BTCBULL"
              value={formData.bullCoinSymbol}
              onChange={(e) =>
                updateFormData({ bullCoinSymbol: e.target.value })
              }
              className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
                errors.bullCoinSymbol ? "border-red-500" : ""
              }`}
            />
            {errors.bullCoinSymbol && (
              <p className="text-red-500 text-sm">{errors.bullCoinSymbol}</p>
            )}
          </div>
        </div>

        {/* Bear Token */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Bear Token
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bear Coin Name *
              </Label>
            </div>
            <Input
              type="text"
              placeholder="e.g. BearToken"
              value={formData.bearCoinName}
              onChange={(e) => updateFormData({ bearCoinName: e.target.value })}
              className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
                errors.bearCoinName ? "border-red-500" : ""
              }`}
            />
            {errors.bearCoinName && (
              <p className="text-red-500 text-sm">{errors.bearCoinName}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bear Coin Symbol *
              </Label>
            </div>
            <Input
              type="text"
              placeholder="e.g. BTCBEAR"
              value={formData.bearCoinSymbol}
              onChange={(e) =>
                updateFormData({ bearCoinSymbol: e.target.value })
              }
              className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
                errors.bearCoinSymbol ? "border-red-500" : ""
              }`}
            />
            {errors.bearCoinSymbol && (
              <p className="text-red-500 text-sm">{errors.bearCoinSymbol}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenConfigurationStep;
