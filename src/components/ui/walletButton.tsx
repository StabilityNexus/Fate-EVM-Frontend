"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

const COPIED_FEEDBACK_DURATION = 2000;

export default function WalletButton() {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_DURATION);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <ConnectButton
        showBalance={false}
        accountStatus="address"
        chainStatus="icon"
        label="Connect Wallet"
      />

      {address && (
        <>
          <button
            type="button"
            onClick={() => void handleCopyAddress()}
            aria-label={copied ? "Wallet address copied" : "Copy wallet address"}
            title={copied ? "Copied!" : "Copy wallet address"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
          </button>

          {copied && (
            <span className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
              Copied!
            </span>
          )}
        </>
      )}
    </div>
  );
}
