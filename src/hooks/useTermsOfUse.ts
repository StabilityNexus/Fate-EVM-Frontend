"use client"

import { useState, useEffect } from "react";

export const TERMS_RAW_URL = "https://raw.githubusercontent.com/StabilityNexus/Info/main/TermsOfUse.md";
export const TERMS_PAGE_URL = "https://github.com/StabilityNexus/Info/blob/main/TermsOfUse.md";

// Re-acceptance is required when the document version changes, and at least
// once every REACCEPT_DAYS regardless, as a reminder (Bruno, 2026-09-09).
export const TERMS_REACCEPT_DAYS = 21;

const STORAGE_KEY = "fate-terms-of-use-accepted";
const DAY_MS = 24 * 60 * 60 * 1000;

interface StoredAcceptance {
  version: string | null;
  acceptedAt: string;
}

// The document carries its version as a "**Version 2.98**" line near the top.
const parseVersion = (markdown: string) => markdown.match(/^\*\*Version ([^*]+)\*\*/m)?.[1].trim() ?? null;

const readStored = (): StoredAcceptance | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.acceptedAt === "string" ? parsed : null;
  } catch {
    return null;
  }
};

const needsAcceptance = (stored: StoredAcceptance | null, currentVersion: string | null) => {
  if (!stored) return true;
  if (Date.now() - Date.parse(stored.acceptedAt) >= TERMS_REACCEPT_DAYS * DAY_MS) return true;
  // If either version is unknown, the fetch failed; fall back to the time rule alone.
  return currentVersion !== null && stored.version !== null && stored.version !== currentVersion;
};

export function useTermsOfUse() {
  const [content, setContent] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(TERMS_RAW_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const currentVersion = parseVersion(text);
        setContent(text);
        setVersion(currentVersion);
        const required = needsAcceptance(readStored(), currentVersion);
        setAccepted(!required);
        setShowTerms(required);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.warn("Failed to fetch Terms of Use:", error);
        setFetchFailed(true);
        const required = needsAcceptance(readStored(), null);
        setAccepted(!required);
        setShowTerms(required);
      });
    return () => controller.abort();
  }, []);

  const acceptTerms = () => {
    setAccepted(true);
    setShowTerms(false);
    try {
      const stored: StoredAcceptance = {
        version: version ?? readStored()?.version ?? null,
        acceptedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.warn("Failed to persist Terms of Use acceptance:", error);
    }
  };

  const openTerms = () => setShowTerms(true);
  const closeTerms = () => setShowTerms(false);

  return { showTerms, content, fetchFailed, accepted, acceptTerms, openTerms, closeTerms };
}
