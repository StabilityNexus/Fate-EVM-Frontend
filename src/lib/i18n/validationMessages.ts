export const validationMessages = {
  createPool: {
    poolNameRequired: "Pool name is required",
    baseTokenAddressRequired: "Base token address is required",
    invalidEthAddressFormat: "Invalid Ethereum address format",
    initialDepositInvalid: "Initial deposit must be a valid number",
    initialDepositNegative: "Initial deposit cannot be negative",
    chainlinkPriceFeedRequired: "Please select a Chainlink price feed",
    hebeswapPairRequired: "Hebeswap pair address is required",
    hebeswapPairInvalid: "Invalid Hebeswap pair address format",
    quoteTokenAddressRequired: "Quote token address is required",
    quoteTokenAddressInvalid: "Invalid quote token address format",
    bullCoinNameRequired: "Bull coin name is required",
    bullCoinSymbolRequired: "Bull coin symbol is required",
    bearCoinNameRequired: "Bear coin name is required",
    bearCoinSymbolRequired: "Bear coin symbol is required",
    invalidFeeValue: "Invalid fee value",
    positiveFeeRequired: "must be a positive number",
    totalFeesTooHigh: "Total fees must be less than 100%",
  },
} as const;

