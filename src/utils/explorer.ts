// Explorer utility for Fate-EVM-Frontend platform
// Supporting only: Sepolia

export const getExplorerUrl = (hash: `0x${string}`, chainId: number): string => {
  const baseUrls: { [key: number]: string } = {
    11155111: "https://sepolia.etherscan.io/tx/", // Sepolia Testnet
  };

  const baseUrl = baseUrls[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return `${baseUrl}${hash}`;
};

// Helper function to get explorer URL for addresses (not transactions)
export const getAddressExplorerUrl = (address: `0x${string}`, chainId: number): string => {
  const baseUrls: { [key: number]: string } = {
    11155111: "https://sepolia.etherscan.io/address/", // Sepolia Testnet
  };

  const baseUrl = baseUrls[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return `${baseUrl}${address}`;
};
