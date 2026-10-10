"use client";

import { useRef, useState } from "react";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Loader2, Trash2, Upload } from "lucide-react";
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

const SECTION_CARD_CLASS =
  "border-black dark:border-neutral-700/60 dark:bg-gradient-to-br dark:from-neutral-800/50 dark:to-neutral-900/50 backdrop-blur-sm shadow-xl";

const STORE_LABELS: Record<string, string> = {
  portfolioPositions: "Positions",
  portfolioTransactions: "Trades",
  portfolioCache: "Portfolio cache",
};

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

export default function SettingsPage() {
  const { address } = useAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pending, setPending] = useState<BackupSummary | null>(null);
  const { isInitialized: isCacheReady, clearAllData } = useIndexedDB();
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white tracking-tight mb-3">
            Settings
          </h1>
          <p className="text-lg md:text-xl font-medium text-gray-500 dark:text-gray-400 max-w-2xl">
            Fate keeps your portfolio history in this browser, not on a server. It does not follow
            you to another device, and clearing site data erases it.
          </p>
        </div>

        <Card className={SECTION_CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100">
              Backup and restore
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Export your positions, trade history and portfolio cache to a JSON file you keep.
              Pool and token data is left out, since it is re-read from the chain anyway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* One grid so the buttons share a column and match width without a magic number. */}
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[max-content_1fr] sm:items-center">
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
                {isExporting ? "Exporting..." : "Export portfolio data"}
              </Button>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Downloads a single JSON file.
              </p>

              <div className="border-t border-neutral-200 dark:border-neutral-700 sm:col-span-2" />

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChosen}
                className="hidden"
              />
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
                {isReading ? "Reading..." : "Choose a backup file"}
              </Button>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Restoring adds to what is already here.
              </p>
            </div>

            {pending && (
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/40 p-4 space-y-3">
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
                        This backup does not record a wallet address, so it cannot be matched to
                        yours and will not be restored.
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
          </CardContent>
        </Card>

        <Card className={SECTION_CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100">
              Local cache
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Fate caches pools, tokens and your portfolio history in this browser. Clearing it
              rebuilds everything from the chain on your next visit, so export first if you want to
              keep your trade history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!confirmClear ? (
              <Button
                onClick={() => setConfirmClear(true)}
                variant="outline"
                disabled={!isCacheReady || isRestoring || isReading || isExporting}
                className="border-neutral-300 dark:border-neutral-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                <div className="flex gap-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
