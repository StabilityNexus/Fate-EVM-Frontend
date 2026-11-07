import { describe, expect, it } from "vitest";
import { polygon, sepolia } from "viem/chains";
import { isWrongNetwork, networkChoices, poolHref, poolPageView, resolvePoolChainId } from "@/utils/poolRoute";

const POOL = "0x9a89A1eC7BE0c6A5DeC5FB759420CBB230A456Ef";
const CHAINS = [sepolia.id, polygon.id];

describe("poolHref", () => {
  it("names the pool's chain in the link", () => {
    expect(poolHref(POOL, polygon.id)).toBe(`/pool?id=${POOL}&chainId=137`);
  });
});

describe("resolvePoolChainId", () => {
  it("reads the chain named in the link", () => {
    expect(resolvePoolChainId("137")).toBe(polygon.id);
    expect(resolvePoolChainId("11155111")).toBe(sepolia.id);
  });

  it("does not guess a chain for a link without one", () => {
    expect(resolvePoolChainId(null)).toBeNull();
  });

  it("rejects a chain the app does not support or cannot parse", () => {
    for (const param of ["1", "0", "", "abc", "137abc", " 137", "0137", "137.0", "-137", "1e2", "0x89", "Infinity", "11155111000000000001"]) {
      expect(resolvePoolChainId(param), JSON.stringify(param)).toBeNull();
    }
  });
});

describe("isWrongNetwork", () => {
  it("blocks trading from Sepolia on a Polygon link until the wallet switches", () => {
    expect(isWrongNetwork(sepolia.id, resolvePoolChainId("137"))).toBe(true);
    expect(isWrongNetwork(polygon.id, resolvePoolChainId("137"))).toBe(false);
  });

  it("does not ask a disconnected wallet to switch", () => {
    expect(isWrongNetwork(undefined, polygon.id)).toBe(false);
  });

  it("does not ask to switch when the link names an unsupported chain", () => {
    expect(isWrongNetwork(sepolia.id, resolvePoolChainId("1"))).toBe(false);
  });
});

describe("poolPageView", () => {
  it("asks for a network on the issue's link, which has no chain", () => {
    const params = new URLSearchParams(`?id=${POOL}`);
    expect(poolPageView(params.get("id"), params.get("chainId"))).toBe("pick-network");
  });

  it("asks for a network when the chain in the link is empty", () => {
    expect(poolPageView(POOL, "")).toBe("pick-network");
  });

  it("opens the pool page when the link names a chain", () => {
    expect(poolPageView(POOL, "137")).toBe("pool");
  });

  it("leaves a bad address or a bad chain to the pool page errors", () => {
    expect(poolPageView("0xnope", null)).toBe("pool");
    expect(poolPageView(null, null)).toBe("pool");
    expect(poolPageView(POOL, "abc")).toBe("pool");
  });
});

describe("networkChoices", () => {
  it("offers every supported network for the pool, in the given order", () => {
    expect(networkChoices(POOL, CHAINS)).toEqual([
      { chainId: sepolia.id, name: "Sepolia Testnet", href: `/pool?id=${POOL}&chainId=11155111` },
      { chainId: polygon.id, name: "Polygon", href: `/pool?id=${POOL}&chainId=137` },
    ]);
  });

  it("sends the issue's link to the Polygon pool once Polygon is picked", () => {
    const polygonChoice = networkChoices(POOL, CHAINS).find((choice) => choice.chainId === polygon.id);
    expect(polygonChoice?.href).toBe(`/pool?id=${POOL}&chainId=137`);
  });

  it("skips a chain the app does not support", () => {
    expect(networkChoices(POOL, [1, polygon.id]).map((choice) => choice.chainId)).toEqual([polygon.id]);
  });
});
