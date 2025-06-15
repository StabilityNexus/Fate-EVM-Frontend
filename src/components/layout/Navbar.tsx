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

const Navbar = () => {
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
    <header className="justify-between">
      <div className="mx-auto flex items-center justify-between relative dark:bg-black px-5">
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
        <div className="flex items-center space-x-4 md:hidden">
          <button
            className="z-20"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu
                className="w-8 h-8 fill-current text-black dark:text-white"
                style={resolvedTheme == "dark" ? { color: "white" } : { color: "black" }}
              />
            )}
          </button>
          <ModeToggle />
          <WalletButton />


        </div>

        {/* Mobile Navigation Links */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-10 flex items-center justify-center">
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
                    className="block py-2 hover:text-blue-600 dark:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Explore
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#Contact"
                    className="block py-2 hover:text-blue-600 dark:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#Contact"
                    className="block py-2 hover:text-blue-600 dark:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Learn More
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Desktop Navigation Links - Centered */}
        <nav
          className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8 text-md text-center px-8 py-2 rounded-full bg-opacity-[10%] bg-black dark:bg-white dark:bg-opacity-[20%] dark:text-white"
          style={{ fontFamily: "var(--font-bebas-nueue)" }}
        >
          <Link href="/explorePools" className="hover:text-blue-600">
            Explore
          </Link>
          <Link href="/#Contact" className="hover:text-blue-600">
            About
          </Link>
          <Link href="/#Contact" className="hover:text-blue-600">
            Learn More
          </Link>
        </nav>

        {/* Theme Toggle & Connect Button - Right Side */}
        <div className="hidden md:flex items-center space-x-4">
          <ModeToggle />
          <WalletButton />

        </div>
      </div>
    </header>
  );
};

export default Navbar;
