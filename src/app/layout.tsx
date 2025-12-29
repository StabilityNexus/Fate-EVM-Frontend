import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/layout/Layout";
import Navbar from "@/components/layout/Navbar";
import FooterWrapper from "@/components/layout/FooterWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fate Protocol | Decentralized Prediction Markets & DeFi Trading",
  description:
    "Trade prediction markets on Fate Protocol - the decentralized platform for perpetual prediction pools. Buy bullCoins and bearCoins to predict price movements across multiple blockchain networks. Advanced DeFi trading with real-time price feeds and automated market making.",
  keywords: [
    "DeFi",
    "prediction markets", 
    "Fate Protocol",
    "blockchain trading",
    "bullCoins",
    "bearCoins",
    "price prediction",
    "decentralized finance",
    "cryptocurrency trading",
    "perpetual pools",
    "automated market making",
    "Chainlink oracles",
    "Ethereum",
    "Polygon",
    "BSC",
    "Base"
  ],
  authors: [{ name: "Fate Protocol Team" }],
  creator: "Fate Protocol",
  publisher: "Fate Protocol",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://evm.fate.stability.nexus"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Fate Protocol | Decentralized Prediction Markets",
    description: "Trade prediction markets on Fate Protocol - the decentralized platform for perpetual prediction pools. Buy bullCoins and bearCoins to predict price movements.",
    url: "https://evm.fate.stability.nexus",
    siteName: "Fate Protocol",
    images: [
      {
        url: "https://evm.fate.stability.nexus/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fate Protocol - Decentralized Prediction Markets",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fate Protocol | Decentralized Prediction Markets",
    description: "Trade prediction markets on Fate Protocol - the decentralized platform for perpetual prediction pools.",
    images: ["https://evm.fate.stability.nexus/og-image.png"],
    creator: "@FateProtocol",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var finalTheme = theme === 'system' ? systemTheme : theme;
                  
                  if (finalTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Fate Protocol",
              "description": "Decentralized perpetual prediction pools for trading price movements across multiple blockchain networks",
              "url": "https://evm.fate.stability.nexus",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "Fate Protocol Team",
                "url": "https://evm.fate.stability.nexus"
              },
              "featureList": [
                "Decentralized prediction markets",
                "Perpetual prediction pools",
                "Bull and Bear coin trading",
                "Multi-chain support",
                "Real-time price feeds",
                "Automated market making",
                "Chainlink oracle integration"
              ],
              "screenshot": "https://evm.fate.stability.nexus/og-image.png",
              "softwareVersion": "1.0.0",
              "datePublished": "2025-06-06",
              "dateModified": new Date().toISOString().split('T')[0]
            })
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <ClientProviders>
          {/* Absolute positioned navbar to avoid affecting hero positioning */}
          <Navbar className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md" />
          
          <main>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          
          <FooterWrapper className="pb-20 lg:pb-4" />
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}