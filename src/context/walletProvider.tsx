'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';
import {
    RainbowKitProvider,
    lightTheme,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/utils/wagmiConfig';

// Create QueryClient outside component to prevent recreation on re-renders
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, 
            gcTime: 10 * 60 * 1000, 
            retry: 3, 
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Add connection persistence
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 1, 
        },
    },
});

// Default theme for SSR/initial render
const defaultTheme = lightTheme({
    accentColor: 'black',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    overlayBlur: 'small',
    fontStack: 'system',
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Add connection persistence
        const handleBeforeUnload = () => {
            // Store connection state before page unload
            if (typeof window !== 'undefined') {
                localStorage.setItem('wallet-connection-persist', 'true');
            }
        };

        const handleVisibilityChange = () => {
            // Handle page visibility changes
            if (document.visibilityState === 'visible') {
                // Page became visible again
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

    // Memoize the theme to prevent unnecessary re-renders
    // Only use resolvedTheme after component is mounted to prevent hydration issues
    const theme = useMemo(() => {
        if (!mounted) {
            return defaultTheme;
        }

        return resolvedTheme === 'dark'
            ? darkTheme({
                accentColor: 'white',
                accentColorForeground: 'black',
                borderRadius: 'medium',
                overlayBlur: 'small',
                fontStack: 'system',
            })
            : lightTheme({
                accentColor: 'black',
                accentColorForeground: 'white',
                borderRadius: 'medium',
                overlayBlur: 'small',
                fontStack: 'system',
            });
    }, [mounted, resolvedTheme]);

    // Prevent wallet disconnection by ensuring stable provider setup
    const stableConfig = useMemo(() => config, []);

    // Always render WagmiProvider and QueryClientProvider for hooks
    // But only render RainbowKitProvider after mount to prevent hydration errors
    return (
        <WagmiProvider config={stableConfig}>
            <QueryClientProvider client={queryClient}>
                {mounted ? (
                    <RainbowKitProvider theme={theme}>
                        {children}
                    </RainbowKitProvider>
                ) : (
                    // Render children without RainbowKitProvider during SSR/initial hydration
                    // This prevents the ConnectModal from trying to update state during render
                    children
                )}
            </QueryClientProvider>
        </WagmiProvider>
    );
}