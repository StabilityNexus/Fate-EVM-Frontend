export interface FormData {
  poolName: string;
  baseTokenAddress: string;
  oracleType: 'chainlink';
  priceFeedAddress: string;
  bullCoinName: string;
  bullCoinSymbol: string;
  bearCoinName: string;
  bearCoinSymbol: string;
  creatorAddress: string;
  mintFee: string;
  burnFee: string;
  creatorFee: string;
  treasuryFee: string;
  initialDeposit: string;
  quoteTokenAddress?: string; 
  oracleDescription?: string; 
};