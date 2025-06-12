import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletButton() {
    return (
        <div className="flex justify-end items-center p-4">
            <ConnectButton
                showBalance={false}
                accountStatus="address"
                chainStatus="icon"
            />
        </div>
    );
}
