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
      <header className={cn("z-50 w-full overflow-hidden", className)}>
        {/* FLUID CONTAINER */}
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between dark:bg-black px-4 md:px-6 py-2 md:py-3 gap-2 md:gap-4 lg:gap-8">
          
          {/* Logo (Shrink) Left Side */}
          <div className="flex-shrink-0 flex items-center justify-start min-w-0 pr-2">
            <Link href="/">
              <Image
                src={resolvedTheme === "dark" ? logoWhite : logoBlack}
                alt="Fate Protocol"
                width={70}
                height={70}
                className="p-1 md:p-2 brightness-75 contrast-125 dark:brightness-100 dark:contrast-100"
                priority
              />
            </Link>
          </div>

          {/* Mobile Theme Toggle (<md only) */}
          <div className="flex md:hidden items-center ml-auto">
             <ModeToggle />
          </div>

          {/* Desktop Navigation Links (Fluid Center) -> hidden on mobile, compact on tablet, full on desktop */}
          <nav
            className={cn(
              "hidden md:flex flex-1 items-center justify-center space-x-4 lg:space-x-8 text-sm lg:text-base whitespace-nowrap",
              "px-4 lg:px-8 py-2 rounded-full",
              "bg-[#f0f1f4]/80 dark:bg-[#1a1b1f]/80 text-gray-900 dark:text-white backdrop-blur-sm",
              "font-[var(--font-bebas-nueue)] tracking-wide max-w-max mx-auto"
            )}
          >
            <Link href="/explorePools" className="hover:text-yellow-500 transition-colors">Explore</Link>
            <Link href="/createPool" className="hover:text-yellow-500 transition-colors">Create</Link>
            <Link href="/portfolio" className="hover:text-yellow-500 transition-colors">Portfolio</Link>
          </nav>

          {/* Theme Toggle & Connect Button (Fixed/Shrink Right Side) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0 justify-end min-w-0">
            <ModeToggle />
            <div className="flex-shrink-0">
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </>
  );
};

export default Navbar;