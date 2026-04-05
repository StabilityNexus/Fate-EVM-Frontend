"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  type Connector,
} from "wagmi";
import {
  logWalletEvent,
  logWalletError,
  WalletEvent,
} from "@/lib/walletLogger";
import { getWalletInfo } from "@/lib/wallets";
import { getAddressExplorerUrl } from "@/utils/explorer";
import { isSupportedChain, getChainMeta } from "@/lib/chains";
import { useChainChangeWatcher } from "@/hooks/useChainChangeWatcher";
import { ChainSwitcher } from "./ChainSwitcher";
import { toast } from "sonner";

type ConnectBtnTriggerProps = {
  isConnected: boolean;
  isConnecting: boolean;
  networkState:
    | "DISCONNECTED"
    | "CONNECTING"
    | "CONNECTED_SUPPORTED"
    | "CONNECTED_UNSUPPORTED"
    | "CONNECTED_UNKNOWN";
  chainId: number;
  address: `0x${string}` | undefined;
  truncatedAddress: string;
  activeChainName: string | undefined;
  isSwitchPending: boolean;
  openConnectModal: () => void;
  openAccountModal: (view: "account" | "network") => void;
};

type ConnectBtnProps = {
  renderTrigger?: (props: ConnectBtnTriggerProps) => React.ReactNode;
};

