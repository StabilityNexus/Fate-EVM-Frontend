import type { Metadata } from "next";
import { Suspense } from "react";
import InteractionClient from "./InteractionClient";

export const metadata: Metadata = {
  title: "Pool",
  description:
    "View pool details, pricing, and trade bull and bear positions on Fate Protocol with real-time oracle updates, liquidity metrics, and transparent on-chain execution.",
  alternates: {
    // TODO: Replace with a dynamic per-pool canonical URL once generateMetadata() is implemented.
    canonical: "/pool",
  },
  openGraph: {
    title: "Pool",
    description:
      "View pool details, pricing, and trade bull and bear positions on Fate Protocol with real-time oracle updates, liquidity metrics, and transparent on-chain execution.",
    // TODO: Replace with a dynamic per-pool URL once generateMetadata() is implemented.
    url: "/pool",
    type: "website",
    images: [
      {
        url: "https://evm.fate.stability.nexus/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fate Protocol - Decentralized Prediction Markets",
      },
    ],
  },
  twitter: {
    title: "Pool",
    description:
      "View pool details, pricing, and trade bull and bear positions on Fate Protocol with real-time oracle updates, liquidity metrics, and transparent on-chain execution.",
    images: ["https://evm.fate.stability.nexus/og-image.png"],
  },
};

export async function generateStaticParams() {
  return [
    { pool: "pool" }
  ];
}

export default function PoolPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <InteractionClient />
        </Suspense>
      </main>
    </div>
  );
}
