import { type Connector } from 'wagmi';

export interface WalletInfo {
  name: string;
  logo: string;
}


const WALLET_MAP: Record<string, WalletInfo> = {
  // MetaMask (SDK + injected EIP-6963 variant)
  metamask: {
    name: 'MetaMask',
    logo: '/wallets/metamask.svg',
  },
  metaMask: {
    name: 'MetaMask',
    logo: '/wallets/metamask.svg',
  },
  metaMaskSDK: {
    name: 'MetaMask',
    logo: '/wallets/metamask.svg',
  },
  'io.metamask': {
    name: 'MetaMask',
    logo: '/wallets/metamask.svg',
  },


  // Coinbase Wallet
  coinbaseWalletSDK: {
    name: 'Coinbase Wallet',
    logo: '/wallets/cbw.svg',
  },
  coinbaseWallet: {
    name: 'Coinbase Wallet',
    logo: '/wallets/cbw.svg',
  },
  'com.coinbase.wallet': {
    name: 'Coinbase Wallet',
    logo: '/wallets/cbw.svg',
  },

  // Rabby Wallet
  rabby: {
    name: 'Rabby Wallet',
    logo: '/wallets/rabby.svg',
  },
  'io.rabby': {
    name: 'Rabby Wallet',
    logo: '/wallets/rabby.svg',
  },

  // Phantom
  phantom: {
    name: 'Phantom',
    logo: '/wallets/Phantom.svg',
  },
  'app.phantom': {
    name: 'Phantom',
    logo: '/wallets/Phantom.svg',
  },

  // Brave
  brave: {
    name: 'Brave Wallet',
    logo: '/wallets/brave.svg',
  },
  'com.brave.wallet': {
    name: 'Brave Wallet',
    logo: '/wallets/brave.svg',
  },

  // Backpack
  backpack: {
    name: 'Backpack',
    logo: '/wallets/backpack.png',
  },
  'app.backpack': {
    name: 'Backpack',
    logo: '/wallets/backpack.png',
  },

  // CTRL / XDEFI
  ctrl: {
    name: 'CTRL Wallet',
    logo: '/wallets/ctrl.svg',
  },
  xdefi: {
    name: 'CTRL Wallet',
    logo: '/wallets/ctrl.svg',
  },
  'io.xdefi': {
    name: 'CTRL Wallet',
    logo: '/wallets/ctrl.svg',
  },

  // Generic injected (catch-all fallthrough)
  injected: {
    name: 'Browser Wallet',
    logo: '/wallets/injected.svg',
  },
};

/**
 * Resolve display info for a wagmi Connector.
 *
 * Priority:
 * 1. Exact id match (WALLET_MAP[connector.id])
 * 2. Lowercased substring match (WALLET_MAP key is in id, or id is in key)
 * 3. Graceful unknown-connector fallback (generic icon, connector.name)
 */
export const getWalletInfo = (connector: Connector): WalletInfo => {
  // 1. Exact match
  if (WALLET_MAP[connector.id]) return WALLET_MAP[connector.id];

  const normalizedId = connector.id.toLowerCase();

  // 2. Substring match (handles "io.metamask.metamask", etc.)
  for (const [key, value] of Object.entries(WALLET_MAP)) {
    const normalizedKey = key.toLowerCase();
    if (normalizedId.includes(normalizedKey)) {
      return value;
    }
  }

  // 3. Fallback — never crashes
  return {
    name: connector.name || 'Unknown Wallet',
    logo: '/wallets/injected.svg',
  };
};
