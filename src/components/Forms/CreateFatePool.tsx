"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress } from "viem";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { Info, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { FatePoolFactories } from "@/utils/addresses";

const DENOMINATOR = 100_000;

// Chain configuration for explorer URLs
const CHAIN_EXPLORERS: { [key: number]: string } = {
  1: "https://etherscan.io/tx/",
  11155111: "https://sepolia.etherscan.io/tx/",
};

// Helper function to get supported chain names
const getSupportedChains = (): string => {
  const chainNames: { [key: number]: string } = {
    1: "Ethereum Mainnet",
    11155111: "Sepolia Testnet",
  };
  
  return Object.keys(FatePoolFactories)
    .map(chainId => chainNames[Number(chainId)] || `Chain ${chainId}`)
    .join(", ");
};

type FormData = {
  poolName: string;
  baseTokenAddress: string;
  bullCoinName: string;
  bullCoinSymbol: string;
  bearCoinName: string;
  bearCoinSymbol: string;
  oracleAddress: string;
  priceFeedId: string;
  vaultFee: string;
  vaultCreatorFee: string;
  treasuryFee: string;
};

interface FieldConfig {
  id: keyof FormData;
  label: string;
  type: string;
  placeholder: string;
  description: string;
  validate: (value: string) => { isValid: boolean; errorMessage: string };
}

const fields: FieldConfig[] = [
  {
    id: "poolName",
    label: "Pool Name",
    type: "text",
    placeholder: "BTC Prediction Pool",
    description: "The name of your prediction pool (minimum 3 characters)",
    validate: (value) => ({
      isValid: value.length >= 3,
      errorMessage: "Pool name must be at least 3 characters long",
    }),
  },
  {
    id: "baseTokenAddress",
    label: "Base Token Address",
    type: "text",
    placeholder: "0x123......",
    description: "The contract address of the token being predicted (must be a valid Ethereum address)",
    validate: (value) => ({
      isValid: isAddress(value),
      errorMessage: "Please enter a valid Ethereum address",
    }),
  },
  {
    id: "bullCoinName",
    label: "Bull Coin Name",
    type: "text",
    placeholder: "BTC Bull Token",
    description: "Name for the bull position token (represents upward price movement)",
    validate: (value) => ({
      isValid: value.length >= 2,
      errorMessage: "Bull coin name must be at least 2 characters long",
    }),
  },
  {
    id: "bullCoinSymbol",
    label: "Bull Coin Symbol",
    type: "text",
    placeholder: "BULL",
    description: "Symbol for the bull position token (uppercase letters, max 4 characters)",
    validate: (value) => ({
      isValid: /^[A-Z]{1,4}$/.test(value),
      errorMessage: "Symbol must be 1-4 uppercase letters only",
    }),
  },
  {
    id: "bearCoinName",
    label: "Bear Coin Name",
    type: "text",
    placeholder: "BTC Bear Token",
    description: "Name for the bear position token (represents downward price movement)",
    validate: (value) => ({
      isValid: value.length >= 2,
      errorMessage: "Bear coin name must be at least 2 characters long",
    }),
  },
  {
    id: "bearCoinSymbol",
    label: "Bear Coin Symbol",
    type: "text",
    placeholder: "BEAR",
    description: "Symbol for the bear position token (uppercase letters, max 4 characters)",
    validate: (value) => ({
      isValid: /^[A-Z]{1,4}$/.test(value),
      errorMessage: "Symbol must be 1-4 uppercase letters only",
    }),
  },
  {
    id: "oracleAddress",
    label: "Oracle Address",
    type: "text",
    placeholder: "0xa....",
    description: "The contract address of the price oracle that will provide price data",
    validate: (value) => ({
      isValid: isAddress(value),
      errorMessage: "Please enter a valid oracle contract address",
    }),
  },
  {
    id: "priceFeedId",
    label: "Price Feed ID",
    type: "text",
    placeholder: "0xa......",
    description: "The 32-byte hex identifier for the price feed (66 characters including 0x)",
    validate: (value) => ({
      isValid: /^0x[a-fA-F0-9]{64}$/.test(value),
      errorMessage: "Must be a 32-byte hex string (66 characters including 0x)",
    }),
  },
  {
    id: "vaultFee",
    label: "Vault Fee (%)",
    type: "number",
    placeholder: "3.0",
    description: "Percentage fee charged by the vault on transactions (0-100%)",
    validate: (value) => {
      const num = parseFloat(value);
      return {
        isValid: !isNaN(num) && num >= 0 && num <= 100,
        errorMessage: "Must be a number between 0 and 100",
      };
    },
  },
  {
    id: "vaultCreatorFee",
    label: "Creator Fee (%)",
    type: "number",
    placeholder: "2.0",
    description: "Percentage fee that goes to the pool creator (0-100%)",
    validate: (value) => {
      const num = parseFloat(value);
      return {
        isValid: !isNaN(num) && num >= 0 && num <= 100,
        errorMessage: "Must be a number between 0 and 100",
      };
    },
  },
  {
    id: "treasuryFee",
    label: "Treasury Fee (%)",
    type: "number",
    placeholder: "0.5",
    description: "Percentage fee that goes to the protocol treasury (0-100%)",
    validate: (value) => {
      const num = parseFloat(value);
      return {
        isValid: !isNaN(num) && num >= 0 && num <= 100,
        errorMessage: "Must be a number between 0 and 100",
      };
    },
  },
];

