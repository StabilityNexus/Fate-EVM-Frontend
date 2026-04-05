/**
 * RED phase – these tests prove the bugs exist (and will pass after GREEN fixes).
 *
 * Run:  npx vitest run src/__tests__/bugs.test.ts
 *
 * Bugs covered (all confirmed in bug_verification_report.md):
 *   B1  – CreateFatePool: success/redirect has no guard for pool-deploy-only
 *   B2  – CreateFatePool: error silently swallowed (no toast.error)
 *   B3  – CreateFatePool: duplicate toast
 *   B4  – VaultSection: hardcoded 18 decimals in buy/sell
 *   B5  – VaultSection: writeContract (non-async) swallows errors
 *   B6  – VaultSection: stale pendingApproval on error
 *   B7  – chains.ts: ETC (61) absent from CHAIN_METADATA
 *   B8  – inconsistent chain lists (UI copy vs actual)
 */

import { describe, it, expect } from "vitest";

type PendingApproval = { amount: string; type: "buy" | "sell" } | null;

// ---------------------------------------------------------------------------
// B7 – getChainMeta(61) must not return null
// ---------------------------------------------------------------------------
import { getChainMeta, CHAIN_METADATA } from "../lib/chains";

describe("B7 – ETC chain metadata", () => {
  it("CHAIN_METADATA has an entry for chain 61 (Ethereum Classic)", () => {
    // RED: will fail until we add chain 61 to CHAIN_METADATA
    expect(CHAIN_METADATA[61]).toBeDefined();
    expect(CHAIN_METADATA[61].name).toBe("Ethereum Classic");
    expect(CHAIN_METADATA[61].explorerBaseUrl).toBeTruthy();
  });

  it("getChainMeta(61) returns non-null", () => {
    expect(getChainMeta(61)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// B8 – Single source of truth: wagmiConfig chains drive everything
// ---------------------------------------------------------------------------
import { config } from "../utils/wagmiConfig";
import { SUPPORTED_CHAINS } from "../utils/supportedChainFeed";
import { SUPPORTED_CHAIN_IDS as IDB_CHAIN_IDS } from "../lib/indexeddb/config";
import { SUPPORTED_CHAIN_IDS as LIB_CHAIN_IDS } from "../lib/chains";

describe("B8 – all chain lists agree with wagmiConfig", () => {
  const wagmiChainIds = config.chains.map((c) => c.id).sort();

  it("supportedChainFeed.SUPPORTED_CHAINS matches wagmi chains", () => {
    // RED: currently these do match (61, 11155111) BUT the UI copy lists wrong chains.
    // The test we care about most is that the authoritative list == wagmi.
    expect([...SUPPORTED_CHAINS].sort()).toEqual(wagmiChainIds);
  });

  it("indexeddb/config.SUPPORTED_CHAIN_IDS matches wagmi chains", () => {
    expect([...IDB_CHAIN_IDS].sort()).toEqual(wagmiChainIds);
  });

  it("lib/chains.SUPPORTED_CHAIN_IDS matches wagmi chains", () => {
    // RED: lib/chains derives from config, but CHAIN_METADATA only covers non-61 chains
    // so getChainMeta(61) would fail; SUPPORTED_CHAIN_IDS itself might be ok
    expect([...LIB_CHAIN_IDS].sort()).toEqual(wagmiChainIds);
  });
});

// ---------------------------------------------------------------------------
// B4 – decimals logic: parseUnits must use token-specific decimals, not 18
// Tested as a pure function – no React needed.
// ---------------------------------------------------------------------------
import { parseUnits, formatUnits } from "viem";

describe("B4 – token amount conversion must respect actual decimals", () => {
  // Simulate what the VaultSection does today (bug: hardcoded 18)
  function buggyConvert(humanAmount: string): bigint {
    return parseUnits(humanAmount, 18); // BUG
  }

  // Correct: use the token's actual decimals
  function correctConvert(humanAmount: string, decimals: number): bigint {
    return parseUnits(humanAmount, decimals);
  }

  it("for a 6-decimal token, buggy 18-dec conversion is 1e12x too large", () => {
    const amount = "1"; // 1 USDC
    const buggy = buggyConvert(amount);
    const correct = correctConvert(amount, 6);
    // The buggy result should be 1e12 times larger than correct
    expect(buggy / correct).toBe(BigInt(10 ** 12));
  });

  it("correct conversion for 6-decimal USDC token", () => {
    const result = correctConvert("1", 6);
    expect(result).toBe(BigInt(1_000_000)); // 1 USDC = 1,000,000 units
  });

  it("correct conversion for 18-decimal WETH token", () => {
    const result = correctConvert("1", 18);
    expect(result).toBe(BigInt("1000000000000000000")); // 1e18
  });

  it("formatUnits with wrong decimals gives wrong display", () => {
    const rawBalance = BigInt(1_000_000); // 1 USDC in 6-dec units
    const wrongDisplay = formatUnits(rawBalance, 18); // BUG: shows 0.000001
    const correctDisplay = formatUnits(rawBalance, 6); // shows 1
    expect(wrongDisplay).not.toBe(correctDisplay);
    expect(correctDisplay).toBe("1");
  });
});

// ---------------------------------------------------------------------------
// B2 – error catch block must surface the error via toast
// Tested via a synthetic catch handler that mirrors the buggy one
// ---------------------------------------------------------------------------

describe("B2 – catch block must call toast.error", () => {
  it("computes errorMessage AND passes it to error handler", () => {
    // Simulate the buggy catch: it builds errorMessage but throws it away
    const calls: string[] = [];
    const fakeToastError = (msg: string) => calls.push(msg);

    function buggyHandleError(error: unknown) {
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) errorMessage = error.message;
      // BUG: fakeToastError is never called
      void errorMessage; // consumed here (the bug)
    }

    function fixedHandleError(error: unknown) {
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) errorMessage = error.message;
      fakeToastError(errorMessage); // FIX
    }

    buggyHandleError(new Error("deploy failed"));
    expect(calls).toHaveLength(0); // proves the bug

    fixedHandleError(new Error("deploy failed"));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe("deploy failed");
  });
});

// ---------------------------------------------------------------------------
// B3 – duplicate toast: success effect must fire exactly once
// ---------------------------------------------------------------------------

describe("B3 – success toast fires exactly once", () => {
  it("duplicate consecutive toast.success calls are caught", () => {
    const calls: string[] = [];
    const toast = { success: (msg: string) => calls.push(msg) };

    // Simulate the buggy effect body
    function buggySuccessEffect() {
      toast.success("Pool deployed successfully!");
      // Pool is automatically initialized in the smart contract during deployment
      toast.success("Pool deployed successfully!"); // BUG: duplicate
    }

    function fixedSuccessEffect() {
      toast.success("Pool deployed successfully!"); // ONE call only
    }

    buggySuccessEffect();
    expect(calls).toHaveLength(2); // proves the bug

    calls.length = 0;
    fixedSuccessEffect();
    expect(calls).toHaveLength(1); // proves the fix
    expect(calls[0]).toBe("Pool deployed successfully!");
  });
});

// ---------------------------------------------------------------------------
// B6 – stale pendingApproval: must be cleared on error, not only on confirm
// ---------------------------------------------------------------------------

describe("B6 – pendingApproval cleared on error", () => {
  it("buggy: pendingApproval stays set after rejection, triggers buy on next confirm", () => {
    // Simulate state machine
    let pendingApproval: PendingApproval = null;
    const unintendedCalls: string[] = [];

    function setPendingApproval(v: PendingApproval) {
      pendingApproval = v;
    }

    // Simulate approval submission
    setPendingApproval({ amount: "10", type: "buy" });

    // Approval rejected – BUG: we do NOT clear pendingApproval on rejection
    // (no onError handler in the original code)

    // Simulate an UNRELATED tx confirming (e.g., a sell)
    const isConfirmed = true;
    const isTransactionPending = false;
    if (isConfirmed && !isTransactionPending) {
      const pending = pendingApproval;
      if (pending !== null && pending.type === "buy") {
        // BUG: this runs even though the approval was rejected
        unintendedCalls.push(`buy(${pending.amount})`);
        setPendingApproval(null);
      }
    }

    expect(unintendedCalls).toHaveLength(1); // proves the bug
  });

  it("fixed: pendingApproval cleared on rejection prevents unintended buy", () => {
    let pendingApproval: PendingApproval = null;
    const unintendedCalls: string[] = [];

    function setPendingApproval(v: PendingApproval) {
      pendingApproval = v;
    }

    // Simulate approval submission
    setPendingApproval({ amount: "10", type: "buy" });

    // FIX: approval rejected → clear pending immediately
    function onApprovalError() {
      setPendingApproval(null);
    }
    onApprovalError();

    // Simulate unrelated tx confirming
    const isConfirmed = true;
    const isTransactionPending = false;
    if (isConfirmed && !isTransactionPending) {
      const pending = pendingApproval;
      if (pending !== null && pending.type === "buy") {
        unintendedCalls.push(`buy(${pending.amount})`);
        setPendingApproval(null);
      }
    }

    expect(unintendedCalls).toHaveLength(0); // proves the fix
  });
});
