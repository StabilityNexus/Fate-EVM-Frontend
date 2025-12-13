"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import logoBlack from "../../../public/logo-dark.png";
import logoWhite from "../../../public/logo-white.png";
import { useTheme } from "next-themes";
import { ModeToggle } from "../darkModeToggle";
import WalletButton from "../ui/walletButton";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = "" }) => {
  const { resolvedTheme } = useTheme();
  const { isConnected } = useAccount();
  const pathname = usePathname();
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (resolvedTheme) {
      setIsThemeReady(true);
    }
  }, [resolvedTheme]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Use mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with same structure to prevent hydration mismatch
    return (
      <header className={cn("justify-between z-50", className)}>
        <div className="mx-auto flex items-center justify-between relative dark:bg-black px-5 py-2">
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="text-center">
                <div className="w-20 h-20 p-2" /> {/* Placeholder for logo */}
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10" /> {/* Placeholder for mode toggle */}
            <div className="w-24 h-10" /> {/* Placeholder for wallet button */}
          </div>
        </div>
      </header>
    );
  }

  const navLinks = [
    { href: "/explorePools", label: "Explore" },
    { href: "/createPool", label: "Create" },
    { href: "/portfolio", label: "Portfolio" },
  ];

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl", className)}>
      <div className="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        {/* Logo - Left Side */}
        <div className="flex-shrink-0 z-50">
          <Link href="/" className="block">
            <Image
              src={resolvedTheme === "dark" ? logoWhite : logoBlack}
              alt="Fate Protocol"
              width={60}
              height={60}
              className="w-14 h-14 sm:w-16 sm:h-16 lg:w-[70px] lg:h-[70px] brightness-75 contrast-125 dark:brightness-100 dark:contrast-100 transition-all"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation Links - Centered */}
        <nav
          className={cn(
            "hidden lg:flex absolute left-1/2 transform -translate-x-1/2",
            "space-x-2 xl:space-x-4 text-base xl:text-lg text-center",
            "px-6 xl:px-8 py-2.5 xl:py-3 rounded-full",
            "bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-md",
            "shadow-sm border border-gray-200/50 dark:border-gray-800/50",
            "font-[var(--font-bebas-nueue)]"
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 xl:px-6 py-1.5 xl:py-2 rounded-full transition-all duration-300",
                "hover:bg-white/60 dark:hover:bg-gray-800/60",
                pathname === link.href
                  ? "bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 shadow-sm"
                  : "text-gray-800 dark:text-gray-200 hover:text-yellow-600 dark:hover:text-yellow-400"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions - Right Side */}
        <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
          <ModeToggle />
          <WalletButton />
        </div>

        {/* Mobile/Tablet Actions - Right Side */}
        <div className="flex lg:hidden items-center space-x-2 sm:space-x-3 z-50">
          <ModeToggle />
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "p-2 rounded-lg transition-all duration-300",
              "bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800",
              "border border-gray-200 dark:border-gray-800",
              isMobileMenuOpen && "bg-gray-200 dark:bg-gray-800"
            )}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Menu Dropdown - SOLID BACKGROUND, NO TRANSPARENCY */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 top-[72px] sm:top-[80px] bottom-0 z-40",
          "bg-white dark:bg-black",
          "border-t border-gray-200 dark:border-gray-800",
          "transition-all duration-300 ease-in-out transform",
          "overflow-y-auto",
          isMobileMenuOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <nav className="flex flex-col p-6 space-y-3 sm:space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "px-6 py-5 rounded-xl text-xl sm:text-2xl font-semibold transition-all duration-200",
                "border-2 shadow-lg active:scale-95",
                "font-[var(--font-bebas-nueue)]",
                pathname === link.href
                  ? "bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-600 dark:border-yellow-500 shadow-yellow-500/30"
                  : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:from-yellow-50 hover:to-yellow-100 dark:hover:from-yellow-900/20 dark:hover:to-yellow-800/20 hover:border-yellow-400 dark:hover:border-yellow-600 hover:shadow-xl"
              )}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Wallet Button in Mobile Menu */}
          <div className="pt-6 mt-2 border-t-2 border-gray-200 dark:border-gray-800">
            <div className="transform scale-105">
              <WalletButton />
            </div>
          </div>
        </nav>
      </div>

      {/* Overlay for mobile menu - Click to close */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Navbar;