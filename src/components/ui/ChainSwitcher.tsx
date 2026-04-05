import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ChainSwitcherProps = {
  chainId: number;
  networkState: string;
  chains: readonly { id: number; name: string }[];
  isSwitchPending: boolean;
  targetChainId: React.MutableRefObject<number | null>;
  handleSwitchChain: (cId: number) => void;
  buttonTap: HTMLMotionProps<'button'>['whileTap'];
};

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export function ChainSwitcher({
  chainId,
  networkState,
  chains,
  isSwitchPending,
  targetChainId,
  handleSwitchChain,
  buttonTap,
}: ChainSwitcherProps) {
  return (
    <>
      {(networkState === 'CONNECTED_UNSUPPORTED' || networkState === 'CONNECTED_UNKNOWN') && (
        <div className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-500/5 mb-4">
          <div className="flex flex-col">
             <span className="text-[14px] font-bold text-red-600 dark:text-red-400">
               {networkState === 'CONNECTED_UNSUPPORTED' ? 'Wrong Network' : 'Unknown Network'}
             </span>
             <span className="text-[12px] font-medium text-red-500 dark:text-red-500/70">Chain ID: {chainId}</span>
          </div>
          <AlertTriangleIcon className="w-5 h-5 text-red-500" />
        </div>
      )}

      {chains.map((chain) => {
        const isActive = chain.id === chainId;
        const isLoading = isSwitchPending && targetChainId.current === chain.id;
        const isOtherLoading = isSwitchPending && targetChainId.current !== chain.id;
        return (
          <motion.button
            layout
            key={chain.id}
            whileTap={!isActive && !isLoading ? buttonTap : {}}
            disabled={isActive || isLoading}
            onClick={() => handleSwitchChain(chain.id)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${isActive ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'} ${isOtherLoading ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                 <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80" />
              </div>
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{chain.name}</span>
            </div>
            {isActive && (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                Connected <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
            )}
            {isLoading && (
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent animate-spin rounded-full" />
            )}
          </motion.button>
        );
      })}
    </>
  );
}
