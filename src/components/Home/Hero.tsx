'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAddress } from 'viem';

const Hero = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [lightOn, setLightOn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaultAddress, setVaultAddress] = useState('');

  // Loading fallback while theme is resolving to avoid hydration mismatch
  if (!resolvedTheme) {
    return (
      <div className="flex items-center justify-center h-screen bg-black dark:bg-white">
        <p className="text-white dark:text-black text-xl">Loading...</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (vaultAddress && isAddress(vaultAddress)) {
      router.push(`/usePool/${vaultAddress}`);
    } else {
      alert('Please enter a valid Ethereum address (0x followed by 40 hex characters)');
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Content */}
      <div className="absolute w-full h-full align-center justify-center bg-black dark:bg-white">
        <h1
          className={`text-white dark:text-black text-8xl align-center mt-[30%] md:mt-[10%] font-bold text-center pt-20 font-italiannoRegular`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Fate Protocol
        </h1>
        <p
          className={`text-white dark:text-black text-2xl mt-4 align-center text-center`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Decentralized perpetual prediction pools. <br />
          Buy and sell bullCoins and bearCoins to dynamically hedge against price risks.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/createPool">
            <button
              className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === 'light'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
                }`}
            >
              Create Pool
            </button>
          </Link>

          <Link href="/explorePools">
            <button
              className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === 'light'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
                }`}
            >
              Explore Pools
            </button>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
          ${resolvedTheme === 'light'
                ? 'border-white text-white hover:bg-white hover:text-black'
                : 'border-black text-black hover:bg-black hover:text-white'
              }`}
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
      </div>

      {/* Flashlight Effect */}
      <div
        className={`absolute rounded-full z-30 bg-black dark:bg-white pointer-events-none transition-opacity duration-300 ${lightOn ? 'opacity-100' : 'opacity-0'
          }`}
        style={{
          top: `${mousePosition.y - 100}px`,
          left: `${mousePosition.x - 100}px`,
          width: '200px',
          height: '200px',
        }}
      ></div>

      {/* Foreground Content (From Land) */}
      <div
        className="absolute w-full h-full align-center justify-center"
        style={{
          backgroundColor: resolvedTheme === 'dark' ? 'black' : 'white',
          maskImage: isHovered
            ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent 150px, black 150px)`
            : `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent 20px, black 20px)`,
          WebkitMaskImage: isHovered
            ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent 150px, black 150px)`
            : `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent 20px, black 20px)`,
        }}
      >
        <h1
          className="text-black dark:text-white text-8xl align-center mt-[30%] md:mt-[10%] font-bold text-center pt-20 font-italiannoRegular"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Fate Protocol
        </h1>
        <p
          className="text-black dark:text-white text-2xl align-center mt-4 text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Decentralized perpetual prediction pools. <br />
          Buy and sell bullCoins and bearCoins to dynamically hedge against price risks.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link href="/createPool">
            <button
              className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === 'dark'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
                }`}
            >
              Create Pool
            </button>
          </Link>

          <Link href="/explorePools">
            <button
              className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === 'dark'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
                }`}
            >
              Explore Pools
            </button>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === 'dark'
                ? 'border-white text-white hover:bg-white hover:text-black'
                : 'border-black text-black hover:bg-black hover:text-white'
              }`}
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
      </div>

      {/* Toggle Flashlight Button */}
      <button
        className="hidden fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg z-40"
        onClick={() => setLightOn((prev) => !prev)}
      >
        {lightOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
      </button>
    </div>
  );
};

export default Hero;
