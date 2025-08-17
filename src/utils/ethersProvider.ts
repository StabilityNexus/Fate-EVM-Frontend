import { ethers } from "ethers";
import {PredictionPoolABI} from "./abi/PredictionPool";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_POOL_ADDRESS!;

export function getPredictionPoolContract() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Contract(CONTRACT_ADDRESS, PredictionPoolABI, provider);
  } catch (error) {
    console.error('Failed to create prediction pool contract:', error);
    throw new Error('Unable to initialize prediction pool contract');
  }
}
