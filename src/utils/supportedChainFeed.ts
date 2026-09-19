// Supported chains configuration with price feed options
export const CHAIN_PRICE_FEED_OPTIONS: Record<number, { address: string; name: string }[]> = {
  // Sepolia Testnet
  11155111: [
    { address: "0x694AA1769357215DE4FAC081bf1f309aDC325306", name: "ETH / USD" },
    { address: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", name: "BTC / USD" },
    { address: "0xB0C712f98daE15264c8E26132BCC91C40aD4d5F9", name: "AUD / USD" },
  ],
};

// Get all supported chain IDs
export const SUPPORTED_CHAINS = Object.keys(CHAIN_PRICE_FEED_OPTIONS).map(Number);

// Helper function to get price feed name by address and chain ID
export const getPriceFeedName = (address: string, chainId: number): string => {
  const chainFeeds = CHAIN_PRICE_FEED_OPTIONS[chainId];

  if (chainFeeds) {
    const feed = chainFeeds.find(feed => feed.address.toLowerCase() === address.toLowerCase());
    if (feed) {
      return feed.name;
    }
  }

  // Stable sentinel: callers compare against it. Never guess a name from the address.
  return "Unknown";
};

// Helper function to check if a chain is supported
export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAINS.includes(chainId);
};

// Get price feed options for a specific chain
export const getPriceFeedOptions = (chainId: number) => {
  return CHAIN_PRICE_FEED_OPTIONS[chainId] || [];
};