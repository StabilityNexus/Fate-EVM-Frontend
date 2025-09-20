// Explorer utility for Fate-EVM-Frontend platform
// Supporting only: Ethereum, Polygon, BSC, Base, Sepolia

export const getExplorerUrl = (hash: `0x${string}`, chainId: number): string => {
  const baseUrls: { [key: number]: string } = {
    1: "https://etherscan.io/tx/",           // Ethereum Mainnet
    137: "https://polygonscan.com/tx/",      // Polygon
    56: "https://bscscan.com/tx/",           // BSC Mainnet
    8453: "https://basescan.org/tx/",        // Base Mainnet
    11155111: "https://sepolia.etherscan.io/tx/", // Sepolia Testnet
    61: "https://etc.blockscout.com/tx/",    // Ethereum Classic
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
    1: "https://etherscan.io/address/",      // Ethereum Mainnet
    137: "https://polygonscan.com/address/", // Polygon
    56: "https://bscscan.com/address/",      // BSC Mainnet
    8453: "https://basescan.org/address/",   // Base Mainnet
    11155111: "https://sepolia.etherscan.io/address/", // Sepolia Testnet
    61: "https://etc.blockscout.com/address/", // Ethereum Classic
  };

  const baseUrl = baseUrls[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return `${baseUrl}${address}`;
};
