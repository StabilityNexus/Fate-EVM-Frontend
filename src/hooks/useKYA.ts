"use client"

import { useState, useEffect } from "react";

const KYA_STORAGE_KEY = "fate-kya-acknowledged";

export function useKYA() {
  const [showKYA, setShowKYA] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged KYA
    const hasAcknowledged = localStorage.getItem(KYA_STORAGE_KEY);
    
    if (!hasAcknowledged) {
      setShowKYA(true);
    }
  }, []);

  const acknowledgeKYA = () => {
    localStorage.setItem(KYA_STORAGE_KEY, "true");
    setShowKYA(false);
  };

  const openKYA = () => {
    setShowKYA(true);
  };

  return {
    showKYA,
    acknowledgeKYA,
    openKYA,
  };
}
