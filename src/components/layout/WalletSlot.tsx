"use client";

import React from "react";
import { useAccount } from "wagmi";
import ConnectBtn from "@/components/ui/ConnectBtn";

export default function WalletSlot() {
  // Keep hook usage (wallet state) even though rendering is delegated to ConnectBtn.
  // This preserves the original component's responsibility in the layout.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isConnected } = useAccount();

  return (
    <div className="flex items-center justify-center w-full">
      <ConnectBtn />
    </div>
  );
}
