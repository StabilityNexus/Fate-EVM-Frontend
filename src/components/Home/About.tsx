"use client";
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CircleDollarSign, Infinity as InfinityIcon, Scale } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutSection() {
  const features = [
    {
      icon: (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2 }}
        >
          <CircleDollarSign className="h-12 w-12 text-black dark:text-white" />
        </motion.div>
      ),
      title: "Pool Approach",
      description:
        "Hedge against risks with perpetual prediction pools — efficient, scalable, and seamless.",
    },
    {
      icon: (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4 }}
        >
          <InfinityIcon className="h-12 w-12 text-black dark:text-white" />
        </motion.div>
      ),
      title: "Continuous Operation",
      description:
        "The future doesn’t pause. Our markets operate endlessly, adapting to every pulse of change.",
    },
    {
      icon: (
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 2 }}
        >
          <Scale className="h-12 w-12 text-black dark:text-white" />
        </motion.div>
      ),
      title: "Fairness & Transparency",
      description:
        "Immutable smart contracts ensure trust, fairness, and secure outcomes — powered by code, not bias.",
    },
  ];

  return (
    <section
      id="features"
      className="py-10 pb-32 bg-white dark:bg-black relative overflow-hidden"
    >
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 opacity-60 blur-2xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-10">
        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-black dark:text-white tracking-widest">
          Redefining Prediction Markets
        </h2>

        <div className="grid grid-cols-1 text-center md:text-left md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-white/30 dark:bg-black/30 backdrop-blur-md shadow-md border border-white dark:border-gray-700 rounded-xl p-2 md:p-6 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex justify-center">{feature.icon}</div>
                <CardTitle className="text-black dark:text-white text-xl font-bold">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-800 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </motion.div>
          ))}
        </div>

        {/* Meaningful Outro Statement */}
        <div className="mt-20 text-center text-black dark:text-white text-md md:text-lg">
          <p>
            *In a world of uncertainty, we provide clarity — empowering you to predict, protect, and prosper.*
          </p>
        </div>

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Fate Protocol",
              "applicationCategory": "FinanceApplication",
              "description": "Fate Protocol is a decentralized finance (DeFi) platform that enables users to trade prediction markets through perpetual prediction pools. Users can buy bullCoins to bet on price increases or bearCoins to bet on price decreases, creating a dynamic hedging mechanism against price volatility risks.",
              "featureList": [
                "Decentralized prediction markets on multiple blockchain networks",
                "Perpetual prediction pools with continuous operation",
                "Bull and Bear coin trading for price movement prediction",
                "Real-time price feeds powered by Chainlink oracles",
                "Automated market making for efficient trading",
                "Multi-chain support: Ethereum, Polygon, BSC, Base, Ethereum Classic",
                "Transparent smart contracts ensuring fairness and security",
                "DeFi trading platform for cryptocurrency price prediction"
              ],
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "url": "https://evm.fate.stability.nexus"
            })
          }}
        />
      </div>
    </section>
  );
}
