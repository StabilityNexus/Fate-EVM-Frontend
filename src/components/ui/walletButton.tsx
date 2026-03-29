'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (address?: string) => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy wallet address:', error);
    }
  };

  return (
    <div className="flex justify-end items-center">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          if (!connected) {
            return (
              <button
                onClick={openConnectModal}
                type="button"
                className="px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition"
              >
                Connect Wallet
              </button>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={openChainModal}
                type="button"
                className="px-3 py-1 rounded-full bg-[#f0f1f4] dark:bg-[#1a1b1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#2a2b30] transition"
              >
                {chain.name}
              </button>

              <button
                onClick={openAccountModal}
                type="button"
                className="px-3 py-1 rounded-full bg-[#f0f1f4] dark:bg-[#1a1b1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#2a2b30] transition"
              >
                {account.displayName}
              </button>

              <button
                onClick={() => handleCopy(account.address)}
                type="button"
                className="px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition"
                title="Copy wallet address"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}