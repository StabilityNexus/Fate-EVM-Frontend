"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Plus, Play, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isAddress } from "viem";
import WalletSlot from "@/components/layout/WalletSlot";

const ACTIVE_ICON = "text-[var(--nav-active)]";
const ACTIVE_LABEL = "text-[var(--nav-active)] font-semibold";
const INACTIVE_ICON = "text-[var(--nav-inactive)]";
const INACTIVE_LABEL = "text-[var(--nav-inactive)] font-medium";
const ACTIVE_BAR =
  "absolute top-0 left-2 right-2 h-[2px] bg-[var(--nav-active)] rounded-full";
const ICON_SIZE = 22;
const ICON_STROKE = 1.75;

// ─── BottomNavigation ─────────────────────────────────────────────────────────

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isUsePoolOpen, setIsUsePoolOpen] = useState(false);
  const [poolAddress, setPoolAddress] = useState("");
  const useButtonRef = useRef<HTMLButtonElement | null>(null);
  const usePoolModalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const closeUsePool = useCallback(() => {
    setIsUsePoolOpen(false);
  }, []);

  const handleUsePoolClick = () => {
    previouslyFocusedRef.current =
      useButtonRef.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    setIsUsePoolOpen(true);
  };

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
    closeUsePool();
    setPoolAddress("");
  };

  useEffect(() => {
    if (!isUsePoolOpen) return;

    const getFocusable = () => {
      const root = usePoolModalRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
    };

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeUsePool();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        usePoolModalRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (
          !active ||
          active === first ||
          !usePoolModalRef.current?.contains(active)
        ) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (
          !active ||
          active === last ||
          !usePoolModalRef.current?.contains(active)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handler);

    queueMicrotask(() => {
      const input = document.getElementById(
        "pool-address-input",
      ) as HTMLInputElement | null;
      if (input) {
        input.focus();
      } else {
        const focusable = getFocusable();
        focusable[0]?.focus();
      }
    });

    return () => {
      document.removeEventListener("keydown", handler);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [closeUsePool, isUsePoolOpen]);

  const navItems = [
    {
      href: "/explorePools",
      icon: Search,
      label: "Explore",
      isActive: pathname === "/explorePools",
    },
    {
      href: "/createPool",
      icon: Plus,
      label: "Create",
      isActive: pathname === "/createPool",
    },
    {
      href: "/portfolio",
      icon: User,
      label: "Portfolio",
      isActive: pathname === "/portfolio",
    },
  ];

  const NavTile = ({
    href,
    icon: Icon,
    label,
    isActive,
  }: (typeof navItems)[0]) => (
    <Link
      href={href}
      className="relative flex flex-col items-center justify-center py-3.5 flex-1 transition-colors"
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && <span className={ACTIVE_BAR} aria-hidden="true" />}
      <Icon
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        className={cn(
          "transition-colors",
          isActive ? ACTIVE_ICON : INACTIVE_ICON,
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-[11px] mt-1 transition-colors",
          isActive ? ACTIVE_LABEL : INACTIVE_LABEL,
        )}
      >
        {label}
      </span>
    </Link>
  );

  const UseButton = () => (
    <button
      ref={useButtonRef}
      onClick={handleUsePoolClick}
      className="relative flex flex-col items-center justify-center py-3.5 flex-1 transition-colors"
      aria-label="Open pool by address"
    >
      <Play
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        className={cn("transition-colors", INACTIVE_ICON)}
        aria-hidden="true"
      />
      <span
        className={cn("text-[11px] mt-1 transition-colors", INACTIVE_LABEL)}
      >
        Use
      </span>
    </button>
  );

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden block"
    >
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
            <WalletSlot />
          </div>

          {/* Portfolio · Use */}
          {navItems.slice(2).map((item) => (
            <NavTile key={item.href} {...item} />
          ))}
          <UseButton />
        </div>
      </div>

      {/* "Use Pool" modal */}
      {isUsePoolOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="use-pool-modal-title"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) closeUsePool();
          }}
        >
          <div
            ref={usePoolModalRef}
            tabIndex={-1}
            className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                id="use-pool-modal-title"
                className="text-lg font-semibold text-white"
              >
                Use Pool
              </h3>
              <button
                onClick={closeUsePool}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Close use pool modal"
              >
                <X size={18} className="text-white" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pool-address-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Pool Address
                </label>
                <input
                  id="pool-address-input"
                  type="text"
                  value={poolAddress}
                  onChange={(e) => setPoolAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePoolSubmit()}
                  placeholder="0x…"
                  className="w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeUsePool}
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
    </nav>
  );
};

export default BottomNavigation;
