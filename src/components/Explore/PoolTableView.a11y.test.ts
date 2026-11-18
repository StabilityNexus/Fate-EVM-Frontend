import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PoolTableView from "@/components/Explore/PoolTableView";
import type { Pool } from "@/lib/types";

const pool = {
  id: "pool-1",
  name: "ETH/USD",
  bullToken: { symbol: "BULL" },
  bearToken: { symbol: "BEAR" },
  priceFeedAddress: "0x0000000000000000000000000000000000000001",
  chainId: 1,
  tvl: 0n,
  baseDecimals: 18,
  baseSymbol: "ETH",
  bullPercentage: 50,
  bearPercentage: 50,
  vaultCreatorFee: 0,
  treasuryFee: 0,
} as Pool;

describe("PoolTableView pool action", () => {
  it("renders a native, focusable button with an accessible name when disconnected", () => {
    const html = renderToStaticMarkup(
      createElement(PoolTableView, {
        pools: [pool],
        onUsePool: () => {},
        isConnected: false,
      }),
    );

    expect(html).toMatch(
      /<button[^>]*aria-label="Open pool ETH\/USD \(BULL\/BEAR\)"[^>]*>/,
    );
    expect(html).toContain('type="button"');
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("Connect");
  });
});