export default function CreateFatePoolForm() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  
  // Get factory address for current chain
  const FACTORY_ADDRESS = currentChainId ? FatePoolFactories[currentChainId] : undefined;
  const isChainSupported = currentChainId ? Boolean(FatePoolFactories[currentChainId]) : false;
  const explorerUrl = currentChainId ? CHAIN_EXPLORERS[currentChainId] : undefined;

  const [formData, setFormData] = useState<FormData>({
    poolName: "",
    baseTokenAddress: "",
    bullCoinName: "",
    bullCoinSymbol: "",
    bearCoinName: "",
    bearCoinSymbol: "",
    oracleAddress: "",
    priceFeedId: "",
    vaultFee: "",
    vaultCreatorFee: "",
    treasuryFee: "",
  });

  const [validation, setValidation] = useState<Record<string, { isValid: boolean; errorMessage: string }>>({});
  const [showInfo, setShowInfo] = useState<Record<string, boolean>>({});

  const { 
    writeContract: deployPool, 
    data: deployData, 
    isPending: isSigning,
    error: writeError
  } = useWriteContract();

  const { 
    isLoading: isDeployingTx,
    isSuccess: isTransactionSuccess 
  } = useWaitForTransactionReceipt({ 
    hash: deployData 
  });

  const isDeploying = isSigning || isDeployingTx;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time validation
    const field = fields.find(f => f.id === name);
    if (field?.validate) {
      const validationResult = field.validate(value);
      setValidation(prev => ({ ...prev, [name]: validationResult }));
    }
  }, []);

  const toggleInfo = useCallback((fieldId: string) => {
    setShowInfo(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  }, []);

  const deployContract = useCallback(async () => {
    if (!FACTORY_ADDRESS) {
      toast.error("Factory address not found for this chain");
      return;
    }

    try {
      // Convert percentage fees to units (multiply by 1000 for basis points)
      const vaultFeeUnits = Math.round((parseFloat(formData.vaultFee) / 100) * DENOMINATOR);
      const creatorFeeUnits = Math.round((parseFloat(formData.vaultCreatorFee) / 100) * DENOMINATOR);
      const treasuryFeeUnits = Math.round((parseFloat(formData.treasuryFee) / 100) * DENOMINATOR);

      await deployPool({
        address: FACTORY_ADDRESS,
        abi: PredictionPoolFactoryABI,
        functionName: "createPool",
        args: [
          formData.poolName,
          formData.baseTokenAddress as `0x${string}`,
          vaultFeeUnits,
          creatorFeeUnits,
          treasuryFeeUnits,
          formData.oracleAddress as `0x${string}`,
          formData.priceFeedId as `0x${string}`,
        ],
      });
    } catch (error) {
      console.error("Error deploying pool:", error);
      toast.error("Failed to deploy prediction pool");
    }
  }, [formData, deployPool, FACTORY_ADDRESS]);

  // Handle transaction success
  useEffect(() => {
    if (isTransactionSuccess && deployData) {
      toast.success("Prediction pool created successfully!", {
        action: explorerUrl ? {
          label: "View on Explorer",
          onClick: () => window.open(`${explorerUrl}${deployData}`, "_blank"),
        } : undefined,
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/explorePools");
      }, 2000);
    }
  }, [isTransactionSuccess, deployData, router, explorerUrl]);

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      console.error("Transaction error:", writeError);
      toast.error("Transaction failed. Please try again.");
    }
  }, [writeError]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isChainSupported) {
      toast.error(`Please switch to a supported chain: ${getSupportedChains()}`);
      return;
    }

    // Validate all fields
    const newValidation: Record<string, { isValid: boolean; errorMessage: string }> = {};
    let isValid = true;

    fields.forEach(field => {
      const result = field.validate(formData[field.id]);
      newValidation[field.id] = result;
      if (!result.isValid) isValid = false;
    });

    // Validate total fees don't exceed 100%
    const totalFees = parseFloat(formData.vaultFee || "0") + 
                     parseFloat(formData.vaultCreatorFee || "0") + 
                     parseFloat(formData.treasuryFee || "0");

    if (totalFees > 100) {
      newValidation.feeValidation = {
        isValid: false,
        errorMessage: `Total fees cannot exceed 100% (current: ${totalFees.toFixed(2)}%)`,
      };
      isValid = false;
    } else if (newValidation.feeValidation) {
      // Clear fee validation if it was previously invalid
      delete newValidation.feeValidation;
    }

    setValidation(newValidation);

    if (isValid) {
      await deployContract();
    } else {
      toast.error("Please fix all validation errors before submitting");
    }
  }, [formData, deployContract, isConnected, isChainSupported]);

  // Show deployment progress
  if (isDeploying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Creating Your Prediction Pool
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {isSigning ? "Please confirm the transaction in your wallet..." : "Deploying contract to blockchain..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 py-12">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              Create Prediction Pool
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center mt-2">
              Deploy a new prediction market for any asset
            </p>
          </div>

          <div className="p-8">
            {!isConnected ? (
              <div className="text-center space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Please connect your wallet to create a prediction pool
                    </p>
                  </div>
                </div>
                <ConnectButton />
              </div>
            ) : !isChainSupported ? (
              <div className="text-center space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-yellow-500" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Unsupported Chain
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Please switch to one of the supported chains to create a prediction pool:
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {getSupportedChains()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {fields.map(field => (
                    <div key={field.id} className={field.id === 'poolName' ? 'md:col-span-2' : ''}>
                      <Label htmlFor={field.id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {field.label}
                        {(['poolName', 'baseTokenAddress', 'bullCoinName', 'bullCoinSymbol', 'bearCoinName', 'bearCoinSymbol', 'oracleAddress', 'priceFeedId'].includes(field.id)) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id={field.id}
                          name={field.id}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.id]}
                          onChange={handleChange}
                          className={`w-full transition-colors ${
                            validation[field.id]?.isValid === false 
                              ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500" 
                              : "border-gray-300 dark:border-gray-600 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleInfo(field.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      {(showInfo[field.id] || validation[field.id]?.isValid === false) && (
                        <p className={`text-sm mt-2 ${
                          validation[field.id]?.isValid === false 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {validation[field.id]?.isValid === false
                            ? validation[field.id]?.errorMessage
                            : field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {validation.feeValidation?.isValid === false && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      ⚠️ {validation.feeValidation.errorMessage}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Creating a prediction pool will deploy a new smart contract. 
                    Make sure all information is correct before submitting as it cannot be changed later.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/explorePools")}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isDeploying}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Pool"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}