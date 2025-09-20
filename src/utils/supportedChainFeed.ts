// Supported chains configuration with price feed options
export const CHAIN_PRICE_FEED_OPTIONS: Record<number, { address: string; name: string }[]> = {
  // Ethereum Mainnet
  1: [
    { address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", name: "ETH / USD" },
    { address: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", name: "BTC / USD" },
    { address: "0x14e613AC84a31f709eadbdF89C6CC390fDc9540A", name: "BNB / USD" },
    { address: "0x4ffC43a60e009B551865A93d232E33Fce9f01507", name: "SOL / USD" },
    { address: "0xFF3EEb22B5E3dE6e705b44749C2559d704923FD7", name: "AVAX / USD" },
  ],
  // Polygon
  137: [
    { address: "0xF9680D99D6C9589e2a93a78A04A279e509205945", name: "ETH / USD" },
    { address: "0xc907E116054Ad103354f2D350FD2514433D57F6f", name: "BTC / USD" },
    { address: "0x82a6c4AF830caa6c97bb504425f6A66165C2c26e", name: "BNB / USD" },
    { address: "0x882554df528115a743c4537828DA8D5B58e52544", name: "ADA / USD" },
    { address: "0x10C8264C0935b3B9870013e057f330Ff3e9C56dC", name: "SOL / USD" },
  ],
  // Sepolia Testnet
  11155111: [
    { address: "0x694AA1769357215DE4FAC081bf1f309aDC325306", name: "ETH / USD" },
    { address: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", name: "BTC / USD" },
    { address: "0xB0C712f98daE15264c8E26132BCC91C40aD4d5F9", name: "AUD / USD" },
  ],
  // Base Mainnet (Chain ID: 8453)
  8453: [
    { address: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", name: "ETH / USD" },
    { address: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F", name: "BTC / USD" },
    { address: "0x4b7836916781CAAfbb7Bd1E5FDd20ED544B453b1", name: "BNB / USD" },
    { address: "0x34cD971a092d5411bD69C10a5F0A7EEF72C69041", name: "ADA / USD" },
    { address: "0x975043adBb80fc32276CbF9Bbcfd4A601a12462D", name: "SOL / USD" },
  ],
  // BSC Mainnet (Chain ID: 56)
  56: [
    { address: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e", name: "ETH / USD" },
    { address: "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf", name: "BTC / USD" },
    { address: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE", name: "BNB / USD" },
    { address: "0xa767f745331D267c7751297D982b050c93985627", name: "ADA / USD" },
    { address: "0x0E8a53DD9c13589df6382F13dA6B3Ec8F919B323", name: "SOL / USD" },
  ],
  // Ethereum Classic (Chain ID: 61)
  61: [
    { address: "0x0000000000000000000000000000000000000000", name: "ETH / USD" }, // Update with actual address
    { address: "0x0000000000000000000000000000000000000000", name: "BTC / USD" }, // Update with actual address
    { address: "0x0000000000000000000000000000000000000000", name: "ETC / USD" }, // Update with actual address
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
  
  // For unknown oracles, try to make an educated guess based on common patterns
  // Most prediction pools use ETH/USD as the underlying asset
  if (address && address.length === 42 && address.startsWith('0x')) {
    return "ETH / USD"; // Default to ETH/USD for unknown oracles
  }
  
  // Return a more user-friendly message for invalid addresses
  return `Unknown Oracle (${address.slice(0, 6)}...${address.slice(-4)})`;
};

// Helper function to check if a chain is supported
export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAINS.includes(chainId);
};

// Get price feed options for a specific chain
export const getPriceFeedOptions = (chainId: number) => {
  return CHAIN_PRICE_FEED_OPTIONS[chainId] || [];
};