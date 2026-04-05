import { useCallback, useEffect, useRef } from 'react';
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useBalance,
  type Connector,
} from 'wagmi';
import {
  getChainMeta,
  isSupportedChain,
  UNKNOWN_CHAIN_LABEL,
  type ChainMeta,
} from '../lib/chains';
import {
  logWalletEvent,
  logWalletDebug,
  logWalletError,
  WalletEvent,
} from '../lib/walletLogger';
import { getAddressExplorerUrl } from '../utils/explorer';

export interface WalletConnectionState {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  status: 'connected' | 'reconnecting' | 'connecting' | 'disconnected';
  connector: Connector | undefined;
  
  chainId: number;
  
  connectors: readonly Connector[];
  isConnectPending: boolean;
  connectError: Error | null;
  
  isSwitchPending: boolean;
  switchError: Error | null;
  
  balanceData: ReturnType<typeof useBalance>['data'];
  
  networkState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED_SUPPORTED' | 'CONNECTED_UNSUPPORTED' | 'CONNECTED_UNKNOWN';
  isOnSupportedChain: boolean;
  isOnUnsupportedChain: boolean;
  isOnUnknownChain: boolean;
  currentChainMeta: ChainMeta | null;
  currentChainLabel: string;
  truncatedAddress: string;
  explorerAddressUrl: string | null;
  
  handleConnect: (connector: Connector) => void;
  handleDisconnect: () => void;
  handleSwitchChain: (targetChainId: number) => void;
}

export function useWalletConnection(): WalletConnectionState {
  // Wagmi hooks
  const {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    status,
    connector,
  } = useAccount();

  const chainId = useChainId();
  const { connect, connectors, isPending: isConnectPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain();
  const { data: balanceData } = useBalance({ address });

  // Computed state
  const isOnSupportedChain = isSupportedChain(chainId);
  const currentChainMeta = getChainMeta(chainId);
  const isOnUnknownChain = isConnected && !isOnSupportedChain && currentChainMeta === null;
  const isOnUnsupportedChain = isConnected && !isOnSupportedChain && currentChainMeta !== null;
  
  const networkState: WalletConnectionState['networkState'] = !isConnected && !isConnecting 
    ? 'DISCONNECTED'
    : isConnecting ? 'CONNECTING'
    : isOnSupportedChain ? 'CONNECTED_SUPPORTED'
    : isOnUnknownChain ? 'CONNECTED_UNKNOWN'
    : 'CONNECTED_UNSUPPORTED';

  const currentChainLabel = currentChainMeta?.name ?? UNKNOWN_CHAIN_LABEL;

  const truncatedAddress = address 
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` 
    : '';

  const explorerAddressUrl = (() => {
    if (!address) return null;
    try {
      return getAddressExplorerUrl(address, chainId);
    } catch {
      if (currentChainMeta?.explorerBaseUrl) {
        return `${currentChainMeta.explorerBaseUrl}/address/${address}`;
      }
      return null;
    }
  })();

  // Track previous connection state to detect disconnects accurately
  const prevIsConnected = useRef(isConnected);
  const prevAddress = useRef(address);

  // Watch Connection state
  useEffect(() => {
    if (isConnected && !prevIsConnected.current) {
      logWalletEvent(WalletEvent.CONNECT_SUCCESS, { 
        address: address ?? 'undefined', 
        connectorId: connector?.id ?? 'unknown', 
        chainId 
      });
      logWalletDebug('useAccount post-connect', { 
        account: address, 
        connector: connector?.id 
      });
    }

    if (!isConnected && prevIsConnected.current) {
      logWalletEvent(WalletEvent.DISCONNECT_SUCCESS, { 
        previousAddress: prevAddress.current ?? 'undefined' 
      });
    }

    prevIsConnected.current = isConnected;
    if (address !== undefined) {
      prevAddress.current = address;
    }
  }, [isConnected, address, connector, chainId]);

  const prevChainId = useRef(chainId);

  useEffect(() => {
    if (chainId && chainId !== prevChainId.current) {
      prevChainId.current = chainId;
    }
  }, [chainId]);

  // Watch Connect errors
  useEffect(() => {
    if (connectError) {
      logWalletError(WalletEvent.CONNECT_FAILED, connectError);
      logWalletDebug('connect error detail', { error: connectError });
    }
  }, [connectError]);

  // Watch Connect errors

  // Actions
  const handleConnect = useCallback((targetConnector: Connector) => {
    logWalletEvent(WalletEvent.CONNECT_INITIATED, { 
      connectorId: targetConnector.id, 
      connectorName: targetConnector.name 
    });
    logWalletDebug('handleConnect', { connector: targetConnector });
    connect({ connector: targetConnector });
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    logWalletEvent(WalletEvent.DISCONNECT_INITIATED, { 
      address: address ?? 'unknown', 
      connectorId: connector?.id ?? 'unknown' 
    });
    disconnect();
  }, [address, connector?.id, disconnect]);

  const handleSwitchChain = useCallback(async (targetChainId: number) => {
    if (!isSupportedChain(targetChainId)) {
      logWalletError(WalletEvent.CHAIN_SWITCH_FAILED, new Error(`Unallowed attempt to switch to unsupported chain: ${targetChainId}`));
      return;
    }

    logWalletEvent(WalletEvent.CHAIN_SWITCH_INITIATED, {
      targetChainId,
      currentChainId: chainId,
    });

    try {
      if (switchChain) {
        // useSwitchChain returns switchChain to just trigger mutation, Wagmi V2 exposes switchChainAsync
        switchChain({ chainId: targetChainId });
      }
    } catch (e: unknown) {
      logWalletError(WalletEvent.CHAIN_SWITCH_FAILED, e);
    }
  }, [chainId, switchChain]);

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    status,
    connector,
    
    chainId,
    
    connectors,
    isConnectPending,
    connectError,
    
    isSwitchPending,
    switchError,
    
    balanceData,
    
    networkState,
    isOnSupportedChain,
    isOnUnsupportedChain,
    isOnUnknownChain,
    currentChainMeta,
    currentChainLabel,
    truncatedAddress,
    explorerAddressUrl,
    
    handleConnect,
    handleDisconnect,
    handleSwitchChain,
  };
}
