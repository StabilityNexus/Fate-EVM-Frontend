"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import StepIndicator from "./Steps/StepIndicator";
import PoolConfigurationStep from "./Steps/PoolConfigurationStep";
import TokenConfigurationStep from "./Steps/TokenConfigurationStep";
import FeeConfigurationStep from "./Steps/FeeConfigurationStep";
import ReviewStep from "./Steps/ReviewStep";
import type { FormData } from "./FormData";
import { toast } from "sonner";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { ChainlinkAdapterFactoryABI } from "@/utils/abi/ChainlinkAdapterFactory";
import { FatePoolFactories, ChainlinkAdapterFactories } from "@/utils/addresses";
import { SUPPORTED_CHAINS, getPriceFeedOptions } from "@/utils/supportedChainFeed";

const DENOMINATOR = 100_000;

export default function CreateFatePool() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const currentChainId = useChainId();
  const publicClient = usePublicClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    writeContractAsync: deployPool,
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
    oracleType: currentChainId === 61 ? "hebeswap" : "chainlink",
    priceFeedAddress: "",
    hebeswapPairAddress: "",
    hebeswapQuoteToken: "",
    bullCoinName: "",
    bullCoinSymbol: "",
    bearCoinName: "",
    bearCoinSymbol: "",
    creatorAddress: address || "",
    mintFee: "3.0",
    burnFee: "3.0",
    creatorFee: "2.0",
    treasuryFee: "0.5"
  });

  const stepTitles = useMemo(() => [
    "Pool Config",
    "Token Config",
    "Fees",
    "Review",
  ], []);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    console.log('updateFormData called with:', updates);
    setFormData(prev => {
      const shouldUpdate = Object.keys(updates).some(
        key => prev[key as keyof FormData] !== updates[key as keyof FormData]
      );
      console.log('Should update:', shouldUpdate, 'Previous:', prev, 'Updates:', updates);
      return shouldUpdate ? { ...prev, ...updates } : prev;
    });
  }, []);

  // Reset oracle configuration when chain changes
  useEffect(() => {
    if (currentChainId === 61) {
      // Ethereum Classic - use Hebeswap
      updateFormData({ 
        oracleType: 'hebeswap',
        priceFeedAddress: '',
        hebeswapPairAddress: '',
        hebeswapQuoteToken: ''
      });
    } else {
      // All other chains - use Chainlink
      updateFormData({ 
        oracleType: 'chainlink',
        priceFeedAddress: '',
        hebeswapPairAddress: '',
        hebeswapQuoteToken: ''
      });
    }
  }, [currentChainId, updateFormData]);

  // Update creator address when wallet changes
  useEffect(() => {
    if (address && formData.creatorAddress !== address) {
      updateFormData({ creatorAddress: address });
    }
  }, [address, formData.creatorAddress, updateFormData]);





  const validateCurrentStep = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      console.log('Validating step 1 with formData:', formData);
      
      if (!formData.poolName.trim()) newErrors.poolName = "Pool name is required";
      if (!formData.baseTokenAddress.trim()) {
        newErrors.baseTokenAddress = "Base token address is required";
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.baseTokenAddress.trim())) {
        newErrors.baseTokenAddress = "Invalid Ethereum address format";
      }
      
      // Validate oracle configuration based on type
      if (formData.oracleType === 'chainlink') {
        if (!formData.priceFeedAddress) {
          newErrors.priceFeedAddress = "Please select a Chainlink price feed";
        }
      } else if (formData.oracleType === 'hebeswap') {
        console.log('Validating Hebeswap configuration:', {
          hebeswapPairAddress: formData.hebeswapPairAddress,
          hebeswapQuoteToken: formData.hebeswapQuoteToken
        });
        
        if (!formData.hebeswapPairAddress) {
          newErrors.hebeswapPairAddress = "Hebeswap pair address is required";
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.hebeswapPairAddress.trim())) {
          newErrors.hebeswapPairAddress = "Invalid Hebeswap pair address format";
        }
        if (!formData.hebeswapQuoteToken) {
          newErrors.hebeswapQuoteToken = "Quote token address is required";
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.hebeswapQuoteToken.trim())) {
          newErrors.hebeswapQuoteToken = "Invalid quote token address format";
        }
      }
      
      console.log('Step 1 validation errors:', newErrors);
    } else if (currentStep === 2) {
      if (!formData.bullCoinName.trim()) newErrors.bullCoinName = "Bull coin name is required";
      if (!formData.bullCoinSymbol.trim()) newErrors.bullCoinSymbol = "Bull coin symbol is required";
      if (!formData.bearCoinName.trim()) newErrors.bearCoinName = "Bear coin name is required";
      if (!formData.bearCoinSymbol.trim()) newErrors.bearCoinSymbol = "Bear coin symbol is required";
         } else if (currentStep === 3) {
       const mintFee = parseFloat(formData.mintFee);
       const burnFee = parseFloat(formData.burnFee);
       const creatorFee = parseFloat(formData.creatorFee);
       const treasuryFee = parseFloat(formData.treasuryFee);

       if (isNaN(mintFee) || mintFee < 0) newErrors.mintFee = "Invalid fee value";
       if (isNaN(burnFee) || burnFee < 0) newErrors.burnFee = "Invalid fee value";
       if (isNaN(creatorFee) || creatorFee < 0) newErrors.creatorFee = "Invalid fee value";
       if (isNaN(treasuryFee) || treasuryFee < 0) newErrors.treasuryFee = "Invalid fee value";

       const totalFee = mintFee + burnFee + creatorFee + treasuryFee;
       if (totalFee >= 100) {
         newErrors.mintFee = "Total fees must be less than 100%";
       }
     }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  const nextStep = useCallback(() => {
    console.log('nextStep called, currentStep:', currentStep);
    const isValid = validateCurrentStep();
    console.log('Validation result:', isValid);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, stepTitles.length));
    }
  }, [validateCurrentStep, stepTitles.length, currentStep]);

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
       const mintFeeUnits = Math.floor((parseFloat(formData.mintFee) / 100) * DENOMINATOR);
       const burnFeeUnits = Math.floor((parseFloat(formData.burnFee) / 100) * DENOMINATOR);
       const creatorFeeUnits = Math.floor((parseFloat(formData.creatorFee) / 100) * DENOMINATOR);
       const treasuryFeeUnits = Math.floor((parseFloat(formData.treasuryFee) / 100) * DENOMINATOR);

      const baseTokenAddress = formData.baseTokenAddress.trim();

      // Get the adapter factory address for the current chain
      const adapterFactoryAddress = ChainlinkAdapterFactories[currentChainId];
      if (!adapterFactoryAddress || adapterFactoryAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`ChainlinkAdapterFactory not deployed on chain ${currentChainId}. Please deploy the adapter factory first.`);
      }

      // Check if we have a valid price feed address
      if (!formData.priceFeedAddress || formData.priceFeedAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Price feed address is required.");
      }

      const priceFeedAddress = formData.priceFeedAddress as `0x${string}`;
      let oracleAddress: `0x${string}`;

      // Step 1: Check if adapter already exists for this price feed
      console.log("🔍 Checking if oracle adapter exists for price feed:", priceFeedAddress);
      toast.info("Checking for existing oracle adapter...");
      
      try {
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        const existingAdapter = await publicClient.readContract({
          address: adapterFactoryAddress as `0x${string}`,
          abi: ChainlinkAdapterFactoryABI,
          functionName: "getAdapter",
          args: [priceFeedAddress],
        }) as `0x${string}`;

        if (existingAdapter && existingAdapter !== "0x0000000000000000000000000000000000000000") {
          console.log("✅ Found existing oracle adapter:", existingAdapter);
          oracleAddress = existingAdapter;
          toast.info("Using existing oracle adapter for this price feed.");
        } else {
          // Step 2: Deploy new adapter
          console.log("🚀 Creating new oracle adapter for price feed:", priceFeedAddress);
          toast.info("Creating new oracle adapter... This may take a moment.");
          
          const adapterTxHash = await deployPool({
            address: adapterFactoryAddress as `0x${string}`,
            abi: ChainlinkAdapterFactoryABI,
            functionName: "createAdapter",
            args: [priceFeedAddress],
          }) as `0x${string}`;

          console.log("📝 Adapter creation transaction hash:", adapterTxHash);
          
          // Wait for the transaction to be mined
          toast.info("Waiting for adapter creation transaction to be mined...");
          
          // Wait for the transaction receipt
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: adapterTxHash,
            timeout: 60_000, // 60 seconds timeout
          });

          console.log("✅ Adapter creation transaction confirmed:", receipt);
          
          // Query the adapter factory for the oracle address after transaction confirmation
          oracleAddress = await publicClient.readContract({
            address: adapterFactoryAddress as `0x${string}`,
            abi: ChainlinkAdapterFactoryABI,
            functionName: "getAdapter",
            args: [priceFeedAddress],
          }) as `0x${string}`;
          
          console.log("🎯 Retrieved oracle address from factory:", oracleAddress);
          toast.success("Oracle adapter created successfully!");
        }
      } catch (error) {
        console.error("Error checking/creating oracle adapter:", error);
        throw new Error(`Failed to get oracle adapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 3: Create the pool using the oracle address
      console.log("🏗️ Creating prediction pool with oracle address:", oracleAddress);
      toast.info("Creating prediction pool...");
      
      await deployPool({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: PredictionPoolFactoryABI,
        functionName: "createPool",
        args: [
          formData.poolName.trim(),
          baseTokenAddress as `0x${string}`,
          oracleAddress,
          formData.bullCoinName.trim(),
          formData.bullCoinSymbol.trim(),
          formData.bearCoinName.trim(),
          formData.bearCoinSymbol.trim(),
          BigInt(mintFeeUnits),
          BigInt(burnFeeUnits),
          BigInt(creatorFeeUnits),
          BigInt(treasuryFeeUnits),
        ],
      });

      console.log("🚀 formData:", formData);
      toast.info("Pool deployment transaction submitted. Waiting for confirmation...");
    } catch (error) {
      console.error("Error deploying pool:", error);
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as { message: string }).message);
      }
      toast.error(`Failed to deploy: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  // Handle successful pool deployment and initialization
  useEffect(() => {
    if (isTransactionSuccess && deployData && receiptData) {
      
      toast.success("Pool deployed successfully!");
      
      // Pool is automatically initialized in the smart contract during deployment
      toast.success("Pool deployed successfully!");
      setIsSubmitting(false);
      const timer = setTimeout(() => router.push("/explorePools"), 2000);
      return () => clearTimeout(timer);
    }
      }, [isTransactionSuccess, deployData, receiptData, router]);

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
    if (!isSigning && isSubmitting && !isDeployingTx) {
      if (!deployData) {
        setIsSubmitting(false);
      }
    }
  }, [isSigning, isSubmitting, isDeployingTx, deployData]);

  const isChainSupported = currentChainId ? SUPPORTED_CHAINS.includes(currentChainId) : false;
  const priceFeedOptions = currentChainId ? getPriceFeedOptions(currentChainId) : [];

  const isProcessing = isSubmitting || isSigning || isDeployingTx;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1b1f]">
        <div className="max-w-md w-full bg-white dark:bg-black rounded-lg shadow-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
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
                            <AlertCircle className="w-12 h-12 text-red-500" />
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