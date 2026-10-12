"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAccount, useConfig } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Download,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportPortfolioBackup,
  readBackupFile,
  restorePortfolioBackup,
  walletMismatch,
  type BackupSummary,
} from "@/lib/backup/portfolioBackup";
import { logger } from "@/lib/logger";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import RpcSettingsCard from "@/components/Settings/RpcSettingsCard";

const SECTION_CARD_CLASS =
  "border-black dark:border-neutral-700/60 dark:bg-gradient-to-br dark:from-neutral-800/50 dark:to-neutral-900/50 backdrop-blur-sm shadow-xl";

// Every row shares these columns, so the RPC connector lines up under the chain box.
const MAP_GRID_CLASS =
  "grid gap-3 lg:gap-x-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)_auto_minmax(0,1fr)]";

const STORE_LABELS: Record<string, string> = {
  portfolioPositions: "Positions",
  portfolioTransactions: "Trades",
  portfolioCache: "Portfolio cache",
};

// Totals for every wallet, since that is what Clear removes.
const COUNTED_STORES = [
  { store: "portfolioPositions", label: "positions" },
  { store: "portfolioTransactions", label: "trades" },
  { store: "poolDetails", label: "pools" },
] as const;

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

function MapBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card className={`${SECTION_CARD_CLASS} flex flex-col gap-4 p-5`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      {children}
    </Card>
  );
}

