"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import logoBlack from "../../../public/logo-dark.png";
import logoWhite from "../../../public/logo-white.png";
import { useTheme } from "next-themes";
import { ModeToggle } from "../darkModeToggle";
import WalletButton from "../ui/walletButton";
import BottomNavigation from "./BottomNavigation";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = "" }) => {
  const { resolvedTheme } = useTheme();
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    if (resolvedTheme) {
      setIsThemeReady(true);
    }
  }, [resolvedTheme]);

  if (!isThemeReady) return null;

  return (
    <>
      <header className={cn("justify-between z-50", className)}>
        <div className="mx-auto flex items-center justify-between relative dark:bg-black px-5 py-2">
          {/* Logo - Left Side */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="text-center">
                <Image
                  src={resolvedTheme === "dark" ? logoWhite : logoBlack}
                  alt="Fate Protocol"
                  width={80}
                  height={80}
                  className="p-2 brightness-75 contrast-125 dark:brightness-100 dark:contrast-100"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Mobile - Only mode toggle */}
          <div className="flex items-center space-x-4 max-[900px]:flex hidden">
            <ModeToggle />
          </div>


          {/* Desktop Navigation Links - Centered */}
          <nav
            className={cn(
              "hidden min-[900px]:flex absolute left-1/2 transform -translate-x-1/2 space-x-8 text-md text-center px-8 py-2 rounded-full",
              "bg-[#f0f1f4] dark:bg-[#1a1b1f] text-gray-900 dark:text-white backdrop-blur-sm",
              "font-[var(--font-bebas-nueue)]"
            )}
          >
            <Link
              href="/explorePools"
              className="text-gray-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/createPool"
              className="text-gray-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            >
              Create
            </Link>
            <Link
              href="/portfolio"
              className="text-gray-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            >
              Portfolio
            </Link>
          </nav>

          {/* Theme Toggle & Connect Button - Right Side */}
          <div className="hidden min-[900px]:flex items-center space-x-4">
            <ModeToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </>
  );
};

export default Navbar;