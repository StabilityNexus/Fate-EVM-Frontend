"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

import { Loading } from "@/components/ui/loading";

const Hero = () => {
  const { resolvedTheme } = useTheme();

  const [isHovered, setIsHovered] = useState(false);
  const [, setIsModalOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);

  // ✅ Hero container ref
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Perfect cursor sync (NO lag, NO offset)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      heroRef.current.style.setProperty("--mouse-x", `${x}px`);
      heroRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
      className="relative w-full min-h-screen overflow-hidden bg-black flex items-center justify-center hero-hide-cursor"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black dark:bg-white">
        <h1
          className="text-white dark:text-black text-4xl md:text-8xl font-bold text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Fate Protocol
        </h1>

        <p
          className="text-white dark:text-black text-md md:text-2xl mt-4 text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Decentralized perpetual prediction pools.
        </p>

        <ButtonGroup
          setIsModalOpen={setIsModalOpen}
        />
      </div>

      {/* Foreground Layer (MASK APPLIED HERE) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center hero-cursor pointer-events-none"
        style={
          {
            backgroundColor: resolvedTheme === "dark" ? "black" : "white",
            "--mask-size": `${isHovered ? 140 : 20}px`,
          } as React.CSSProperties
        }
      >
        <h1
          className="text-black dark:text-white text-4xl md:text-8xl font-bold text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Fate Protocol
        </h1>

        <p
          className="text-black dark:text-white text-md md:text-2xl mt-4 text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Decentralized perpetual prediction pools.
        </p>

        <ButtonGroup
          setIsModalOpen={setIsModalOpen}
        />
      </div>

      {/* ✅ Mask CSS */}
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
    </div>
  );
};

type ButtonGroupProps = {
  setIsModalOpen: (val: boolean) => void;
};

const ButtonGroup = ({ setIsModalOpen }: ButtonGroupProps) => (
  <div className="flex flex-col sm:flex-row gap-4 mt-8 pointer-events-auto">
    <Link href="/createPool">
      <button className="px-6 py-3 border rounded-full pointer-events-auto text-white mix-blend-difference cursor-none">
        Create Pool
      </button>
    </Link>

    <Link href="/explorePools">
      <button className="px-6 py-3 border rounded-full pointer-events-auto text-white mix-blend-difference cursor-none">
        Explore Pools
      </button>
    </Link>

    <button
      onClick={() => setIsModalOpen(true)}
      className="px-6 py-3 border rounded-full pointer-events-auto text-white mix-blend-difference cursor-none"
    >
      Use Pool
    </button>
  </div>
);

export default Hero;
