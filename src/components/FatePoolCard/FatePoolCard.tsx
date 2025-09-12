import React from "react";
import { ArrowRight, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { RangeSlider } from "./RangeSlider";
// import { isAddress } from "viem";

interface PredictionCardProps {
  name: string;
  baseToken?: string;
  creator?: string;
  priceFeed?: string;
  bullCoinName: string;
  bullCoinSymbol: string;
  bearCoinName: string;
  bearCoinSymbol: string;
  bullPercentage: number;
  bearPercentage: number;
  fees?: {
    mint: number;
    burn: number;
    creator: number;
    treasury: number;
  };
  chainName?: string;
  onUse?: () => void;
}

export function PredictionCard({
  name,
  creator,
  priceFeed,
  bullCoinName,
  bullCoinSymbol,
  bearCoinName,
  bearCoinSymbol,
  bullPercentage,
  bearPercentage,
  fees,
  onUse,
}: PredictionCardProps) {
  return (
    <div className="group relative w-full max-w-sm bg-white dark:bg-black rounded-3xl  shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-gray-100/30 dark:from-gray-800/30 dark:via-transparent dark:to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header */}
      <div className="relative px-6 pt-8 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-1">
              {name}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Activity size={12} />
            <span>{priceFeed || 'Price Feed'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-6 pb-6 space-y-6">
        
        {/* Market Distribution */}
        <div className="space-y-4">

          {/* Bull Position */}
         <div className="flex justify-between items-center group/bull py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-300 dark:bg-gray-800/50 dark:hover:bg-gray-700 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                <TrendingUp size={14} className="text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {bullCoinSymbol}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {bullCoinName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {bullPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Bear Position */}
          <div className="flex justify-between items-center group/bear py-2 px-3 rounded-xl bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-250/50 dark:hover:bg-gray-800/80 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 dark:bg-gray-200 rounded-full shadow-sm border border-gray-300 dark:border-gray-600">
                <TrendingDown size={14} className="text-gray-100 dark:text-gray-800" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {bearCoinSymbol} 
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {bearCoinName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {bearPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Market Position Slider */}
        <div className="space-y-3">
          <RangeSlider 
            value={bullPercentage} 
            onChange={() => {}} // Read-only for display
            min={0}
            max={100}
            step={0.1}
            disabled={true}
          />
        </div>

        {/* Fee Structure */}
        {fees && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fees</h4>
            <div className="flex gap-2 text-xs">
              <div className="flex-1 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium text-gray-900 dark:text-white">{fees.mint}%</div>
                <div className="text-gray-500 dark:text-gray-400">Mint</div>
              </div>
              <div className="flex-1 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium text-gray-900 dark:text-white">{fees.burn}%</div>
                <div className="text-gray-500 dark:text-gray-400">Burn</div>
              </div>
              <div className="flex-1 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium text-gray-900 dark:text-white">{fees.creator}%</div>
                <div className="text-gray-500 dark:text-gray-400">Creator</div>
              </div>
              <div className="flex-1 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium text-gray-900 dark:text-white">{fees.treasury}%</div>
                <div className="text-gray-500 dark:text-gray-400">Treasury</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            // Validate that onUse function exists before calling
            if (onUse) {
              onUse();
            }
          }}
          className="w-full relative group/button py-4 px-6 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-semibold 
          flex items-center justify-center gap-3 transition-all duration-300
          hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg hover:shadow-black/25 dark:hover:shadow-white/25
          active:scale-[0.98] border border-black dark:border-white
          before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
        >
          <span className="relative z-10">Enter Prediction Pool</span>
          <ArrowRight size={20} className="relative z-10 group-hover/button:translate-x-1 transition-transform duration-300" />
        </button>
      </div>

      {/* Footer */}
      <div className="relative px-6 py-4 border-t border-gray-100 dark:border-black-800 bg-gray-50/30 dark:bg-black">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {creator ? `Created by ${creator.slice(0, 6)}...${creator.slice(-4)}` : 'Decentralized Pool'}
          </span>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}