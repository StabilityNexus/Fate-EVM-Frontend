"use client"

import { useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TERMS_PAGE_URL } from "@/hooks/useTermsOfUse";

interface TermsOfUseModalProps {
  isOpen: boolean;
  content: string | null;
  fetchFailed: boolean;
  accepted: boolean;
  onAccept: () => void;
  onClose: () => void;
}

const buttonStyles =
  "w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-500 dark:disabled:hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors shadow-lg";

const markdownStyles = [
  "text-sm leading-relaxed text-gray-700 dark:text-gray-300",
  "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 dark:[&_h1]:text-white",
  "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-gray-900 dark:[&_h2]:text-white",
  "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-gray-900 dark:[&_h3]:text-white",
  "[&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_li]:mb-1",
  "[&_a]:text-yellow-600 dark:[&_a]:text-yellow-400 [&_a]:underline [&_strong]:font-semibold",
].join(" ");

export default function TermsOfUseModal({
  isOpen,
  content,
  fetchFailed,
  accepted,
  onAccept,
  onClose,
}: TermsOfUseModalProps) {
  const titleId = useId();
  const checkboxId = useId();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    if (isOpen) setChecked(false);
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        <div className="bg-yellow-500 dark:bg-yellow-600 px-6 py-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-bold text-gray-900 dark:text-white">
            Terms of Use
          </h2>
          <a
            href={TERMS_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-900 dark:text-white underline hover:no-underline"
          >
            View on GitHub
          </a>
        </div>

        <div className="overflow-y-auto px-6 py-6 min-h-[12rem]">
          {fetchFailed ? (
            <p className="text-gray-700 dark:text-gray-300">
              The Terms of Use could not be loaded. Please read them at{" "}
              <a
                href={TERMS_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 dark:text-yellow-400 underline font-medium"
              >
                {TERMS_PAGE_URL}
              </a>
              .
            </p>
          ) : content === null ? (
            <p className="text-gray-500 dark:text-gray-400">Loading the Terms of Use...</p>
          ) : (
            <div className={markdownStyles}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {accepted ? (
            <button type="button" onClick={onClose} className={buttonStyles}>
              Close
            </button>
          ) : (
            <>
              <label
                htmlFor={checkboxId}
                className="flex items-start gap-3 cursor-pointer text-gray-900 dark:text-white"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-yellow-500"
                />
                <span>I have carefully read and I accept the Terms of Use.</span>
              </label>
              <button
                type="button"
                onClick={onAccept}
                disabled={!checked}
                className={buttonStyles}
              >
                Accept Terms of Use
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
