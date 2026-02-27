"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Wallet,
  Play,
  User,
  X,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// shared style tokens
const ACTIVE_ICON = "text-[var(--nav-active)]";
const ACTIVE_LABEL = "text-[var(--nav-active)] font-semibold";
const INACTIVE_ICON = "text-[var(--nav-inactive)]";
const INACTIVE_LABEL = "text-[var(--nav-inactive)] font-medium";
const ACTIVE_BAR = "absolute top-0 left-2 right-2 h-[2px] bg-[var(--nav-active)] rounded-full";
const ICON_SIZE = 22;
const ICON_STROKE = 1.75;

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isUsePoolOpen, setIsUsePoolOpen] = useState(false);
  const [poolAddress, setPoolAddress] = useState("");

  const handleUsePoolClick = () => setIsUsePoolOpen(true);

  const handlePoolSubmit = () => {
    if (!poolAddress.trim()) {
      toast.error("Please enter a pool address.");
      return;
    }

    if (!isAddress(poolAddress)) {
      toast.error("Invalid pool address format.");
      return;
    }

    router.push(`/pool?id=${poolAddress}`);
    setIsUsePoolOpen(false);
    setPoolAddress("");
  };

  const navItems = [
    { href: "/explorePools", icon: Search, label: "Explore", isActive: pathname === "/explorePools" },
    { href: "/createPool", icon: Plus, label: "Create", isActive: pathname === "/createPool" },
    { href: "/portfolio", icon: User, label: "Portfolio", isActive: pathname === "/portfolio" },
  ];

  // Re-usable nav link tile
  const NavTile = ({ href, icon: Icon, label, isActive }: typeof navItems[0]) => (
    <Link
      href={href}
      className="relative flex flex-col items-center justify-center py-3.5 flex-1 transition-colors"
    >
      {isActive && <span className={ACTIVE_BAR} />}
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} className={cn("transition-colors", isActive ? ACTIVE_ICON : INACTIVE_ICON)} />
      <span className={cn("text-[11px] mt-1 transition-colors", isActive ? ACTIVE_LABEL : INACTIVE_LABEL)}>
        {label}
      </span>
    </Link>
  );

  // "Use" Button
  const UseButton = () => (
    <button
      onClick={handleUsePoolClick}
      className="relative flex flex-col items-center justify-center py-3.5 flex-1 transition-colors"
    >
      <Play size={ICON_SIZE} strokeWidth={ICON_STROKE} className={cn("transition-colors", INACTIVE_ICON)} />
      <span className={cn("text-[11px] mt-1 transition-colors", INACTIVE_LABEL)}>
        Use
      </span>
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-[900px]:block hidden">
      <div
        className="bg-[var(--nav-bg)] shadow-[0_-2px_8px_rgba(0,0,0,0.3)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch w-full max-w-md mx-auto">

          {/* Explore · Create */}
          {navItems.slice(0, 2).map((item) => (
            <NavTile key={item.href} {...item} />
          ))}

          {/* Wallet slot */}
          <div className="flex-[1.8] flex items-stretch">
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                const ready = mounted && authenticationStatus !== "loading";
                const connected = ready && account && chain;

                return (
                  <div
                    className="flex items-center justify-center w-full"
                    {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none", userSelect: "none" } })}
                  >
                    {/* Not connected */}
                    {!connected && (
                      <button
                        onClick={openConnectModal}
                        className="flex flex-col items-center justify-center py-3.5 w-full transition-colors"
                      >
                        <Wallet size={ICON_SIZE} strokeWidth={ICON_STROKE} className="text-[var(--nav-active)]" />
                        <span className="text-[11px] mt-1 text-[var(--nav-active)] font-semibold">
                          Connect
                        </span>
                      </button>
                    )}

                    {/* Wrong network */}
                    {connected && chain.unsupported && (
                      <button
                        onClick={openChainModal}
                        className="flex flex-col items-center justify-center py-3.5 w-full transition-colors"
                      >
                        <AlertTriangle size={ICON_SIZE} strokeWidth={ICON_STROKE} className="text-red-500" />
                        <span className="text-[11px] mt-1 text-red-500 font-semibold">
                          Wrong Net
                        </span>
                      </button>
                    )}

                    {/* Connected — unified capsule */}
                    {connected && !chain.unsupported && (
                      <div className="flex flex-col items-center justify-center py-2.5 px-1 w-full gap-1">

                        {/* Chain selector — top row */}
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-1 bg-white/[0.06] hover:bg-white/[0.1] rounded-full px-3 py-1 transition-colors"
                        >
                          <span className="text-[11px] font-medium text-[var(--nav-active)] max-w-[72px] truncate leading-none">
                            {chain.name}
                          </span>
                          <ChevronDown size={10} strokeWidth={2.5} className="text-[var(--nav-active)]/70 shrink-0" />
                        </button>

                        {/* Account — bottom row */}
                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-1 hover:bg-white/[0.06] rounded-full px-2 py-0.5 transition-colors"
                        >
                          <Wallet size={12} strokeWidth={1.75} className="text-white/35 shrink-0" />
                          <span className="text-[10px] font-medium text-white/45 truncate max-w-[60px] leading-none">
                            {account.displayName}
                          </span>
                        </button>

                      </div>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          {/* Portfolio · Use */}
          {navItems.slice(2).map((item) => (
            <NavTile key={item.href} {...item} />
          ))}
          <UseButton />

        </div>
      </div>

      {/* Use Pool modal */}
      {isUsePoolOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Use Pool</h3>
              <button
                onClick={() => setIsUsePoolOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pool Address
                </label>
                <input
                  type="text"
                  value={poolAddress}
                  onChange={(e) => setPoolAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsUsePoolOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-300 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePoolSubmit}
                  className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl transition-colors text-sm font-semibold"
                >
                  Go to Pool
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomNavigation;
