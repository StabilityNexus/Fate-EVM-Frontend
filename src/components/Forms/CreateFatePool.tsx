"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import StepIndicator from "./Steps/StepIndicator";
import PoolConfigurationStep from "./Steps/PoolConfigurationStep";
import TokenConfigurationStep from "./Steps/TokenConfigurationStep";
import AddressConfigurationStep from "./Steps/AddressConfigurationStep";
import FeeConfigurationStep from "./Steps/FeeConfigurationStep";
import ReviewStep from "./Steps/ReviewStep";
import { FormData } from "./FormData";
import { toast } from "sonner";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { FatePoolFactories } from "@/utils/addresses";

const DENOMINATOR = 100_000;

const CHAIN_ORACLES: Record<number, string> = {
  1: "0x4305FB66699C3B2702D4d05CF36551390A4c69C6", // Ethereum
  137: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C", // Polygon
  534352: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", // Scroll
  11155111: "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21", // Sepolia
};

const PRICE_FEEDS = [
  { id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", name: "Crypto.BTC/USD" },
  { id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", name: "Crypto.ETH/USD" },
  { id: "0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d", name: "Crypto.ADA/USD" },
  { id: "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f", name: "Crypto.BNB/USD" },
  { id: "0x7f5cc8d963fc5b3d2ae41fe5685ada89fd4f14b435f8050f28c7fd409f40c2d8", name: "Crypto.ETC/USD" },
];

const SUPPORTED_CHAINS = [1, 137, 534352, 11155111]; // Ethereum, Polygon, Scroll, Sepolia

export default function CreateFatePool() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const [formData, setFormData] = useState<FormData>({
    poolName: "",
    poolDescription: "",
    baseTokenAddress: "",
    assetId: "",
    bullCoinName: "",
    bullCoinSymbol: "",
    bearCoinName: "",
    bearCoinSymbol: "",
    oracleAddress: "",
    creatorAddress: "",
    vaultFee: "0",
    vaultCreatorFee: "0",
    treasuryFee: "0"
  });

  const stepTitles = [
    "Pool Config",
    "Token Config",
    "Address",
    "Fees",
    "Review",
  ];

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.poolName.trim()) newErrors.poolName = "Pool name is required";
      if (!formData.baseTokenAddress.trim()) newErrors.baseTokenAddress = "Base token address is required";
      if (!formData.assetId) newErrors.assetId = "Please select an asset";
    } else if (currentStep === 2) {
      if (!formData.bullCoinName.trim()) newErrors.bullCoinName = "Bull coin name is required";
      if (!formData.bullCoinSymbol.trim()) newErrors.bullCoinSymbol = "Bull coin symbol is required";
      if (!formData.bearCoinName.trim()) newErrors.bearCoinName = "Bear coin name is required";
      if (!formData.bearCoinSymbol.trim()) newErrors.bearCoinSymbol = "Bear coin symbol is required";
    } else if (currentStep === 4) {
      const vaultFee = parseFloat(formData.vaultFee);
      const vaultCreatorFee = parseFloat(formData.vaultCreatorFee);
      const treasuryFee = parseFloat(formData.treasuryFee);

      if (isNaN(vaultFee)) newErrors.vaultFee = "Invalid fee value";
      if (isNaN(vaultCreatorFee)) newErrors.vaultCreatorFee = "Invalid fee value";
      if (isNaN(treasuryFee)) newErrors.treasuryFee = "Invalid fee value";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, stepTitles.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    const FACTORY_ADDRESS = currentChainId ? FatePoolFactories[currentChainId] : undefined;

    if (!FACTORY_ADDRESS) {
      toast.error("Factory address not found for this chain");
      setIsSubmitting(false);
      return;
    }

    try {
      const vaultFeeUnits = Math.round((parseFloat(formData.vaultFee) / 100) * DENOMINATOR);
      const creatorFeeUnits = Math.round((parseFloat(formData.vaultCreatorFee) / 100) * DENOMINATOR);
      const treasuryFeeUnits = Math.round((parseFloat(formData.treasuryFee) / 100) * DENOMINATOR);

      await deployPool({
        address: FACTORY_ADDRESS,
        abi: PredictionPoolFactoryABI,
        functionName: "createPool",
        args: [
          formData.poolName,
          formData.baseTokenAddress,
          vaultFeeUnits,
          creatorFeeUnits,
          treasuryFeeUnits,
          formData.oracleAddress,
          formData.assetId,
        ],
      });
    } catch (error) {
      console.error("Error deploying pool:", error);
      toast.error("Failed to deploy prediction pool");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (currentChainId && CHAIN_ORACLES[currentChainId]) {
      updateFormData({ oracleAddress: CHAIN_ORACLES[currentChainId] });
    }
  }, [currentChainId]);

  useEffect(() => {
    if (isTransactionSuccess && deployData) {
      toast.success("Prediction pool created successfully!");
      setTimeout(() => router.push("/explorePools"), 2000);
    }
  }, [isTransactionSuccess, deployData, router]);

  useEffect(() => {
    if (writeError) {
      console.error("Transaction error:", writeError);
      toast.error("Transaction failed. Please try again.");
      setIsSubmitting(false);
    }
  }, [writeError]);

  const isChainSupported = currentChainId ? SUPPORTED_CHAINS.includes(currentChainId) : false;

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
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

            <div className="mt-8">
              {currentStep === 1 && (
                <PoolConfigurationStep
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  priceFeeds={PRICE_FEEDS}
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
                <AddressConfigurationStep
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}
              {currentStep === 4 && (
                <FeeConfigurationStep
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}
              {currentStep === 5 && (
                <ReviewStep
                  formData={formData}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>

            {currentStep < 5 && (
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}