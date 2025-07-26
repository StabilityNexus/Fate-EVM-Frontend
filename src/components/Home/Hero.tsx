'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAddress } from 'viem';
import { cn } from '@/lib/utils';

const Hero = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [lightOn, setLightOn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaultAddress, setVaultAddress] = useState('');
  const [mounted, setMounted] = useState(false);

  // Handle mouse movement with throttling
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    setMounted(true);
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  if (!mounted || !resolvedTheme) {
    return (
      <div className="flex items-center justify-center h-screen bg-black dark:bg-white">
        <p className="text-white dark:text-black text-xl">Loading...</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (vaultAddress && isAddress(vaultAddress)) {
      router.push(`/pool?id=${vaultAddress}`);
    } else {
      alert('Please enter a valid Ethereum address (0x followed by 40 hex characters)');
    }
  };

  // Calculate mask styles based on mouse position and hover state
  const getMaskStyle = () => {
    const size = isHovered ? 150 : 20;
    return {
      '--mouse-x': `${mousePosition.x}px`,
      '--mouse-y': `${mousePosition.y}px`,
      '--mask-size': `${size}px`,
    } as React.CSSProperties;
  };

  // Calculate flashlight position
  const getFlashlightStyle = () => ({
    '--flashlight-x': `${mousePosition.x - 100}px`,
    '--flashlight-y': `${mousePosition.y - 100}px`,
  } as React.CSSProperties);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black flex items-center justify-center">
      {/* Background Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black dark:bg-white">
        <h1
          className="text-white dark:text-black text-8xl font-bold text-center font-italiannoRegular"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Fate Protocol
        </h1>
        <p
          className="text-white dark:text-black text-2xl mt-4 text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Decentralized perpetual prediction pools. <br />
          Buy and sell bullCoins and bearCoins to dynamically hedge against price risks.
        </p>

        <ButtonGroup
          resolvedTheme={resolvedTheme}
          setIsModalOpen={setIsModalOpen}
          isModalOpen={isModalOpen}
          vaultAddress={vaultAddress}
          setVaultAddress={setVaultAddress}
          handleSubmit={handleSubmit}
        />
      </div>

      {/* Flashlight Effect */}
      <div
        className={`absolute rounded-full z-30 bg-black dark:bg-white pointer-events-none transition-opacity duration-300 w-[200px] h-[200px] ${lightOn ? 'opacity-100' : 'opacity-0'
          }`}
        style={getFlashlightStyle()}
      />

      {/* Foreground Content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center "
        style={{
          backgroundColor: resolvedTheme === 'dark' ? 'black' : 'white',
          ...getMaskStyle(),
        }}
      >
        <h1
          className="text-black dark:text-white text-8xl font-bold text-center font-italiannoRegular"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Fate Protocol
        </h1>
        <p
          className="text-black dark:text-white text-2xl mt-4 text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Decentralized perpetual prediction pools. <br />
          Buy and sell bullCoins and bearCoins to dynamically hedge against price risks.
        </p>

        <ButtonGroup
          resolvedTheme={resolvedTheme}
          setIsModalOpen={setIsModalOpen}
          isModalOpen={isModalOpen}
          vaultAddress={vaultAddress}
          setVaultAddress={setVaultAddress}
          handleSubmit={handleSubmit}
          isForeground
        />
      </div>

      {/* Toggle Flashlight Button */}
      <button
        className="hidden fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg z-40"
        onClick={() => setLightOn((prev) => !prev)}
      >
        {lightOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
      </button>

      {/* Global CSS for mask effects */}
      <style jsx global>{`
        [style*="--mouse-x"] {
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
        [style*="--flashlight-x"] {
          top: var(--flashlight-y);
          left: var(--flashlight-x);
        }
      `}</style>
    </div>
  );
};

// Extracted button group component to avoid duplication
const ButtonGroup = ({
  resolvedTheme,
  setIsModalOpen,
  isModalOpen,
  vaultAddress,
  setVaultAddress,
  handleSubmit,
  isForeground = false
}: {
  resolvedTheme: string | undefined;
  setIsModalOpen: (value: boolean) => void;
  isModalOpen: boolean;
  vaultAddress: string;
  setVaultAddress: (value: string) => void;
  handleSubmit: () => void;
  isForeground?: boolean;
}) => (
  <div className="flex gap-4 justify-center mt-8">
    <Link href="/createPool">
      <button
        className={cn(
          'px-6 py-3 border-2 rounded-full text-lg transition-all duration-300',
          resolvedTheme === (isForeground ? 'dark' : 'light')
            ? 'border-white text-white hover:bg-white hover:text-black'
            : 'border-black text-black hover:bg-black hover:text-white'
        )}
      >
        Create Pool
      </button>
    </Link>

    <Link href="/explorePools">
      <button
        className={cn(
          'px-6 py-3 border-2 rounded-full text-lg transition-all duration-300',
          resolvedTheme === (isForeground ? 'dark' : 'light')
            ? 'border-white text-white hover:bg-white hover:text-black'
            : 'border-black text-black hover:bg-black hover:text-white'
        )}
      >
        Explore Pools
      </button>
    </Link>

    <button
      onClick={() => setIsModalOpen(true)}
      className={cn(
        'px-6 py-3 border-2 rounded-full text-lg transition-all duration-300',
        resolvedTheme === (isForeground ? 'dark' : 'light')
          ? 'border-white text-white hover:bg-white hover:text-black'
          : 'border-black text-black hover:bg-black hover:text-white'
      )}
    >
      Use Pool
    </button>

    {isModalOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Enter Pool Address</h2>
          <input
            type="text"
            value={vaultAddress}
            onChange={(e) => setVaultAddress(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4 dark:bg-gray-700 dark:text-white"
            placeholder="0x123...abc"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-black dark:text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default Hero;