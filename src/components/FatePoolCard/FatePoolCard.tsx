import React from "react";
import { ArrowRight, TrendingUp, TrendingDown, Info, Zap } from "lucide-react";
import { RangeSlider } from "./RangeSlider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  chainName,
  onUse,
}: PredictionCardProps) {
  const totalFee = fees
    ? (fees.mint + fees.burn + fees.creator + fees.treasury).toFixed(2)
    : "0.00";

  const isBullDominant = bullPercentage >= bearPercentage;
  const isBearDominant = bearPercentage > bullPercentage;

  return (
    <div className="group relative w-full h-full flex flex-col justify-between max-w-sm bg-white dark:bg-zinc-950 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">

      {/* Glossy gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 will-change-opacity" />

      {/* Header Section */}
      <div className="relative px-6 pt-6 pb-2 z-20">
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 mb-2">
            {chainName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-800">
                {chainName}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
              {priceFeed || 'Price Feed'}
            </span>
          </div>
          {/* Active Pulse */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Live</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
          {name}
        </h2>
      </div>

      {/* Main Content - Prediction Stats */}
      <div className="relative px-4 py-4 space-y-4 flex-grow z-20">

        {/* Bull vs Bear Visuals */}
        <div className="grid grid-cols-2 gap-3">
          {/* Bull Side */}
          <div className={`relative p-3 rounded-2xl border transition-all duration-300 ${isBullDominant
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 shadow-sm'
            : 'bg-gray-50 dark:bg-zinc-900/50 border-transparent opacity-80'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${isBullDominant ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>
                <TrendingUp size={14} strokeWidth={3} />
              </div>
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide">Bull</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${isBullDominant ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                {bullPercentage.toFixed(1)}%
              </span>
              <span className="text-[10px] font-medium text-gray-400 truncate mt-1">
                {bullCoinSymbol}
              </span>
            </div>
          </div>

          {/* Bear Side */}
          <div className={`relative p-3 rounded-2xl border transition-all duration-300 ${isBearDominant
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 shadow-sm'
            : 'bg-gray-50 dark:bg-zinc-900/50 border-transparent opacity-80'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${isBearDominant ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>
                <TrendingDown size={14} strokeWidth={3} />
              </div>
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide">Bear</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${isBearDominant ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                {bearPercentage.toFixed(1)}%
              </span>
              <span className="text-[10px] font-medium text-gray-400 truncate mt-1">
                {bearCoinSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* Sentiment Bar */}
        <div className="relative pt-2">
          <RangeSlider
            value={bullPercentage}
            onChange={() => { }}
            min={0}
            max={100}
            step={0.1}
            disabled={true}
          />
        </div>

        {/* Fees Section */}
        <div className="flex items-center justify-between px-2 pt-1 border-t border-gray-100 dark:border-zinc-800/50 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Zap size={12} className="text-amber-500" fill="currentColor" />
            <span className="font-medium">Total Fees</span>
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help group/fee">
                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover/fee:text-indigo-500 transition-colors">
                    {totalFee}%
                  </span>
                  <Info size={12} className="text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-3 shadow-xl rounded-xl">
                <div className="space-y-2 min-w-[140px]">
                  <p className="text-xs font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-1 mb-1">Fee Breakdown</p>
                  {fees ? (
                    <>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Mint</span> <span>{fees.mint}%</span></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Burn</span> <span>{fees.burn}%</span></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Creator</span> <span>{fees.creator}%</span></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Treasury</span> <span>{fees.treasury}%</span></div>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">No fee data available</span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Action Area */}
      <div className="p-4 z-20">
        <button
          onClick={() => {
            if (onUse) onUse();
          }}
          className="w-full relative group/btn overflow-hidden rounded-2xl bg-gray-900 dark:bg-white p-4 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20 dark:hover:shadow-white/20 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="relative flex items-center justify-center gap-2 text-white dark:text-black font-bold">
            <span className="uppercase tracking-wide text-sm">Place Prediction</span>
            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
          </div>
        </button>
      </div>

    </div>
  );
}