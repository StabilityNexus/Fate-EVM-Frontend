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
  initialDeposit: string;
  leverage: string;
  quoteTokenAddress?: string; 
  oracleDescription?: string; 
};