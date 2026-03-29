'use client';

import React, { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/utils/wagmiConfig';

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

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
        setMounted(true);
    }, []);

    // Prevent hydration errors by not rendering children that depend on wagmi/connectors until mounted
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {mounted ? children : <div className="invisible">{children}</div>}
            </QueryClientProvider>
        </WagmiProvider>
    );
}