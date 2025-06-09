import React from "react";
import { RangeSlider } from "./RangeSlider";
import { ArrowRight } from "lucide-react";

interface PredictionCardProps {
  name: string;
  bullCoinName: string;
  bullCoinSymbol: string;
  bearCoinName: string;
  bearCoinSymbol: string;
  bullPercentage: number;
  bearPercentage: number;
  volume?: string;
  participants?: number;
  onUse?: () => void;
}

export function PredictionCard({
  name,
  bullCoinName,
  bullCoinSymbol,
  bearCoinName,
  bearCoinSymbol,
  bullPercentage,
  bearPercentage,
  onUse,
}: PredictionCardProps) {
  return (
    <div className="w-full max-w-sm bg-white hover:scale-[1.02] dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Title Section */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-800 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
          <p className="text-gray-200 text-sm">
            {bullCoinName}/{bearCoinName} ({bullCoinSymbol}/{bearCoinSymbol})
          </p>
        </div>
      </div>


      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {bullCoinSymbol} Bulls
              </span>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-400">
              {bullPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {bearCoinSymbol} Bears
              </span>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-400">
              {bearPercentage.toFixed(1)}%
            </span>
          </div>

          <RangeSlider value={bullPercentage} onChange={() => { }} />
        </div>

        <button
          onClick={onUse}
          className="w-full py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium 
                   flex items-center justify-center gap-2 transform transition-all duration-300
                   hover:from-gray-700 hover:to-gray-800 hover:shadow-lg hover:-translate-y-0.5
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Enter Pool
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            {/* <p className="text-sm text-gray-500 dark:text-gray-400">
              Min Stake
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              0.1 ETH
            </p> */}
          </div>
          <div className="text-center">
            {/* <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Staked
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              24.5 ETH
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}
