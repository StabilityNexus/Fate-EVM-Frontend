import type { Metadata } from "next";
import AboutSection from "@/components/Home/About";
import Hero from "@/components/Home/Hero";

export const metadata: Metadata = {
  title: "Decentralized Prediction Markets & DeFi Trading",
  description:
    "Decentralized perpetual prediction pools for trading price movements across multiple blockchain networks with real-time oracle pricing, automated market making, and transparent on-chain execution.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Decentralized Prediction Markets & DeFi Trading",
    description:
      "Decentralized perpetual prediction pools for trading price movements across multiple blockchain networks with real-time oracle pricing, automated market making, and transparent on-chain execution.",
    url: "/",
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
    title: "Decentralized Prediction Markets & DeFi Trading",
    description:
      "Decentralized perpetual prediction pools for trading price movements across multiple blockchain networks with real-time oracle pricing, automated market making, and transparent on-chain execution.",
    images: ["https://evm.fate.stability.nexus/og-image.png"],
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <AboutSection />
    </>
  );
}
