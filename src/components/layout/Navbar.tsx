"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import logoBlack from "../../../public/logo-dark.png";
import logoWhite from "../../../public/logo-white.png";
import { useTheme } from "next-themes";
import { ModeToggle } from "../darkModeToggle";
import { Menu, X } from "lucide-react";
import WalletButton from "../ui/walletButton";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = "" }) => {
  const { resolvedTheme } = useTheme();
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (resolvedTheme) {
      setIsThemeReady(true);
    }
  }, [resolvedTheme]);

  if (!isThemeReady) return null;

  return (
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
                className="p-2"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center space-x-4 max-[900px]:flex hidden">
          <button
            className="z-20 relative"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-8 h-8 text-black dark:text-white" />
            ) : (
              <Menu className="w-8 h-8 text-black dark:text-white" />
            )}
          </button>
          <ModeToggle />
          <WalletButton />
        </div>

        {/* Mobile Navigation Links */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center">
            <nav className="bg-white dark:bg-gray-800 p-8 rounded-lg w-4/5 max-w-md shadow-lg relative">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white font-bold py-2 px-4 rounded"
              >
                <X className="w-8 h-8" />
              </button>
              <ul
                className="flex flex-col space-y-4 text-lg text-center"
                style={{ fontFamily: "var(--font-bebas-nueue)" }}
              >
                <li>
                  <Link
                    href="/explorePools"
                    className="block py-2 text-black dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Explore
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create"
                    className="block py-2 text-black dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create
                  </Link>
                </li>
                <li>
                  <Link
                    href="/portfolio"
                    className="block py-2 text-black dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Desktop Navigation Links - Centered */}
        <nav
          className={cn(
            "hidden min-[900px]:flex absolute left-1/2 transform -translate-x-1/2 space-x-8 text-md text-center px-8 py-2 rounded-full",
            "bg-[#f0f1f4] dark:bg-[#1a1b1f] dark:text-white backdrop-blur-sm",
            "font-[var(--font-bebas-nueue)]"
          )}
        >
          <Link
            href="/explorePools"
            className="hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/createPool"
            className="hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors"
          >
            Create
          </Link>
          <Link
            href="/portfolio"
            className="hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors"
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
  );
};

export default Navbar;