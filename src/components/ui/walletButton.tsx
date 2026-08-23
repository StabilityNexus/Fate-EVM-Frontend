'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const COPIED_FEEDBACK_DURATION = 2000;

type CopyStatus = 'idle' | 'copied' | 'error';
type CopyRequest = { address: string };

function copyTextWithFallback(text: string) {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);

    try {
        textArea.select();
        if (!document.execCommand('copy')) {
            throw new Error('Copy command was rejected');
        }
    } finally {
        textArea.remove();
    }
}

export default function WalletButton() {
    const { address } = useAccount();
    const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
    const latestAddressRef = useRef(address);
    const activeCopyRequestRef = useRef<CopyRequest | null>(null);
    const isMountedRef = useRef(false);
    const resetTimerRef = useRef<number | null>(null);

    if (latestAddressRef.current !== address) {
        latestAddressRef.current = address;
        activeCopyRequestRef.current = null;
    }

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            activeCopyRequestRef.current = null;

            if (resetTimerRef.current !== null) {
                window.clearTimeout(resetTimerRef.current);
                resetTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        setCopyStatus('idle');

        if (resetTimerRef.current !== null) {
            window.clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
    }, [address]);

    const showTemporaryStatus = (status: Exclude<CopyStatus, 'idle'>) => {
        if (resetTimerRef.current !== null) {
            window.clearTimeout(resetTimerRef.current);
        }

        setCopyStatus(status);
        resetTimerRef.current = window.setTimeout(() => {
            setCopyStatus('idle');
            resetTimerRef.current = null;
        }, COPIED_FEEDBACK_DURATION);
    };

    const handleCopyAddress = async () => {
        const requestedAddress = address;
        if (!requestedAddress) return;

        const copyRequest: CopyRequest = { address: requestedAddress };
        activeCopyRequestRef.current = copyRequest;

        const isCurrentRequest = () =>
            isMountedRef.current &&
            activeCopyRequestRef.current === copyRequest &&
            latestAddressRef.current === copyRequest.address;

        try {
            await copyTextWithFallback(copyRequest.address);
            if (isCurrentRequest()) {
                showTemporaryStatus('copied');
            }
        } catch {
            if (isCurrentRequest()) {
                showTemporaryStatus('error');
            }
        }
    };

    const copied = copyStatus === 'copied';
    const copyFailed = copyStatus === 'error';

    return (
        <div className="flex items-center justify-end gap-2">
            <ConnectButton
                showBalance={false}
                accountStatus="address"
                chainStatus="icon"
                label="Connect Wallet"
            />

            {address && (
                <>
                    <button
                        type="button"
                        onClick={() => void handleCopyAddress()}
                        aria-label={
                            copied
                                ? 'Wallet address copied'
                                : copyFailed
                                  ? 'Unable to copy wallet address'
                                  : 'Copy wallet address'
                        }
                        title={copied ? 'Copied!' : copyFailed ? 'Copy failed' : 'Copy wallet address'}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        {copied ? (
                            <Check aria-hidden="true" size={16} />
                        ) : (
                            <Copy aria-hidden="true" size={16} />
                        )}
                    </button>

                    <span
                        className={
                            copyFailed
                                ? 'text-sm text-red-700 dark:text-red-400'
                                : 'text-sm text-green-700 dark:text-green-400'
                        }
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {copied ? 'Copied!' : copyFailed ? 'Unable to copy' : ''}
                    </span>
                </>
            )}
        </div>
    );
}
