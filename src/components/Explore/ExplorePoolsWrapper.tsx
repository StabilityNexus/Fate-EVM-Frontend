"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the main component with no SSR
const ExploreFatePools = dynamic(
  () => import('@/app/explorePools/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="pt-28 min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#1a1b1f] dark:to-[#1a1b1f] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
);

export default function ExplorePoolsWrapper() {
  return (
    <Suspense fallback={
      <div className="pt-28 min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#1a1b1f] dark:to-[#1a1b1f] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ExploreFatePools />
    </Suspense>
  );
}
