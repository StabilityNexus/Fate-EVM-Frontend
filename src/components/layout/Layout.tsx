'use client';
import { ThemeProvider } from "@/components/themeProvider";
import { WalletProvider } from "@/context/walletProvider";
import { TermsOfUseProvider } from "@/context/TermsOfUseProvider";
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
        <TermsOfUseProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </TermsOfUseProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
