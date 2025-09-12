"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
// import { useRouter } from "next/navigation";
import CreateFatePoolForm from "@/components/Forms/CreateFatePool";

export default function CreateFatePoolPage() {
  const { isConnected } = useAccount();
  // const router = useRouter();

  useEffect(() => {
    // Ensure wallet connection persistence
    if (typeof window !== 'undefined') {
      const persistConnection = localStorage.getItem('wallet-connection-persist');
      if (persistConnection && !isConnected) {
        // If we had a persistent connection but wallet is disconnected, 
        // try to restore it or redirect back
        console.log('Wallet connection lost during navigation, attempting to restore...');
      }
    }
  }, [isConnected]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <CreateFatePoolForm />
      </div>
    </>
  );
}
