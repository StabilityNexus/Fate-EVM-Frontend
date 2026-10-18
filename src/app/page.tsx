import type { Metadata } from "next";
import AboutSection from "@/components/Home/About";
import Hero from "@/components/Home/Hero";

export const metadata: Metadata = {
  title: { absolute: "Fate Protocol: Decentralized Prediction Markets" },
  description:
    "Create and trade bull and bear coins on any oracle feed. Perpetual prediction pools with no expiry, per-pool leverage and transparent on-chain execution.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Fate Protocol: Decentralized Prediction Markets",
    description:
      "Create and trade bull and bear coins on any oracle feed. Perpetual prediction pools with no expiry, per-pool leverage and transparent on-chain execution.",
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
    title: "Fate Protocol: Decentralized Prediction Markets",
    description:
      "Create and trade bull and bear coins on any oracle feed. Perpetual prediction pools with no expiry, per-pool leverage and transparent on-chain execution.",
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
