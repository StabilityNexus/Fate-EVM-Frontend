'use client';

import React, { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/utils/wagmiConfig';

export function WalletProvider({ children }: { children: React.ReactNode }) {
    // Create QueryClient inside component to ensure data isolation between requests
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 3,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
            },
            mutations: {
                retry: 1,
            },
        },
    }));

    useEffect(() => {
        // Connection persistence: createPool/page.tsx reads this flag on load.
        const handleBeforeUnload = () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('wallet-connection-persist', 'true');
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                localStorage.removeItem('wallet-connection-persist');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // WalletLink follows the app's theme via the `.dark` class next-themes sets,
    // so no provider-level theme wiring is needed.
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
