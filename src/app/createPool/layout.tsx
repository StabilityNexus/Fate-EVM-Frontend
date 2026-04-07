import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Create Pool",
  description:
    "Create a new prediction pool with custom parameters, asset selection, and oracle configuration, then deploy on supported chains with transparent fees and on-chain settlement.",
  alternates: {
    canonical: "/createPool",
  },
  openGraph: {
    title: "Create Pool",
    description:
      "Create a new prediction pool with custom parameters, asset selection, and oracle configuration, then deploy on supported chains with transparent fees and on-chain settlement.",
    url: "/createPool",
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
    title: "Create Pool",
    description:
      "Create a new prediction pool with custom parameters, asset selection, and oracle configuration, then deploy on supported chains with transparent fees and on-chain settlement.",
    images: ["https://evm.fate.stability.nexus/og-image.png"],
  },
};

export default function CreatePoolLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