// ─── helpers ────────────────────────────────────────────────────────────────
const truncateAddress = (addr: `0x${string}` | undefined): string => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CopyIcon = ({
  copied,
  className = "w-4 h-4",
}: {
  copied: boolean;
  className?: string;
}) =>
  copied ? (
    <svg
      className={`text-emerald-500 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

const ExplorerIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const DisconnectIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ─── framer motion variants ─────────────────────────────────────────────────
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

const buttonTap = { scale: 0.97 };

// ─── Components ─────────────────────────────────────────────────────────────

type ModalOverlayProps = {
  onClose: () => void;
  children: React.ReactNode;
  labelledById: string;
  isOpen: boolean;
};

function ModalOverlay({
  onClose,
  children,
  labelledById,
  isOpen,
}: ModalOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const prevFocusedRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;

    prevFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const getFocusable = () => {
      const root = dialogRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
    };

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        // Keep focus on container
        e.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (
          !active ||
          active === first ||
          !dialogRef.current?.contains(active)
        ) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (
          !active ||
          active === last ||
          !dialogRef.current?.contains(active)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handler);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into dialog after it's mounted
    queueMicrotask(() => {
      const focusable = getFocusable();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogRef.current?.focus();
      }
    });

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
      prevFocusedRef.current?.focus?.();
    };
  }, [onClose, isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledById}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div ref={dialogRef} tabIndex={-1} className="outline-none">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default function ConnectBtn({ renderTrigger }: ConnectBtnProps) {
  const {
    address,
    isConnected,
    connector: activeConnector,
    isConnecting,
  } = useAccount();
  const {
    connectors,
    connect,
    isPending: isConnectPending,
    error: connectError,
    reset: resetConnect,
    variables: connectVariables,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const {
    chains,
    switchChainAsync,
    isPending: isSwitchPending,
  } = useSwitchChain();

  useChainChangeWatcher();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [viewState, setViewState] = useState<"account" | "network">("account");

  const openConnectModal = useCallback(() => {
    resetConnect();
    setIsConnectModalOpen(true);
  }, [resetConnect]);

  const openAccountModal = useCallback((view: "account" | "network") => {
    setViewState(view);
    setIsAccountModalOpen(true);
  }, []);

  const [mounted, setMounted] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [validConnectors, setValidConnectors] = useState<Connector[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Advanced Connector Filtering ──
  useEffect(() => {
    const auditConnectors = async () => {
      const verified = [];
      let hasMetaMask = false;

      for (const connector of connectors) {
        // Exclude specific ones you don't want rendered
        if (
          connector.id === "walletConnect" ||
          connector.id === "coinbaseWalletSDK"
        )
          continue;

        try {
          const provider = (await connector.getProvider()) as
            | Record<string, unknown>
            | undefined
            | null;
          // Rule 2: Skip null/undefined providers (phantom wallets)
          if (!provider) continue;

          // Detect MetaMask identity natively or via ID
          if (
            connector.id.toLowerCase().includes("metamask") ||
            provider.isMetaMask
          ) {
            hasMetaMask = true;
          }

          // Rule 3: Track for deduplication
          verified.push({ connector, provider });
        } catch {
          // If provider fails to load, ignore and exclude connector
          continue;
        }
      }

      // Final pass to prevent generic fallback overlapping specific injected providers
      const valid = verified
        .filter((item) => {
          // Rule 1: Strip out generic 'injected' if we mapped a specific provider like MetaMask
          if (item.connector.id === "injected" && hasMetaMask) {
            return false;
          }
          return true;
        })
        .map((item) => item.connector);

      // Unique connectors based on ID to be absolutely certain no exact duplicates passed
      const uniqueValid = Array.from(
        new Map(valid.map((c) => [c.id, c])).values(),
      );

      setValidConnectors(uniqueValid);
    };

    auditConnectors();
  }, [connectors]);

  // ── Chain Validation ──
  const meta = getChainMeta(chainId);
  const activeChain = meta; // backwards compatibility alias within the file
  const isOnSupportedChain = isSupportedChain(chainId);
  const isOnUnknownChain = meta === null;

  const networkState =
    !isConnected && !isConnecting
      ? "DISCONNECTED"
      : isConnecting
        ? "CONNECTING"
        : isOnSupportedChain
          ? "CONNECTED_SUPPORTED"
          : isOnUnknownChain
            ? "CONNECTED_UNKNOWN"
            : "CONNECTED_UNSUPPORTED";

  const targetChainId = useRef<number | null>(null);

  useEffect(() => {
    if (!chainId) return;

    // Update UI state once chain change is confirmed by useChainId
    if (targetChainId.current === chainId) {
      targetChainId.current = null;
      setViewState("account");
      setIsAccountModalOpen(false);
    }
  }, [chainId, activeChain?.name, isOnSupportedChain]);

  // ── Logging: Connect State Sync ──
  useEffect(() => {
    if (isConnected && isConnectModalOpen) {
      setIsConnectModalOpen(false);
      resetConnect();
    }
  }, [isConnected, isConnectModalOpen, resetConnect, address]);

  const handleConnect = useCallback(
    (connector: Connector) => {
      logWalletEvent(WalletEvent.CONNECT_INITIATED, {
        connectorId: connector.id,
      });
      resetConnect();
      connect({ connector });
    },
    [connect, resetConnect],
  );

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  }, [address]);

  const handleDisconnect = useCallback(() => {
    logWalletEvent(WalletEvent.DISCONNECT_INITIATED, { address });
    disconnect();
    setIsAccountModalOpen(false);
  }, [disconnect, address]);

  const handleImgError = useCallback((connectorId: string) => {
    setImgErrors((prev) => ({ ...prev, [connectorId]: true }));
  }, []);

  const explorerAddressUrl = (() => {
    if (!address) return undefined;
    try {
      return getAddressExplorerUrl(address, chainId);
    } catch {
      const explorerBase = activeChain?.explorerBaseUrl;
      return explorerBase ? `${explorerBase}/address/${address}` : undefined;
    }
  })();

  const handleSwitchChain = async (cId: number) => {
    if (targetChainId.current !== null) {
      return;
    }

    if (!isSupportedChain(cId)) {
      logWalletError(
        WalletEvent.CHAIN_SWITCH_FAILED,
        new Error(`Unallowed attempt to switch to unsupported chain: ${cId}`),
      );
      return;
    }

    logWalletEvent(WalletEvent.CHAIN_SWITCH_INITIATED, {
      targetChainId: cId,
      currentChainId: chainId,
    });
    targetChainId.current = cId;

    try {
      if (!switchChainAsync) {
        throw new Error("switchChainAsync is not available");
      }
      await switchChainAsync({ chainId: cId });
      logWalletEvent(WalletEvent.CHAIN_SWITCH_SUCCESS, { targetChainId: cId });
      // DO NOT trust switchChain success immediately for UI updates
      // rely on useChainId instead (this will stay pending until chainId effect fires)
    } catch (error: unknown) {
      // @ts-expect-error Safe unknown error access
      const msg = error?.message ?? "Failed to switch network";
      // @ts-expect-error Safe unknown error access
      if (error?.code === 4001 || msg.toLowerCase().includes("user rejected")) {
        logWalletEvent(WalletEvent.CHAIN_SWITCH_CANCELLED, {
          targetChainId: cId,
        });
      } else {
        logWalletEvent(WalletEvent.CHAIN_SWITCH_FAILED, {
          targetChainId: cId,
          message: msg,
        });
        toast.error(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
      }
      targetChainId.current = null;
    }
  };

  if (!mounted) {
    return (
      <div
        className="h-[44px] w-[140px] bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full"
        aria-hidden="true"
      />
    );
  }

  // ── UI UI Render Components (Pure Derivation) ──
  let walletUI;

  if (renderTrigger) {
    walletUI = renderTrigger({
      isConnected,
      isConnecting,
      networkState,
      chainId,
      address,
      truncatedAddress: truncateAddress(address),
      activeChainName: activeChain?.name,
      isSwitchPending,
      openConnectModal,
      openAccountModal,
    });
  } else if (!isConnected) {
    walletUI = (
      <motion.button
        whileTap={buttonTap}
        id="connect-wallet-btn"
        onClick={openConnectModal}
        className="h-[44px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 rounded-full font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors whitespace-nowrap shadow-sm text-sm"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </motion.button>
    );
  } else if (
    networkState === "CONNECTED_UNSUPPORTED" ||
    networkState === "CONNECTED_UNKNOWN"
  ) {
    walletUI = (
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={buttonTap}
        onClick={() => openAccountModal("network")}
        className="flex items-center gap-2 h-[44px] pl-2 pr-3 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm group"
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:opacity-80 transition-opacity cursor-pointer">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold whitespace-nowrap">
            {networkState === "CONNECTED_UNKNOWN"
              ? `Unknown (${chainId})`
              : "Wrong Network"}
          </span>
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-white px-1 font-mono tracking-tight">
          {truncateAddress(address)}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
      </motion.button>
    );
  } else {
    walletUI = (
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={buttonTap}
        onClick={() => openAccountModal("account")}
        className="flex items-center gap-2 h-[44px] pl-2 pr-3 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm group"
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:opacity-80 transition-opacity cursor-pointer">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold whitespace-nowrap">
            {activeChain?.name}
          </span>
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-white px-1 font-mono tracking-tight">
          {truncateAddress(address)}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
      </motion.button>
    );
  }

  // ── Unified Render Tree to preserve AnimatePresence ──
  return (
    <>
      <div className={renderTrigger ? "w-full" : "flex items-center"}>
        {walletUI}
      </div>

      <ModalOverlay
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          resetConnect();
        }}
        labelledById="connect-modal-title"
      >
        <motion.div
          variants={modalVariants}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-[360px] rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2
                id="connect-modal-title"
                className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
              >
                Connect Wallet
              </h2>
              <motion.button
                whileTap={buttonTap}
                onClick={() => {
                  setIsConnectModalOpen(false);
                  resetConnect();
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <CloseIcon />
              </motion.button>
            </div>
            {connectError && (
              <div
                role="alert"
                className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400"
              >
                {connectError.message.toLowerCase().includes("user rejected")
                  ? "Connection rejected."
                  : "Failed to connect."}
              </div>
            )}
            <div className="space-y-2">
              {validConnectors.length > 0 ? (
                validConnectors.map((connector) => {
                  const info = getWalletInfo(connector);
                  const isThisPending =
                    isConnectPending &&
                    (connectVariables?.connector as Connector)?.id ===
                      connector.id;
                  const hasImgError = imgErrors[connector.id] ?? false;
                  return (
                    <motion.button
                      key={connector.id}
                      whileTap={buttonTap}
                      disabled={isConnectPending}
                      onClick={() => handleConnect(connector)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group disabled:opacity-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                          {hasImgError ? (
                            <span className="text-zinc-400 font-bold select-none text-sm">
                              {info.name.charAt(0)}
                            </span>
                          ) : (
                            <Image
                              src={info.logo}
                              alt={info.name}
                              fill
                              className="object-contain p-2"
                              onError={() => handleImgError(connector.id)}
                            />
                          )}
                        </div>
                        <span className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">
                          {info.name}
                        </span>
                      </div>
                      {isThisPending && (
                        <div className="w-4 h-4 mr-2 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent animate-spin rounded-full shrink-0" />
                      )}
                    </motion.button>
                  );
                })
              ) : (
                <motion.a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={buttonTap}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      <span className="text-zinc-400 font-bold select-none text-sm">
                        W
                      </span>
                    </div>
                    <span className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">
                      Install Wallet
                    </span>
                  </div>
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      </ModalOverlay>

      <ModalOverlay
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        labelledById="account-modal-title"
      >
        <motion.div
          variants={modalVariants}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-2xl relative"
        >
          <AnimatePresence mode="wait" initial={false}>
            {viewState === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2
                    id="account-modal-title"
                    className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
                  >
                    Account
                  </h2>
                  <motion.button
                    whileTap={buttonTap}
                    onClick={() => setIsAccountModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <CloseIcon />
                  </motion.button>
                </div>
                <div className="flex flex-col items-center gap-3 mb-8">
                  <motion.div
                    layoutId="wallet-chip-modal-wrapper"
                    className="w-[60px] h-[60px] bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden shadow-sm"
                  >
                    {activeConnector ? (
                      (() => {
                        const info = getWalletInfo(activeConnector);
                        const hasErr = imgErrors[activeConnector.id] ?? false;
                        if (hasErr)
                          return (
                            <span className="text-zinc-400 font-bold">
                              {info.name.charAt(0)}
                            </span>
                          );
                        return (
                          <Image
                            src={info.logo}
                            alt={info.name}
                            width={36}
                            height={36}
                            className="object-contain"
                            onError={() => handleImgError(activeConnector.id)}
                          />
                        );
                      })()
                    ) : (
                      <span className="text-zinc-400">W</span>
                    )}
                  </motion.div>
                  <div className="text-center">
                    <p
                      className="text-[22px] font-bold text-zinc-900 dark:text-white font-mono tracking-tight"
                      title={address}
                    >
                      {truncateAddress(address)}
                    </p>
                    <motion.button
                      whileTap={buttonTap}
                      onClick={() => setViewState("network")}
                      className="mt-3 w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group cursor-pointer"
                      aria-label="Switch network"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${networkState === "CONNECTED_UNSUPPORTED" || networkState === "CONNECTED_UNKNOWN" ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
                        />
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {networkState === "CONNECTED_UNSUPPORTED"
                            ? "Wrong Network"
                            : networkState === "CONNECTED_UNKNOWN"
                              ? `Unknown (${chainId})`
                              : (activeChain?.name ?? "Loading...")}
                        </span>
                      </div>
                      <ChevronDownIcon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
                    </motion.button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={buttonTap}
                      onClick={handleCopyAddress}
                      className="flex items-center justify-center gap-2 h-[44px] rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      <CopyIcon copied={copySuccess} />{" "}
                      {copySuccess ? "Copied!" : "Copy"}
                    </motion.button>
                    {explorerAddressUrl ? (
                      <motion.a
                        whileTap={buttonTap}
                        href={explorerAddressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 h-[44px] rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        <ExplorerIcon /> Explorer
                      </motion.a>
                    ) : (
                      <div className="flex items-center justify-center gap-2 h-[44px] rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-transparent text-sm font-semibold text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
                        <ExplorerIcon className="w-4 h-4 opacity-50" /> Explorer
                      </div>
                    )}
                  </div>
                  <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />
                  <motion.button
                    whileTap={buttonTap}
                    onClick={handleDisconnect}
                    className="flex items-center justify-center gap-2 h-[44px] rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-semibold group"
                  >
                    <DisconnectIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />{" "}
                    Disconnect
                  </motion.button>
                </div>
              </motion.div>
            )}
            {viewState === "network" && (
              <motion.div
                key="network"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.button
                    whileTap={buttonTap}
                    onClick={() => setViewState("account")}
                    className="p-1.5 -ml-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </motion.button>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Switch Networks
                  </h2>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <ChainSwitcher
                    chainId={chainId}
                    networkState={networkState}
                    chains={chains}
                    isSwitchPending={isSwitchPending}
                    targetChainId={targetChainId}
                    handleSwitchChain={handleSwitchChain}
                    buttonTap={buttonTap}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </ModalOverlay>
    </>
  );
}
