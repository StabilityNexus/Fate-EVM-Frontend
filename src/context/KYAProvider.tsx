"use client"

import { createContext, useContext, ReactNode } from "react";
import { useKYA } from "@/hooks/useKYA";
import KYAModal from "@/components/ui/KYAModal";

interface KYAContextType {
  openKYA: () => void;
}

const KYAContext = createContext<KYAContextType | undefined>(undefined);

export function useKYAContext() {
  const context = useContext(KYAContext);
  if (!context) {
    throw new Error("useKYAContext must be used within KYAProvider");
  }
  return context;
}

interface KYAProviderProps {
  children: ReactNode;
}

export function KYAProvider({ children }: KYAProviderProps) {
  const { showKYA, acknowledgeKYA, openKYA } = useKYA();

  return (
    <KYAContext.Provider value={{ openKYA }}>
      {children}
      <KYAModal isOpen={showKYA} onClose={acknowledgeKYA} />
    </KYAContext.Provider>
  );
}