function Connector({ flows }: { flows: { label: string; back?: boolean }[] }) {
  return (
    <div className="flex lg:flex-col items-center justify-center gap-x-6 gap-y-3 py-1 lg:py-0 lg:px-1 text-neutral-400 dark:text-neutral-500">
      {flows.map(({ label, back }) => (
        <div key={label} className="flex lg:flex-col items-center gap-1">
          {back ? (
            <>
              <ArrowUp className="h-4 w-4 lg:hidden" />
              <ArrowLeft className="h-4 w-4 hidden lg:block" />
            </>
          ) : (
            <>
              <ArrowDown className="h-4 w-4 lg:hidden" />
              <ArrowRight className="h-4 w-4 hidden lg:block" />
            </>
          )}
          <span className="text-[11px] uppercase tracking-wider">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { address } = useAccount();
  const { chains } = useConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pending, setPending] = useState<BackupSummary | null>(null);
  const { isInitialized: isCacheReady, clearAllData, getStoreCount } = useIndexedDB();
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  const refreshCounts = useCallback(async () => {
    const values = await Promise.all(COUNTED_STORES.map(({ store }) => getStoreCount(store)));
    setCounts(Object.fromEntries(COUNTED_STORES.map(({ store }, i) => [store, values[i]])));
  }, [getStoreCount]);

  useEffect(() => {
    if (isCacheReady) refreshCounts();
  }, [isCacheReady, refreshCounts]);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      toast.success("Local cache cleared. Pool and portfolio data will be re-read from the chain.");
      // Nothing on the page should keep showing rows that no longer exist.
      window.location.reload();
    } catch (error) {
      logger.error("Settings: clear cache failed", asError(error));
      toast.error(asError(error).message);
      setIsClearing(false);
      setConfirmClear(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { rows, filename } = await exportPortfolioBackup();
      if (rows === 0) {
        toast.info(
          "Nothing to export yet. Visit the portfolio page once so your positions and trades are cached locally."
        );
        return;
      }
      toast.success(`Exported ${rows.toLocaleString()} records to ${filename}`);
    } catch (error) {
      logger.error("Settings: portfolio export failed", asError(error));
      toast.error(
        "Export failed. Your browser may be blocking local storage, or there is no cached portfolio data yet."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset immediately so choosing the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    setPending(null);
    setIsReading(true);
    try {
      setPending(await readBackupFile(file));
    } catch (error) {
      logger.error("Settings: backup file rejected", asError(error), {
        fileName: file.name,
      });
      toast.error(asError(error).message);
    } finally {
      setIsReading(false);
    }
  };

  const handleRestore = async () => {
    if (!pending) return;
    setIsRestoring(true);
    try {
      const rows = await restorePortfolioBackup(pending, address);
      setPending(null);
      refreshCounts();
      toast.success(
        `Restored ${rows.toLocaleString()} records. Open the portfolio page to see them.`
      );
    } catch (error) {
      logger.error("Settings: restore failed", asError(error));
      toast.error(asError(error).message);
    } finally {
      setIsRestoring(false);
    }
  };

  const foreignWallets = pending && address ? walletMismatch(pending, address) : [];
  const unknownWallet = pending !== null && pending.wallets.length === 0;
  const canRestore =
    pending !== null && !!address && !unknownWallet && foreignWallets.length === 0;

  return (
    <div className="pt-28 min-h-screen transition-colors duration-500 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#1a1b1f] dark:to-[#1a1b1f]">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white tracking-tight mb-3">
            Settings
          </h1>
          <p className="text-lg md:text-xl font-medium text-gray-500 dark:text-gray-400 max-w-2xl">
            Fate has no server. Your data lives in three places, and this is how it moves between
            them.
          </p>
        </div>

        <div className={MAP_GRID_CLASS}>
          <MapBox label="Chain">
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {chains.map((chain) => chain.name).join(", ")}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Pools, prices and balances. The source of truth: everything below it is a copy.
            </p>
          </MapBox>

          <Connector flows={[{ label: "RPC" }]} />

          <MapBox label="This browser">
            <dl className="grid grid-cols-3 gap-3">
              {COUNTED_STORES.map(({ store, label }) => (
                <div key={store} className="flex flex-col-reverse">
                  <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {counts ? counts[store].toLocaleString() : "-"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="-mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Stored in this browser, across all wallets.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              A cache. Clearing it rebuilds everything from the chain, but export first to keep
              your trade history.
            </p>
            <div className="mt-auto">
              {!confirmClear ? (
                <Button
                  onClick={() => setConfirmClear(true)}
                  variant="outline"
                  disabled={!isCacheReady || isRestoring || isReading || isExporting}
                  className="w-full border-neutral-300 dark:border-neutral-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear local cache
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Clear everything Fate has cached in this browser?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleClearCache}
                      disabled={isClearing || isExporting || isReading || isRestoring}
                      className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                    >
                      {isClearing && <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />}
                      {isClearing ? "Clearing..." : "Clear"}
                    </Button>
                    <Button
                      onClick={() => setConfirmClear(false)}
                      variant="outline"
                      disabled={isClearing}
                      className="border-neutral-300 dark:border-neutral-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </MapBox>

          <Connector flows={[{ label: "Export" }, { label: "Restore", back: true }]} />

          <MapBox label="Your file">
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              A JSON backup
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Your positions and trades, to keep or move to another device. Restoring adds to
              what is already here.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChosen}
              className="hidden"
            />
            <div className="mt-auto grid gap-3">
              <Button
                onClick={handleExport}
                disabled={isExporting || isClearing}
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? "Exporting..." : "Export"}
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isReading || isClearing}
                className="border-neutral-300 dark:border-neutral-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
              >
                {isReading ? (
                  <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isReading ? "Reading..." : "Restore from a file"}
              </Button>
            </div>
          </MapBox>

          {pending && (
            <div className="lg:col-span-5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/40 p-5 space-y-3">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Ready to restore
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {Object.entries(pending.rowsByStore).map(([store, count]) => (
                  <div key={store}>
                    <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                      {STORE_LABELS[store] ?? store}
                    </dt>
                    <dd className="text-neutral-900 dark:text-neutral-100">
                      {count.toLocaleString()}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs text-neutral-500 dark:text-neutral-400">Exported</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">
                    {new Date(pending.exportedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>

              <div className="text-xs text-neutral-500 dark:text-neutral-400 break-all">
                Wallet in backup:{" "}
                {pending.wallets.length > 0 ? pending.wallets.join(", ") : "none recorded"}
              </div>

              {!address && (
                <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Connect a wallet before restoring, so this data can be matched to it.</p>
                </div>
              )}

              {unknownWallet && (
                <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    This backup does not record a wallet address, so it cannot be matched to yours
                    and will not be restored.
                  </p>
                </div>
              )}

              {foreignWallets.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    This backup belongs to a different wallet, so it cannot be restored here.
                    Restoring it would report balances and returns that are not yours. Connect{" "}
                    <span className="break-all font-medium">{foreignWallets[0]}</span> instead.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  onClick={handleRestore}
                  disabled={!canRestore || isRestoring || isClearing}
                  className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                >
                  {isRestoring && <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />}
                  {isRestoring ? "Restoring..." : "Restore this backup"}
                </Button>
                <Button
                  onClick={() => setPending(null)}
                  variant="outline"
                  disabled={isRestoring}
                  className="border-neutral-300 dark:border-neutral-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="hidden lg:flex lg:col-start-1 flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500">
            <div className="h-4 w-px bg-neutral-400 dark:bg-neutral-600" />
            <span className="text-[11px] uppercase tracking-wider">read through</span>
            <ArrowDown className="h-4 w-4" />
          </div>

          <RpcSettingsCard className={`${SECTION_CARD_CLASS} lg:col-span-5`} />
        </div>
      </div>
    </div>
  );
}
