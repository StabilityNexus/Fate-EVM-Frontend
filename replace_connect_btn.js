const fs = require('fs');

const content = `'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useBalance,
  type Connector,
} from 'wagmi';
import { getWalletInfo } from '@/lib/wallets';
import { getAddressExplorerUrl } from '@/utils/explorer';
import { toast } from 'sonner';

// ─── helpers ────────────────────────────────────────────────────────────────
const truncateAddress = (addr: \`0x\${string}\` | undefined): string => {
  if (!addr) return '';
  return \`\${addr.substring(0, 6)}...\${addr.substring(addr.length - 4)}\`;
};

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CopyIcon = ({ copied, className = "w-4 h-4" }: { copied: boolean, className?: string }) => (
  copied ? (
    <svg className={\`text-emerald-500 \${className}\`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
);

const ExplorerIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const DisconnectIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ─── framer motion variants ─────────────────────────────────────────────────
const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(4px)' },
  exit: { opacity: 0, backdropFilter: 'blur(0px)' }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 10,
    transition: { duration: 0.15, ease: 'easeOut' }
  }
};

const buttonTap = { scale: 0.97 };

// ─── Components ─────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children, labelledById, isOpen }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prev; 
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/40"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default function ConnectBtn() {
  const { address, isConnected, connector: activeConnector, isConnecting } = useAccount();
  const { connectors, connect, isPending: isConnectPending, error: connectError, reset: resetConnect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain();
  const { data: balanceData } = useBalance({ address });

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [viewState, setViewState] = useState<"account" | "network">("account");
  
  const [mounted, setMounted] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeChain = chains.find((c) => c.id === chainId);
  const isWrongNetwork = isConnected && !activeChain && chains.length > 0;
  const targetChainId = useRef<number | null>(null);

  useEffect(() => {
    if (isConnected && isConnectModalOpen) {
      setIsConnectModalOpen(false);
      resetConnect();
    }
  }, [isConnected, isConnectModalOpen, resetConnect]);

  useEffect(() => {
    if (switchError) {
      targetChainId.current = null;
      const msg = switchError.message ?? 'Failed to switch network';
      if (!msg.toLowerCase().includes('user rejected')) {
        toast.error(msg.length > 120 ? msg.slice(0, 120) + '…' : msg);
      }
    }
  }, [switchError]);

  const handleConnect = useCallback((connector: Connector) => {
    resetConnect();
    connect({ connector });
  }, [connect, resetConnect]);

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  }, [address]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setIsAccountModalOpen(false);
  }, [disconnect]);

  const handleImgError = useCallback((connectorId: string) => {
    setImgErrors((prev) => ({ ...prev, [connectorId]: true }));
  }, []);

  const explorerAddressUrl = (() => {
    if (!address) return undefined;
    try { return getAddressExplorerUrl(address, chainId); } 
    catch {
      const explorerBase = activeChain?.blockExplorers?.default?.url;
      return explorerBase ? \`\${explorerBase}/address/\${address}\` : undefined;
    }
  })();

  const handleSwitchChain = (cId: number) => {
    targetChainId.current = cId;
    switchChain({ chainId: cId }, {
      onSuccess: () => {
        targetChainId.current = null;
        setViewState("account");
        setIsAccountModalOpen(false);
      },
      onError: () => {
        targetChainId.current = null;
      }
    });
  };

  if (!mounted) {
    return <div className="h-[44px] w-[140px] bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" aria-hidden="true" />;
  }

  // ── State A: Disconnected ──
  if (!isConnected) {
    return (
      <>
        <motion.button
          whileTap={buttonTap}
          id="connect-wallet-btn"
          onClick={() => { resetConnect(); setIsConnectModalOpen(true); }}
          c
