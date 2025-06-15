'use client';

import React, { useEffect, useState } from 'react';
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

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Prevent rendering on server or before mount to avoid hydration mismatch
        return null;
    }

    const theme = resolvedTheme === 'dark'
        ? darkTheme({
            accentColor: 'white',
            accentColorForeground: 'black',
            borderRadius: 'medium',
            overlayBlur: 'small',
        })
        : lightTheme({
            accentColor: 'black',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
        });

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={theme}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
