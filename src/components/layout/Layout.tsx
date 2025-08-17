'use client';
import { ThemeProvider } from "@/components/themeProvider";
import { WalletProvider } from "@/context/walletProvider";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="fate-protocol-theme"
    >
      <WalletProvider>
        {children}
        <Toaster position="top-right" richColors />
      </WalletProvider>
    </ThemeProvider>
  );
}