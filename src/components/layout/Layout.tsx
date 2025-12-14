'use client';
import { ThemeProvider } from "@/components/themeProvider";
import { WalletProvider } from "@/context/walletProvider";
import { KYAProvider } from "@/context/KYAProvider";
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
        <KYAProvider>
          {children}
          <Toaster position="top-right" richColors />
        </KYAProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}