"use client";

import React from "react";
import { AlertTriangle, ChevronDown, Wallet } from "lucide-react";
import ConnectBtn from "@/components/ui/ConnectBtn";
import { getChainMeta } from "@/lib/chains";

export default function WalletSlot() {
  return (
    <div className="flex items-stretch justify-center w-full">
      <ConnectBtn
        renderTrigger={(p) => {
          const chainMeta = getChainMeta(p.chainId);
          const chainLabel =
            chainMeta?.shortName ?? chainMeta?.name ?? "Unknown";
          const connectedChainName = p.activeChainName ?? chainLabel;

          const isWrongNetwork =
            p.networkState === "CONNECTED_UNSUPPORTED" ||
            p.networkState === "CONNECTED_UNKNOWN";

          if (!p.isConnected) {
            return (
              <button
                type="button"
                onClick={p.openConnectModal}
                className="flex flex-col items-center justify-center py-3.5 w-full"
                aria-label="Connect wallet"
              >
                <Wallet
                  size={22}
                  strokeWidth={1.75}
                  className="text-[var(--nav-active)]"
                  aria-hidden="true"
                />
                <span className="text-[11px] mt-1 text-[var(--nav-active)] font-semibold">
                  {p.isConnecting ? "Connecting…" : "Connect"}
                </span>
              </button>
            );
          }

          if (isWrongNetwork) {
            return (
              <button
                type="button"
                onClick={() => p.openAccountModal("network")}
                className="flex flex-col items-center justify-center py-3.5 w-full transition-colors"
                aria-label="Wrong network. Open network switcher"
              >
                <AlertTriangle
                  size={22}
                  strokeWidth={1.75}
                  className="text-red-500"
                  aria-hidden="true"
                />
                <span className="text-[11px] mt-1 text-red-500 font-semibold">
                  Wrong Net
                </span>
              </button>
            );
          }

          return (
            <div className="flex flex-col items-center justify-center py-2.5 px-1 w-full gap-1">
              <button
                type="button"
                onClick={() => p.openAccountModal("network")}
                className="flex items-center gap-1 bg-white/[0.06] hover:bg-white/[0.1] rounded-full px-3 py-1 transition-colors"
                aria-label="Open network switcher"
              >
                <span className="text-[11px] font-medium text-[var(--nav-active)] max-w-[72px] truncate leading-none">
                  {connectedChainName}
                </span>
                <ChevronDown
                  size={10}
                  strokeWidth={2.5}
                  className="text-[var(--nav-active)]/70 shrink-0"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() => p.openAccountModal("account")}
                className="flex items-center gap-1 hover:bg-white/[0.06] rounded-full px-2 py-0.5 transition-colors"
                aria-label="Open wallet account"
              >
                <Wallet
                  size={12}
                  strokeWidth={1.75}
                  className="text-white/35 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium text-white/45 truncate max-w-[60px] leading-none">
                  {p.truncatedAddress}
                </span>
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
