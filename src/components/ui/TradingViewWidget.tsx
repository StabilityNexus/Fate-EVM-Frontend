"use client";

import React, { useEffect, useRef, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CoinGeckoWidgetProps {
  assetId: string;
  theme?: "light" | "dark";
  heightPx?: number;
  showHeader?: boolean;
  className?: string;
}

// Common coin ID mappings for better TradingView compatibility
const COIN_ID_MAPPINGS: Record<string, string> = {
  'ethusd': 'ethereum',
  'btcusd': 'bitcoin',
  'bnbusd': 'binancecoin',
  'solusd': 'solana',
  'avaxusd': 'avalanche-2',
  'adausd': 'cardano',
  'etcusd': 'ethereum-classic',
  'maticusd': 'matic-network',
  'linkusd': 'chainlink',
  'daiusd': 'dai',
  'usdcusd': 'usd-coin',
  'usdtusd': 'tether',
};

function TradingViewWidget({
  assetId,
  theme = "light",
  heightPx = 500,
  showHeader = true,
  className = "",
}: CoinGeckoWidgetProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  const contentHeight = showHeader ? heightPx - 80 : heightPx;
  
  // Map the assetId to a proper CoinGecko coin ID
  const coinId = COIN_ID_MAPPINGS[assetId.toLowerCase()] || assetId.toLowerCase();
  
  useEffect(() => {
    if (!slotRef.current || !assetId) return;

    console.log('TradingViewWidget - AssetId:', assetId);
    console.log('TradingViewWidget - CoinId:', coinId);

    const script = document.createElement("script");
    script.src =
      "https://widgets.coingecko.com/gecko-coin-price-chart-widget.js";
    script.async = true;
    script.onload = () => {
      console.log('CoinGecko script loaded');
      if (slotRef.current) {
        slotRef.current.innerHTML = `
          <gecko-coin-price-chart-widget
            locale="en"
            outlined="false"
            height="${contentHeight}"
            width="100%"
            dark-mode="${theme === "dark"}"
            transparent-background="true"
            coin-id="${coinId}"
            initial-currency="usd"
          ></gecko-coin-price-chart-widget>
        `;
        console.log('Widget HTML inserted with coinId:', coinId);
      }
    };
    script.onerror = (error) => {
      console.error('Failed to load CoinGecko script:', error);
    };
    slotRef.current.innerHTML = "";
    slotRef.current.appendChild(script);

    return () => {
      const currentSlot = slotRef.current;
      if (currentSlot) currentSlot.innerHTML = "";
    };
  }, [assetId, coinId, contentHeight, theme]);

  if (!assetId) {
    return (
      <Card
        className={`${className} border-destructive`}
        style={{ height: `${heightPx}px` }}
      >
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center text-destructive">
            <p className="font-medium">No Asset ID Provided</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please provide a valid asset ID for the chart
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={shellRef}
      className={`${className} overflow-hidden`}
      style={{ height: `${heightPx}px` }}
    >
      <CardContent className="p-0" style={{ height: `${contentHeight}px` }}>
        <div
          ref={slotRef}
          className="w-full h-full"
          style={{ minHeight: `${contentHeight}px` }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border border-black" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(TradingViewWidget);
export type { CoinGeckoWidgetProps };
