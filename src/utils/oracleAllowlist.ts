import { isAddress, isAddressEqual, zeroAddress } from "viem";
import type { Address, PublicClient } from "viem";
import { ChainlinkAdapterFactories } from "./addresses";
import { ChainlinkAdapterFactoryABI } from "./abi/ChainlinkAdapterFactory";
import { ChainlinkOracleABI } from "./abi/ChainlinkOracle";

// The factory accepts any oracle, so the frontend decides which pools to show.
// Deny always wins. An empty allowlist shows every oracle that is not denied.
export const ALLOWED_ORACLES: Record<number, readonly Address[]> = {
  11155111: [],
};

export const DENIED_ORACLES: Record<number, readonly Address[]> = {
  11155111: [],
};

// Pools to hide even when their oracle is fine.
export const DENIED_POOLS: Record<number, readonly Address[]> = {
  // Uses the ETH/USD price feed as its base token, so it can never be traded.
  11155111: ["0xED1fc758e807DcD9FDAAF52Ef756E709074ff242"],
};

export type OracleVerdict =
  | { trusted: true; reason: "allowed" | "known-factory" | "open-list" }
  | { trusted: false; reason: "denied" | "not-listed" };

const includes = (list: readonly Address[] | undefined, oracle: Address): boolean =>
  isAddress(oracle) && !!list?.some((entry) => isAddressEqual(entry, oracle));

// Price feed -> adapter, so pools that share a feed only ask the factory once.
const adapterByFeed = new Map<string, Promise<Address>>();

// True when the oracle is the adapter our own factory created for its price feed.
const isFromKnownFactory = async (
  client: PublicClient,
  chainId: number,
  oracle: Address,
): Promise<boolean> => {
  const factory = ChainlinkAdapterFactories[chainId];
  if (!factory) return false;

  try {
    const feed = (await client.readContract({
      address: oracle,
      abi: ChainlinkOracleABI,
      functionName: "priceFeed",
    })) as Address;

    const key = `${chainId}:${feed.toLowerCase()}`;
    let adapter = adapterByFeed.get(key);
    if (!adapter) {
      adapter = client.readContract({
        address: factory,
        abi: ChainlinkAdapterFactoryABI,
        functionName: "getAdapter",
        args: [feed],
      }) as Promise<Address>;
      adapterByFeed.set(key, adapter);
      // A failed or empty lookup must not stick, or the oracle stays untrusted after its adapter exists.
      adapter.then(
        (found) => { if (isAddressEqual(found, zeroAddress)) adapterByFeed.delete(key); },
        () => adapterByFeed.delete(key),
      );
    }

    const cached = await adapter;
    return !isAddressEqual(cached, zeroAddress) && isAddressEqual(cached, oracle);
  } catch {
    return false;
  }
};

export const isPoolDenied = (chainId: number, pool: Address): boolean => includes(DENIED_POOLS[chainId], pool);

export const getOracleVerdict = async (
  client: PublicClient,
  chainId: number,
  oracle: Address,
): Promise<OracleVerdict> => {
  if (includes(DENIED_ORACLES[chainId], oracle)) return { trusted: false, reason: "denied" };

  const allowed = ALLOWED_ORACLES[chainId] ?? [];
  if (allowed.length === 0) return { trusted: true, reason: "open-list" };
  if (includes(allowed, oracle)) return { trusted: true, reason: "allowed" };

  if (await isFromKnownFactory(client, chainId, oracle)) return { trusted: true, reason: "known-factory" };

  return { trusted: false, reason: "not-listed" };
};
