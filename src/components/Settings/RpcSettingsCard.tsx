"use client";

import { useEffect, useState } from "react";
import { useConfig } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  fetchRpcChainId,
  getActiveUserRpcUrl,
  isDefaultRpcUrl,
  isHttpsUrl,
  isSameRpcUrl,
  readSavedUserRpcUrl,
  removeUserRpcUrl,
  saveUserRpcUrl,
} from "@/utils/rpcTransport";
import { logger } from "@/lib/logger";

// Host only: an API key in the path or query stays off screen.
const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const reloadToast = (message: string) =>
  toast.success(message, {
    action: { label: "Reload", onClick: () => window.location.reload() },
  });

function RpcRow({ chainId, chainName }: { chainId: number; chainName: string }) {
  const [draft, setDraft] = useState("");
  // undefined until mount: the page is prerendered, where localStorage does not exist.
  const [saved, setSaved] = useState<string | null | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setSaved(readSavedUserRpcUrl(chainId));
  }, [chainId]);

  const active = getActiveUserRpcUrl(chainId);
  const needsReload = saved !== undefined && saved !== active;
  const inputId = `rpc-${chainId}`;

  const handleSave = async () => {
    const url = draft.trim();
    if (!isHttpsUrl(url)) {
      toast.error("Enter a full https:// URL.");
      return;
    }
    if (saved && isSameRpcUrl(saved, url)) {
      toast.info(`That RPC is already saved for ${chainName}.`);
      return;
    }
    if (isDefaultRpcUrl(chainId, url)) {
      toast.info(`That is already one of the default ${chainName} RPCs.`);
      return;
    }
    setIsChecking(true);
    let reported: number;
    try {
      reported = await fetchRpcChainId(url);
    } catch {
      logger.warn("Settings: RPC check failed", { chainId, host: hostOf(url) });
      toast.error("Could not reach that RPC. Check the URL and try again.");
      setIsChecking(false);
      return;
    }
    setIsChecking(false);

    if (reported !== chainId) {
      toast.error(`That RPC serves chain ${reported}, not ${chainName} (${chainId}).`);
      return;
    }
    try {
      saveUserRpcUrl(chainId, url);
    } catch {
      toast.error("Your browser is blocking local storage, so the RPC cannot be saved.");
      return;
    }
    setSaved(url);
    setDraft("");
    reloadToast(`RPC saved for ${chainName}. Reload the page to start using it.`);
  };

  const handleReset = () => {
    try {
      removeUserRpcUrl(chainId);
      setSaved(null);
      reloadToast(`${chainName} is back on the default RPCs. Reload the page to apply.`);
    } catch {
      toast.error("Your browser is blocking local storage, so the RPC cannot be reset.");
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start lg:gap-6">
      <div className={`space-y-1 ${saved === undefined ? "invisible" : ""}`}>
        <Label htmlFor={inputId} className="text-neutral-900 dark:text-neutral-100">
          {chainName}
        </Label>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {saved ? (
            <>
              Your RPC, <span className="font-medium break-all">{hostOf(saved)}</span>, with the
              defaults as fallback.
            </>
          ) : (
            "The default public RPCs."
          )}
          {needsReload && (
            <span className="text-amber-700 dark:text-amber-300"> Reload the page to apply.</span>
          )}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://your-rpc-url"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && draft.trim() && !isChecking) handleSave();
          }}
          disabled={isChecking}
        />
        <Button
          onClick={handleSave}
          disabled={!draft.trim() || isChecking}
          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
        >
          {isChecking && <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />}
          {isChecking ? "Checking..." : "Save"}
        </Button>
        {saved && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-neutral-300 dark:border-neutral-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

export default function RpcSettingsCard({ className }: { className?: string }) {
  const { chains } = useConfig();

  return (
    <Card className={`${className ?? ""} flex flex-col gap-4 p-5`}>
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
          RPC
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Use your own if the public ones are slow or rate-limited. It stays in this browser: not
          in exports, and not removed by clearing the cache.
        </p>
      </div>
      {chains.map((chain) => (
        <RpcRow key={chain.id} chainId={chain.id} chainName={chain.name} />
      ))}
    </Card>
  );
}
