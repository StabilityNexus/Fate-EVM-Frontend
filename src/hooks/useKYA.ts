"use client"

import { useState, useEffect } from "react";

const KYA_STORAGE_KEY = "fate-kya-acknowledged";

export function useKYA() {
  const [showKYA, setShowKYA] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged KYA
    try {
      const hasAcknowledged = localStorage.getItem(KYA_STORAGE_KEY);
      
      // Only hide KYA if explicitly acknowledged with "true"
      if (hasAcknowledged === "true") {
        setShowKYA(false);
      } else {
        setShowKYA(true);
      }
    } catch (error) {
      // If localStorage is unavailable, show KYA to be safe
      console.warn("localStorage unavailable, showing KYA:", error);
      setShowKYA(true);
    }
  }, []);

  const acknowledgeKYA = () => {
    // Always update state locally, even if storage fails
    setShowKYA(false);
    
    try {
      localStorage.setItem(KYA_STORAGE_KEY, "true");
    } catch (error) {
      // Silently fail if localStorage is unavailable
      console.warn("Failed to persist KYA acknowledgment:", error);
    }
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
