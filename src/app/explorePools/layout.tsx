import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Explore Pools",
  description:
    "Browse prediction pools across supported chains, compare bull and bear markets, and discover real-time opportunities with oracle pricing, liquidity, and performance insights.",
  alternates: {
    canonical: "/explorePools",
  },
  openGraph: {
    title: "Explore Pools",
    description:
      "Browse prediction pools across supported chains, compare bull and bear markets, and discover real-time opportunities with oracle pricing, liquidity, and performance insights.",
    url: "/explorePools",
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
    title: "Explore Pools",
    description:
      "Browse prediction pools across supported chains, compare bull and bear markets, and discover real-time opportunities with oracle pricing, liquidity, and performance insights.",
    images: ["https://evm.fate.stability.nexus/og-image.png"],
  },
};

export default function ExplorePoolsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
