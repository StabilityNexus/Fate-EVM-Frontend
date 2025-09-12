'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletButton() {
    return (
        <div className="flex justify-end items-center">
            <ConnectButton
                showBalance={false}
                accountStatus="address"
                chainStatus="icon"
                label="Connect Wallet"
            />
        </div>
    );
}
