"use client"

import { createContext, useContext, ReactNode } from "react";
import { useTermsOfUse } from "@/hooks/useTermsOfUse";
import TermsOfUseModal from "@/components/ui/TermsOfUseModal";

interface TermsOfUseContextType {
  openTerms: () => void;
}

const TermsOfUseContext = createContext<TermsOfUseContextType | undefined>(undefined);

export function useTermsOfUseContext() {
  const context = useContext(TermsOfUseContext);
  if (!context) {
    throw new Error("useTermsOfUseContext must be used within TermsOfUseProvider");
  }
  return context;
}

export function TermsOfUseProvider({ children }: { children: ReactNode }) {
  const { showTerms, content, fetchFailed, accepted, acceptTerms, openTerms, closeTerms } =
    useTermsOfUse();

  return (
    <TermsOfUseContext.Provider value={{ openTerms }}>
      {children}
      <TermsOfUseModal
        isOpen={showTerms}
        content={content}
        fetchFailed={fetchFailed}
        accepted={accepted}
        onAccept={acceptTerms}
        onClose={closeTerms}
      />
    </TermsOfUseContext.Provider>
  );
}
