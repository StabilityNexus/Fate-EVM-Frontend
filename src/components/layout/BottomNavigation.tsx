"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Wallet, 
  Play, 
  User,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface BottomNavigationProps {
  isConnected: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ isConnected }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isUsePoolOpen, setIsUsePoolOpen] = useState(false);
  const [poolAddress, setPoolAddress] = useState("");

  const handleUsePoolClick = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    setIsUsePoolOpen(true);
  };

  const handlePoolSubmit = () => {
    if (!poolAddress.trim()) {
      toast.error("Please enter a pool address.");
      return;
    }
    
    if (!isAddress(poolAddress)) {
      toast.error("Invalid pool address format.");
      return;
    }
    
    router.push(`/pool?id=${poolAddress}`);
    setIsUsePoolOpen(false);
    setPoolAddress("");
  };

  const navItems = [
    {
      href: "/explorePools",
      icon: Search,
      label: "Explore",
      isActive: pathname === "/explorePools"
    },
    {
      href: "/createPool",
      icon: Plus,
      label: "Create",
      isActive: pathname === "/createPool"
    },
    {
      href: "/portfolio",
      icon: User,
      label: "Portfolio",
      isActive: pathname === "/portfolio"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-[900px]:block hidden">
      {/* Glassy background with backdrop blur */}
      <div className="bg-black/10 dark:bg-black/10 backdrop-blur-xl border-t border-black/20 dark:border-gray-800/50">
        <div className="px-2">
          <div className="flex items-center justify-between w-full max-w-md mx-auto">
            {/* Left side navigation items */}
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-300 group relative flex-1",
                    item.isActive 
                      ? "bg-black/20 dark:bg-white/10 text-black dark:text-white" 
                      : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/5"
                  )}
                >
                  {/* Glowing effect for active item */}
                  {item.isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm" />
                  )}
                  
                  {/* Icon with enhanced styling */}
                  <div className="relative z-10">
                    <Icon 
                      size={18} 
                      className={cn(
                        "transition-all duration-300",
                        item.isActive ? "scale-110" : "group-hover:scale-105"
                      )}
                    />
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-xs font-medium mt-1 transition-all duration-300 text-center leading-tight",
                    item.isActive ? "text-black dark:text-white" : "text-black/70 dark:text-white/70 group-hover:text-black dark:group-hover:text-white"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator */}
                  {item.isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black dark:bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
            
            {/* Wallet Button in the center */}
            <div className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-300 group relative flex-1">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading';
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button 
                              onClick={openConnectModal}
                              className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-300 group relative hover:bg-black/10 dark:hover:bg-white/5 w-full"
                            >
                              <div className="relative z-10">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full">
                                  <Wallet size={18} className="text-black dark:text-white" />
                                </div>
                              </div>
                              <span className="text-xs font-medium mt-1 text-black/70 dark:text-white/70 text-center leading-tight">
                                Connect
                              </span>
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button 
                              onClick={openChainModal}
                              className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-300 group relative hover:bg-black/10 dark:hover:bg-white/5 w-full"
                            >
                              <div className="relative z-10">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full">
                                  <Wallet size={18} className="text-red-500" />
                                </div>
                              </div>
                              <span className="text-xs font-medium mt-1 text-red-500 text-center leading-tight">
                                Wrong Network
                              </span>
                            </button>
                          );
                        }

                        return (
                          <button 
                            onClick={openAccountModal}
                            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-300 group relative hover:bg-black/10 dark:hover:bg-white/5 w-full"
                          >
                            <div className="relative z-10">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full">
                                <Wallet size={18} className="text-black dark:text-white" />
                              </div>
                            </div>
                            <span className="text-xs font-medium mt-1 text-black/70 dark:text-white/70 text-center leading-tight max-w-16 truncate">
                              {account.displayName}
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
            
            {/* Right side navigation items */}
            {navItems.slice(2).map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-300 group relative flex-1",
                    item.isActive 
                      ? "bg-black/20 dark:bg-white/10 text-black dark:text-white" 
                      : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/5"
                  )}
                >
                  {/* Glowing effect for active item */}
                  {item.isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm" />
                  )}
                  
                  {/* Icon with enhanced styling */}
                  <div className="relative z-10">
                    <Icon 
                      size={18} 
                      className={cn(
                        "transition-all duration-300",
                        item.isActive ? "scale-110" : "group-hover:scale-105"
                      )}
                    />
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-xs font-medium mt-1 transition-all duration-300 text-center leading-tight",
                    item.isActive ? "text-black dark:text-white" : "text-black/70 dark:text-white/70 group-hover:text-black dark:group-hover:text-white"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator */}
                  {item.isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black dark:bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
            
            {/* Use Pool Button */}
            <button 
              onClick={handleUsePoolClick}
              className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-300 group relative hover:bg-black/10 dark:hover:bg-white/5 flex-1 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-center w-7 rounded-full">
                  <Play size={18} className="text-black dark:text-white" />
                </div>
              </div>
              <span className="text-xs font-medium mt-1 text-black/70 dark:text-white/70 text-center leading-tight">
                Use
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Use Pool Popup Modal */}
      {isUsePoolOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">Use Pool</h3>
              <button
                onClick={() => setIsUsePoolOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={18} className="text-black dark:text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pool Address
                </label>
                <input
                  type="text"
                  value={poolAddress}
                  onChange={(e) => setPoolAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsUsePoolOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePoolSubmit}
                  className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomNavigation;
