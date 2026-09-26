'use client';
import { WalletLinkButton } from '@stability-nexus/walletlink';

export default function WalletButton() {
    return (
        <div className="flex justify-end items-center">
            <WalletLinkButton label="Connect Wallet" />
        </div>
    );
}
