"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAddress } from "viem";

import { Loading } from "@/components/ui/loading";

const Hero = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poolAddress, setPoolAddress] = useState("");
  const [mounted, setMounted] = useState(false);

  const isPoolAddressValid = isAddress(poolAddress.trim());

  const closeModal = () => {
    setIsModalOpen(false);
    setPoolAddress("");
  };

  const handleContinue = () => {
    if (!isPoolAddressValid) return;
    router.push(`/pool?id=${poolAddress.trim()}`);
    closeModal();
  };

  //  Hero container ref
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Perfect cursor sync (NO lag, NO offset)
  useEffect(() => {
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return; // prevent multiple frames

      rafId = requestAnimationFrame(() => {
        if (!heroRef.current) return;

        const rect = heroRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        heroRef.current.style.setProperty("--mouse-x", `${x}px`);
        heroRef.current.style.setProperty("--mouse-y", `${y}px`);

        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
        <Loading size="xl" />
      </div>
    );
  }

  return (
    <div
      ref={heroRef}
      className={`relative w-full min-h-screen overflow-hidden flex items-center justify-center ${
        isModalOpen ? "" : "hero-hide-cursor"
      }`}
    >
      {/*
        Background Layer — purely visual. It supplies the inverted-colour
        copy that shows through the mask hole in the foreground layer.
        Hidden from assistive tech and the tab order so the hero is only
        announced/tabbed once (the foreground layer is the real content).
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center bg-black dark:bg-white"
      >
        <HeroContent
          decorative
          textClassName="text-white dark:text-black"
          setIsModalOpen={setIsModalOpen}
          onHoverChange={setIsHovered}
        />
      </div>

      {/* Foreground Layer (MASK APPLIED HERE) — the real, interactive content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center hero-cursor pointer-events-none"
        style={
          {
            backgroundColor: resolvedTheme === "dark" ? "black" : "white",
            "--mask-size": `${isHovered ? 140 : 20}px`,
          } as React.CSSProperties
        }
      >
        <HeroContent
          textClassName="text-black dark:text-white"
          setIsModalOpen={setIsModalOpen}
          onHoverChange={setIsHovered}
        />
      </div>

      {/*  Mask CSS */}
      <style jsx>{`
        .hero-cursor {
          mask-image: radial-gradient(
            circle at var(--mouse-x) var(--mouse-y),
            transparent var(--mask-size),
            black var(--mask-size)
          );

          -webkit-mask-image: radial-gradient(
            circle at var(--mouse-x) var(--mouse-y),
            transparent var(--mask-size),
            black var(--mask-size)
          );
        }

        .hero-hide-cursor,
        .hero-hide-cursor * {
          cursor: none !important;
        }
      `}</style>
      <PoolAddressModal
        open={isModalOpen}
        value={poolAddress}
        isValid={isPoolAddressValid}
        onValueChange={setPoolAddress}
        onClose={closeModal}
        onSubmit={handleContinue}
      />
    </div>
  );
};

type PoolAddressModalProps = {
  open: boolean;
  value: string;
  isValid: boolean;
  onValueChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const PoolAddressModal = ({
  open,
  value,
  isValid,
  onValueChange,
  onClose,
  onSubmit,
}: PoolAddressModalProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Move focus into the dialog on open, restore it to the trigger on close.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Escape closes the dialog; Tab is trapped inside it.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pool-address-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-96"
      >
        <h2
          id="pool-address-modal-title"
          className="text-xl font-semibold mb-4 text-black dark:text-white"
        >
          Enter Pool Address
        </h2>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          className="w-full p-2 border rounded-full mb-4 dark:bg-gray-700 dark:text-white outline-none focus:outline-none focus:ring-0"
          placeholder="0x123...abc"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border rounded-full px-4 py-2 bg-black text-white"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={!isValid}
            className="border rounded-full px-4 py-2 bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

type HeroContentProps = {
  /** Render as a visual-only copy: no <h1>, not focusable, not clickable. */
  decorative?: boolean;
  textClassName: string;
  setIsModalOpen: (val: boolean) => void;
  onHoverChange: (val: boolean) => void;
};

// Single source of truth for the hero copy + CTAs. Rendered twice — once as
// the real content, once as a decorative layer for the spotlight mask.
const HeroContent = ({
  decorative = false,
  textClassName,
  setIsModalOpen,
  onHoverChange,
}: HeroContentProps) => {
  const Heading = decorative ? "div" : "h1";

  return (
    <>
      <Heading
        className={`${textClassName} text-4xl md:text-8xl font-bold text-center`}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
      >
        Fate Protocol
      </Heading>

      <p
        className={`${textClassName} text-md md:text-2xl mt-4 text-center`}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
      >
        Decentralized perpetual prediction pools.
      </p>

      <ButtonGroup setIsModalOpen={setIsModalOpen} decorative={decorative} />
    </>
  );
};

type ButtonGroupProps = {
  setIsModalOpen: (val: boolean) => void;
  decorative?: boolean;
};

const ButtonGroup = ({ setIsModalOpen, decorative = false }: ButtonGroupProps) => {
  const buttonClass = `px-6 py-3 border rounded-full text-white mix-blend-difference cursor-none ${
    decorative ? "pointer-events-none" : "pointer-events-auto"
  }`;
  // Keep the decorative copy out of the tab order (it lives inside an
  // aria-hidden layer, so focusable descendants would be an a11y violation).
  const decorativeTabIndex = decorative ? -1 : undefined;

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 mt-8 ${
        decorative ? "pointer-events-none" : "pointer-events-auto"
      }`}
    >
      <Link href="/createPool" tabIndex={decorativeTabIndex}>
        <button className={buttonClass} tabIndex={decorativeTabIndex}>
          Create Pool
        </button>
      </Link>

      <Link href="/explorePools" tabIndex={decorativeTabIndex}>
        <button className={buttonClass} tabIndex={decorativeTabIndex}>
          Explore Pools
        </button>
      </Link>

      <button
        onClick={() => setIsModalOpen(true)}
        className={buttonClass}
        tabIndex={decorativeTabIndex}
      >
        Use Pool
      </button>
    </div>
  );
};

export default Hero;
