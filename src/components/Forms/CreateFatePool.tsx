"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import StepIndicator from "./Steps/StepIndicator";
import PoolConfigurationStep from "./Steps/PoolConfigurationStep";
import TokenConfigurationStep from "./Steps/TokenConfigurationStep";
import FeeConfigurationStep from "./Steps/FeeConfigurationStep";
import ReviewStep from "./Steps/ReviewStep";
import { FormData } from "./FormData";
import { toast } from "sonner";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { FatePoolFactories } from "@/utils/addresses";
import { SUPPORTED_CHAINS, getPriceFeedOptions } from "@/utils/supportedChainFeed";

const DENOMINATOR = 100_000;

// Type definitions for transaction receipt
interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
}

interface TransactionReceipt {
  logs?: TransactionLog[];
  status?: string;
  transactionHash?: string;
}

export default function CreateFatePool() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const currentChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitializing, setIsInitializing] = useState(false);

  const {
    writeContract: deployPool,
    data: deployData,
    isPending: isSigning,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  const {
    isLoading: isDeployingTx,
    isSuccess: isTransactionSuccess,
    error: receiptError,
    data: receiptData
  } = useWaitForTransactionReceipt({
    hash: deployData
  });

  const [formData, setFormData] = useState<FormData>({
    poolName: "",
    baseTokenAddress: "",
    priceFeedAddress: "",
    bullCoinName: "",
    bullCoinSymbol: "",
    bearCoinName: "",
    bearCoinSymbol: "",
    creatorAddress: address || "",
    vaultFee: "3.0",
    vaultCreatorFee: "2.0",
    treasuryFee: "0.5"
  });

  const stepTitles = useMemo(() => [
    "Pool Config",
    "Token Config", 
    "Fees",
    "Review",
  ], []);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => {
      const shouldUpdate = Object.keys(updates).some(
        key => prev[key as keyof FormData] !== updates[key as keyof FormData]
      );
      return shouldUpdate ? { ...prev, ...updates } : prev;
    });
  }, []);

  // Reset price feed when chain changes
  useEffect(() => {
    updateFormData({ priceFeedAddress: '' });
  }, [currentChainId, updateFormData]);

  // Update creator address when wallet changes
  useEffect(() => {
    if (address && formData.creatorAddress !== address) {
      updateFormData({ creatorAddress: address });
    }
  }, [address, formData.creatorAddress, updateFormData]);

  // Helper function to extract pool address from transaction logs
  const extractPoolAddressFromReceipt = useCallback((receipt: TransactionReceipt) => {
    try {
      if (receipt?.logs && receipt.logs.length > 0) {
        console.log('Transaction receipt logs:', receipt.logs);
        
        // TODO: Implement proper pool address extraction logic
        // This would typically involve decoding the event logs to find the pool creation event
        // For now, returning null as placeholder
        return null; // Return the actual pool address from logs
      }
      return null;
    } catch (error) {
      console.error('Error extracting pool address from receipt:', error);
      return null;
    }
  }, []);

  // Function to initialize the pool after deployment
  const initializeDeployedPool = useCallback(async (poolAddress: string) => {
    if (!walletClient) {
      console.error('Wallet client not available');
      toast.error('Wallet client not available for initialization');
      return;
    }

    setIsInitializing(true);
    
    try {
      // TODO: Implement pool initialization logic here
      // This would typically involve calling an initialization function on the deployed pool
      console.log('Initializing pool at address:', poolAddress);
      
      // Simulate initialization process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to explore pools after successful initialization
      const timer = setTimeout(() => router.push("/explorePools"), 2000);
      return () => clearTimeout(timer);
      
    } catch (error) {
      console.error('Pool initialization failed:', error);
      setIsInitializing(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('already initialized')) {
        toast.warning('Pool was already initialized');
        setIsSubmitting(false);
        const timer = setTimeout(() => router.push("/explorePools"), 2000);
        return () => clearTimeout(timer);
      } else {
        toast.error(`Pool initialization failed: ${errorMessage}`);
        // Still redirect since the pool was deployed successfully
        setIsSubmitting(false);
        const timer = setTimeout(() => router.push("/explorePools"), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [walletClient, router]);

  const validateCurrentStep = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.poolName.trim()) newErrors.poolName = "Pool name is required";
      if (!formData.baseTokenAddress.trim()) {
        newErrors.baseTokenAddress = "Base token address is required";
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.baseTokenAddress.trim())) {
        newErrors.baseTokenAddress = "Invalid Ethereum address format";
      }
      if (!formData.priceFeedAddress) {
        newErrors.priceFeedAddress = "Please select a price feed";
      }
    } else if (currentStep === 2) {
      if (!formData.bullCoinName.trim()) newErrors.bullCoinName = "Bull coin name is required";
      if (!formData.bullCoinSymbol.trim()) newErrors.bullCoinSymbol = "Bull coin symbol is required";
      if (!formData.bearCoinName.trim()) newErrors.bearCoinName = "Bear coin name is required";
      if (!formData.bearCoinSymbol.trim()) newErrors.bearCoinSymbol = "Bear coin symbol is required";
    } else if (currentStep === 3) {
      const vaultFee = parseFloat(formData.vaultFee);
      const vaultCreatorFee = parseFloat(formData.vaultCreatorFee);
      const treasuryFee = parseFloat(formData.treasuryFee);

      if (isNaN(vaultFee) || vaultFee < 0) newErrors.vaultFee = "Invalid fee value";
      if (isNaN(vaultCreatorFee) || vaultCreatorFee < 0) newErrors.vaultCreatorFee = "Invalid fee value";
      if (isNaN(treasuryFee) || treasuryFee < 0) newErrors.treasuryFee = "Invalid fee value";

      const totalFee = vaultFee + vaultCreatorFee + treasuryFee;
      if (totalFee >= 100) {
        newErrors.vaultFee = "Total fees must be less than 100%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, stepTitles.length));
    }
  }, [validateCurrentStep, stepTitles.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }

    if (!currentChainId) {
      toast.error("Please connect to a supported network");
      return;
    }

    const FACTORY_ADDRESS = FatePoolFactories[currentChainId];
    if (!FACTORY_ADDRESS) {
      toast.error("Factory address not found for this chain");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    resetWrite();
    
    try {
      const vaultFeeUnits = Math.floor((parseFloat(formData.vaultFee) / 100) * DENOMINATOR);
      const creatorFeeUnits = Math.floor((parseFloat(formData.vaultCreatorFee) / 100) * DENOMINATOR);
      const treasuryFeeUnits = Math.floor((parseFloat(formData.treasuryFee) / 100) * DENOMINATOR);

      const baseTokenAddress = formData.baseTokenAddress.trim();
      const priceFeedAddress = formData.priceFeedAddress.trim();

      await deployPool({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: PredictionPoolFactoryABI,
        functionName: "createPool",
        args: [
          formData.poolName.trim(),
          baseTokenAddress as `0x${string}`,
          BigInt(vaultFeeUnits),
          BigInt(creatorFeeUnits),
          BigInt(treasuryFeeUnits),
          priceFeedAddress as `0x${string}`,
          formData.bullCoinName.trim(),
          formData.bullCoinSymbol.trim(),
          formData.bearCoinName.trim(),
          formData.bearCoinSymbol.trim()
        ],
      });

      toast.info("Pool deployment transaction submitted. Waiting for confirmation...");
    } catch (error) {
      console.error("Error deploying pool:", error);
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      toast.error(`Failed to deploy: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  // Handle successful pool deployment and initialization
  useEffect(() => {
    if (isTransactionSuccess && deployData && receiptData) {
      toast.success("Pool deployed successfully!");
      
      // Try to extract pool address from transaction receipt
      const poolAddress = extractPoolAddressFromReceipt(receiptData as TransactionReceipt);
      
      if (poolAddress) {
        // Initialize the pool with current price
        initializeDeployedPool(poolAddress);
      } else {
        // If we can't extract the pool address, still consider it a success
        toast.warning("Pool deployed but couldn't initialize automatically. You may need to initialize it manually.");
        setIsSubmitting(false);
        const timer = setTimeout(() => router.push("/explorePools"), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isTransactionSuccess, deployData, receiptData, extractPoolAddressFromReceipt, initializeDeployedPool, router]);

  useEffect(() => {
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`);
      setIsSubmitting(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      toast.error(`Transaction failed: ${receiptError.message}`);
      setIsSubmitting(false);
    }
  }, [receiptError]);

  useEffect(() => {
    if (!isSigning && isSubmitting && !isDeployingTx && !isInitializing) {
      if (!deployData) {
        setIsSubmitting(false);
      }
    }
  }, [isSigning, isSubmitting, isDeployingTx, isInitializing, deployData]);

  const isChainSupported = currentChainId ? SUPPORTED_CHAINS.includes(currentChainId) : false;
  const priceFeedOptions = currentChainId ? getPriceFeedOptions(currentChainId) : [];

  const isProcessing = isSubmitting || isSigning || isDeployingTx || isInitializing;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-12 h-12 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please connect your wallet to create a prediction pool
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (!isChainSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Unsupported Network
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please switch to a supported network to create a prediction pool
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-medium">Supported networks:</p>
              <ul className="text-xs space-y-0.5">
                <li>• Ethereum Mainnet (1)</li>
                <li>• Polygon (137)</li>
                <li>• Scroll Sepolia (534352)</li>
                <li>• Sepolia Testnet (11155111)</li>
                <li>• Base Mainnet (8453)</li>
                <li>• BSC Mainnet (56)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 min-h-screen bg-gray-50 dark:bg-[#1a1b1f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-black rounded-xl shadow-md overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Create Fate Pool
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
              Set up your prediction pool in a few simple steps
            </p>

            <StepIndicator
              currentStep={currentStep}
              totalSteps={stepTitles.length}
              stepTitles={stepTitles}
            />

            <form onSubmit={handleSubmit} className="mt-8">
              <fieldset disabled={isProcessing}>
                {currentStep === 1 && (
                  <PoolConfigurationStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                    priceFeedOptions={priceFeedOptions}
                  />
                )}
                {currentStep === 2 && (
                  <TokenConfigurationStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                  />
                )}
                {currentStep === 3 && (
                  <FeeConfigurationStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                  />
                )}
                {currentStep === 4 && (
                  <ReviewStep
                    formData={formData}
                    onSubmit={handleSubmit}
                    onBack={prevStep}
                    isSubmitting={isProcessing}
                  />
                )}

                {currentStep < 4 && (
                  <div className="mt-8 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`
                        px-6 py-2.5 rounded-xl font-medium
                        transition-all duration-300 ease-in-out
                        bg-gray-300 text-gray-800 hover:bg-gray-200
                        dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
                        border border-transparent shadow-sm hover:shadow-md
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2.5 rounded-xl font-semibold 
                                transition-all duration-300 ease-in-out 
                                bg-neutral-900 text-white hover:bg-neutral-700
                                dark:bg-neutral-100 dark:text-black dark:hover:bg-neutral-200 
                                shadow-sm hover:shadow-md
                                border border-transparent dark:border-neutral-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}