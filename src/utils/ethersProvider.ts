import { ethers } from "ethers";
import {PredictionPoolABI} from "./abi/PredictionPool";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_POOL_ADDRESS!;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const predictionPoolContract = new ethers.Contract(CONTRACT_ADDRESS, PredictionPoolABI, provider);

export function getPredictionPoolContract() {
  return predictionPoolContract;
}
