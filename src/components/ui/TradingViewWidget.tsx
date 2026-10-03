"use client";

import React, { memo, useMemo } from "react";
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
  'maticusd': 'matic-network',
  'linkusd': 'chainlink',
  'daiusd': 'dai',
  'usdcusd': 'usd-coin',
  'usdtusd': 'tether',
};

const WIDGET_SCRIPT = "https://widgets.coingecko.com/gecko-coin-price-chart-widget.js";

// The widget's height setting covers the chart only. Its title and footer add this much, at any width.
const WIDGET_EXTRA_HEIGHT = 151;

// The widget caches in sessionStorage, which a sandboxed frame is not allowed to touch.
// This hands it an in-memory stand-in so it still loads.
const STORAGE_SHIM =
  "(function(){var m={};var s={getItem:function(k){return k in m?m[k]:null},setItem:function(k,v){m[k]=String(v)}," +
  "removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null}};" +
  "['sessionStorage','localStorage'].forEach(function(n){try{window[n]}catch(e){" +
  "Object.defineProperty(window,n,{value:s,configurable:true})}})})();";

// The third-party script runs inside this document only. The frame that shows it is sandboxed,
// so the script cannot reach the app's page, its storage or the wallet.
function buildWidgetDocument(coinId: string, dark: boolean, height: number): string {
  // The frame must declare the same color scheme as the app, or the browser paints it an opaque white.
  const scheme = dark ? "dark" : "light";
  return (
    `<!doctype html><html style="color-scheme:${scheme}"><head><meta charset="utf-8">` +
    "<style>html,body{margin:0;background:transparent;overflow:hidden}</style>" +
    `<script>${STORAGE_SHIM}</script></head><body>` +
    '<gecko-coin-price-chart-widget locale="en" outlined="false" ' +
    `height="${height}" width="100%" dark-mode="${dark}" transparent-background="true" ` +
    `coin-id="${coinId}" initial-currency="usd"></gecko-coin-price-chart-widget>` +
    `<script src="${WIDGET_SCRIPT}" async></script>` +
    "</body></html>"
  );
}

function TradingViewWidget({
  assetId,
  theme = "light",
  heightPx = 500,
  className = "",
}: CoinGeckoWidgetProps) {
  // Sized so the whole widget, CoinGecko credit included, fits the card instead of being cut off.
  const chartHeight = Math.max(heightPx - WIDGET_EXTRA_HEIGHT, 0);

  // Map the assetId to a proper CoinGecko coin ID. Only id characters are kept, since it goes into markup.
  const coinId = (COIN_ID_MAPPINGS[assetId.toLowerCase()] || assetId.toLowerCase()).replace(/[^a-z0-9-]/g, "");

  const widgetDocument = useMemo(
    () => buildWidgetDocument(coinId, theme === "dark", chartHeight),
    [coinId, theme, chartHeight]
  );

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
      className={`${className} overflow-hidden`}
      style={{ height: `${heightPx}px` }}
    >
      <CardContent className="p-0 h-full">
        <iframe
          title={`${coinId} price chart`}
          srcDoc={widgetDocument}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          className="w-full border-0"
          style={{ height: `${heightPx}px` }}
        />
      </CardContent>
    </Card>
  );
}

export default memo(TradingViewWidget);
export type { CoinGeckoWidgetProps };
