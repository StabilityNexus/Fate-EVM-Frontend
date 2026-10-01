'use client';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { useSwitchChain } from 'wagmi';
import { useWalletLink, WalletLinkButton } from '@stability-nexus/walletlink';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from './dropdown-menu';

// WalletLinkButton handles connect plus the account menu (copy, disconnect).
// WalletLink has no chain UI, so the chain selector and wrong-network switch are
// added here with wagmi's own hooks, mirroring the mobile bottom nav.
export default function WalletButton() {
    const { isConnected, chain } = useWalletLink();
    const { chains, switchChain } = useSwitchChain();
    // `chain` is undefined when connected to a chain the dapp did not configure.
    const wrongNetwork = isConnected && !chain;

    return (
        <div className="flex justify-end items-center gap-2">
            {wrongNetwork && (
                <button
                    type="button"
                    onClick={() => chains[0] && switchChain({ chainId: chains[0].id })}
                    className="flex items-center gap-1.5 rounded-lg border-2 border-red-500 px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                >
                    <AlertTriangle size={16} strokeWidth={2} />
                    Wrong network
                </button>
            )}

            {isConnected && chain && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                        >
                            <span className="max-w-[120px] truncate">{chain.name}</span>
                            <ChevronDown size={14} strokeWidth={2} className="opacity-70" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {chains.map((c) => (
                            <DropdownMenuItem
                                key={c.id}
                                onSelect={() => switchChain({ chainId: c.id })}
                                className="px-3 py-1.5 text-sm"
                            >
                                {c.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <WalletLinkButton label="Connect Wallet" />
        </div>
    );
}
