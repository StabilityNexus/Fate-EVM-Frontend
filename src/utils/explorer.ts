// Explorer utility for Fate-EVM-Frontend
// Supported chains: Ethereum Classic (61), Sepolia (11155111)

const TX_EXPLORER_URLS: Record<number, string> = {
  11155111: 'https://sepolia.etherscan.io/tx/',   // Sepolia Testnet
  61:       'https://etc.blockscout.com/tx/',      // Ethereum Classic
};

const ADDRESS_EXPLORER_URLS: Record<number, string> = {
  11155111: 'https://sepolia.etherscan.io/address/',  // Sepolia Testnet
  61:       'https://etc.blockscout.com/address/',    // Ethereum Classic
};

/**
 * Returns the block-explorer URL for a transaction hash on the given chain,
 * or `null` if the chain is not in the supported list.
 *
 * Callers must handle the `null` case (e.g. hide the link).
 */
export const getExplorerUrl = (
  hash: `0x${string}`,
  chainId: number,
): string | null => {
  const baseUrl = TX_EXPLORER_URLS[chainId];
  if (!baseUrl) return null;
  return `${baseUrl}${hash}`;
};

/**
 * Returns the block-explorer URL for an address on the given chain,
 * or `null` if the chain is not in the supported list.
 *
 * Callers must handle the `null` case (e.g. hide the link).
 */
export const getAddressExplorerUrl = (
  address: `0x${string}`,
  chainId: number,
): string | null => {
  const baseUrl = ADDRESS_EXPLORER_URLS[chainId];
  if (!baseUrl) return null;
  return `${baseUrl}${address}`;
};
