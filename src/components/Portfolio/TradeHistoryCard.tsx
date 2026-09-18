"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  Scissors,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useFatePoolsStorage } from "@/lib/fatePoolHook";
import { PortfolioTransaction, SupportedChainId } from "@/lib/indexeddb/config";
import { getExplorerUrl } from "@/utils/explorer";
import { logger } from "@/lib/logger";

export interface TradeHistoryPool {
  id: string;
  name: string;
  baseTokenSymbol: string;
  bullTokenSymbol: string;
  bearTokenSymbol: string;
}

const PAGE_SIZE = 10;

// Matches the portfolio page's other content cards.
const CARD_CLASS =
  "border-black dark:border-neutral-700/60 dark:bg-gradient-to-br dark:from-neutral-800/50 dark:to-neutral-900/50 backdrop-blur-sm shadow-xl";

const NOTICE_CLASS =
  "flex items-start gap-3 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-3";

// Values arrive already scaled by the writer, so this is display only. Never re-scale here.
const formatAmount = (value: number, maximumFractionDigits = 6): string => {
  if (!isFinite(value)) return "0";
  if (value !== 0 && Math.abs(value) < 0.000001) return "< 0.000001";
  return value.toLocaleString(undefined, { maximumFractionDigits });
};

// Null when the row has no trustworthy time. A write-time fallback would render as a plausible
// but wrong date, which is worse than showing nothing, so those get a dash.
const formatWhen = (tx: PortfolioTransaction): string | null => {
  if (tx.timestampSource !== "block") return null;
  if (!tx.timestamp || !isFinite(tx.timestamp)) return null;
  const date = new Date(tx.timestamp);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Synthetic hashes are minted when a log carried none, and those cannot be opened on an explorer.
const isRealTxHash = (hash: string): hash is `0x${string}` =>
  /^0x[0-9a-fA-F]{64}$/.test(hash);

const explorerLink = (hash: string, chainId: number): string | null => {
  if (!isRealTxHash(hash)) return null;
  try {
    return getExplorerUrl(hash, chainId);
  } catch {
    return null;
  }
};

export const TradeHistoryCard = ({
  pools,
  userAddress,
  chainId,
  historyIncomplete,
  historyTruncated,
  reloadKey,
}: {
  pools: TradeHistoryPool[];
  userAddress?: string;
  chainId?: number;
  historyIncomplete: boolean;
  historyTruncated: boolean;
  reloadKey?: string | number;
}) => {
  const { getPortfolioTransactions, isInitialized, error: storageError } = useFatePoolsStorage();
  // null = not read yet, so a first paint is a skeleton rather than a false "no trades".
  const [transactions, setTransactions] = useState<PortfolioTransaction[] | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!userAddress || !chainId || !isInitialized) return;
    let cancelled = false;

    const load = async () => {
      const rows = await getPortfolioTransactions(userAddress, chainId as SupportedChainId);
      if (cancelled) return;
      logger.debug("TradeHistoryCard: loaded cached trades", { count: rows.length, chainId });
      setTransactions(rows);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userAddress, chainId, isInitialized, getPortfolioTransactions, reloadKey]);

  useEffect(() => {
    setPage(0);
  }, [userAddress, chainId]);

  const poolsByAddress = useMemo(() => {
    const map = new Map<string, TradeHistoryPool>();
    for (const pool of pools) map.set(pool.id.toLowerCase(), pool);
    return map;
  }, [pools]);

  const sorted = useMemo(() => {
    if (!transactions) return [];
    // Block number orders the list; id only breaks ties so rows do not shuffle between renders.
    return [...transactions].sort(
      (a, b) => b.blockNumber - a.blockNumber || a.id.localeCompare(b.id)
    );
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // A reload can shrink the list under the current page, so clamp here rather than in an
  // effect that would paint an empty page first.
  const safePage = Math.min(page, totalPages - 1);
  const firstIndex = safePage * PAGE_SIZE;
  const visible = sorted.slice(firstIndex, firstIndex + PAGE_SIZE);

  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(
    () => setPage((p) => Math.min(Math.ceil(sorted.length / PAGE_SIZE) - 1, p + 1)),
    [sorted.length]
  );

  const header = (
    <CardHeader>
      <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
        <History className="h-5 w-5" />
        Trade History
        {sorted.length > 0 && (
          <span className="ml-auto text-sm font-normal text-neutral-500 dark:text-neutral-400">
            {historyTruncated || historyIncomplete
              ? `${sorted.length} trades`
              : `All ${sorted.length} trades`}
          </span>
        )}
      </CardTitle>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Built from this wallet&apos;s on-chain Mint and Burn events, newest first. A coin transfer burns
        and re-mints, so it appears as a sell and a buy. Initial-supply coins emit no event and are not listed.
      </p>
    </CardHeader>
  );

  // isInitialized never turns true when the store fails to open, so without this the
  // skeleton below would spin forever.
  if (transactions === null && storageError) {
    return (
      <Card className={CARD_CLASS}>
        {header}
        <CardContent>
          <div className={`${NOTICE_CLASS} p-4`}>
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Local trade cache unavailable
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Trade history is stored in your browser and that store could not be opened, so
                past trades cannot be shown. Private browsing or a full disk can cause this.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions === null) {
    return (
      <Card className={CARD_CLASS}>
        {header}
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-14 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Truncation cannot produce an empty list, so a failed read is all there is to warn about.
  if (sorted.length === 0) {
    return (
      <Card className={CARD_CLASS}>
        {header}
        <CardContent>
          {historyIncomplete ? (
            <div className={`${NOTICE_CLASS} p-4`}>
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Trade history could not be read
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  The RPC did not return the event logs for this wallet, so this list is empty
                  because nothing could be read, not because you have no trades. Reload to try again.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 py-6 text-center">
              No trades yet. Buys and sells appear here once you trade a pool.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={CARD_CLASS}>
      {header}
      <CardContent>
        {(historyIncomplete || historyTruncated) && (
          <div className="space-y-3 mb-4">
            {historyIncomplete && (
              <div className={NOTICE_CLASS}>
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Some event logs could not be read, so trades may be missing from this list.
                </p>
              </div>
            )}
            {historyTruncated && (
              <div className={NOTICE_CLASS}>
                <Scissors className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Only the 30 most recent trades per position are stored, so trades older than
                  those are not shown here.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 pr-4 font-medium">Pool</th>
                <th className="py-2 pr-4 font-medium text-right">Coins</th>
                <th className="py-2 pr-4 font-medium text-right">Paid / Received</th>
                <th className="py-2 pr-4 font-medium text-right">Fee</th>
                <th className="py-2 pr-4 font-medium text-right">Price</th>
                <th className="py-2 font-medium text-right">Tx</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((tx) => {
                const pool = poolsByAddress.get(tx.poolAddress.toLowerCase());
                const baseSymbol = pool?.baseTokenSymbol ?? "";
                const coinSymbol =
                  tx.tokenType === "bull" ? pool?.bullTokenSymbol : pool?.bearTokenSymbol;
                const isBuy = tx.action === "buy";
                const link = chainId !== undefined ? explorerLink(tx.transactionHash, chainId) : null;
                const when = formatWhen(tx);

                return (
                  <tr
                    key={tx.id}
                    className="border-b border-neutral-100 dark:border-neutral-700/60 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                  >
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {when ? (
                        <div className="text-neutral-900 dark:text-neutral-100">{when}</div>
                      ) : (
                        <div
                          className="text-neutral-400 dark:text-neutral-500"
                          title="This trade's block time was never recorded, so its date is unknown."
                        >
                          &mdash;
                        </div>
                      )}
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Block {tx.blockNumber.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          isBuy
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {isBuy ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isBuy ? "Buy" : "Sell"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-neutral-900 dark:text-neutral-100">
                        {pool?.name ?? `Pool ${tx.poolAddress.slice(0, 6)}...`}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                        {tx.tokenType}
                        {coinSymbol ? ` · ${coinSymbol}` : ""}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                      {formatAmount(tx.amount)}
                    </td>
                    <td
                      className="py-3 pr-4 text-right whitespace-nowrap text-neutral-900 dark:text-neutral-100"
                      title={
                        isBuy
                          ? "Total paid, fee included"
                          : "Amount received, fee already deducted"
                      }
                    >
                      {formatAmount(tx.value)} {baseSymbol}
                    </td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                      {formatAmount(tx.fees)} {baseSymbol}
                    </td>
                    <td
                      className="py-3 pr-4 text-right whitespace-nowrap text-neutral-600 dark:text-neutral-400"
                      title={
                        isBuy
                          ? "Paid per coin, fee included"
                          : "Received per coin, fee already deducted"
                      }
                    >
                      {formatAmount(tx.price)}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {tx.transactionHash.slice(0, 6)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-500">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 mt-6">
            <Button
              onClick={goPrev}
              disabled={safePage === 0}
              variant="outline"
              size="sm"
              className="border-neutral-300 dark:border-neutral-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              Page {safePage + 1} of {totalPages}
            </span>
            <Button
              onClick={goNext}
              disabled={safePage >= totalPages - 1}
              variant="outline"
              size="sm"
              className="border-neutral-300 dark:border-neutral-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-all duration-200"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default TradeHistoryCard;
