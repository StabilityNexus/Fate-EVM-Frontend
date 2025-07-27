"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ethers } from "ethers";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL!;
const DENOMINATOR = 100_000;
const SEPOLIA_CHAIN_ID = 11155111;

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

interface FieldValidation {
  [key: string]: {
    isValid: boolean;
    errorMessage: string;
  };
}

const fields = [
  {
    id: "poolName",
    label: "Pool Name",
    type: "text",
    placeholder: "BTC Prediction",
    description: "The name of your prediction pool",
    validate: (value: string) => ({
      isValid: value.length >= 3,
      errorMessage: "Pool name must be more than 3 characters",
    }),
  },
  {
    id: "baseTokenAddress",
    label: "Base Token Address",
    type: "text",
    placeholder: "0x...",
    description: "The address of the token being predicted",
    validate: (value: string) => ({
      isValid: ethers.isAddress(value),
      errorMessage: "Invalid Ethereum address",
    }),
  },
  {
    id: "bullCoinName",
    label: "Bull Coin Name",
    type: "text",
    placeholder: "BTC Bull",
    description: "Name for the bull position token",
    validate: (value: string) => ({
      isValid: value.length >= 2 || value.length === 0,
      errorMessage: "Name must be at least 2 characters",
    }),
  },
  {
    id: "bullCoinSymbol",
    label: "Bull Coin Symbol",
    type: "text",
    placeholder: "BULL",
    description: "Symbol for the bull position token",
    validate: (value: string) => ({
      isValid: /^[A-Z]{0,4}$/.test(value),
      errorMessage: "Symbol must be uppercase letters (max 4 chars)",
    }),
  },
  {
    id: "bearCoinName",
    label: "Bear Coin Name",
    type: "text",
    placeholder: "BTC Bear",
    description: "Name for the bear position token",
    validate: (value: string) => ({
      isValid: value.length >= 2 || value.length === 0,
      errorMessage: "Name must be at least 2 characters",
    }),
  },
  {
    id: "bearCoinSymbol",
    label: "Bear Coin Symbol",
    type: "text",
    placeholder: "BEAR",
    description: "Symbol for the bear position token",
    validate: (value: string) => ({
      isValid: /^[A-Z]{0,4}$/.test(value),
      errorMessage: "Symbol must be uppercase letters (max 4 chars)",
    }),
  },
  {
    id: "oracleAddress",
    label: "Oracle Address",
    type: "text",
    placeholder: "0x...",
    description: "The address of the oracle contract",
    validate: (value: string) => ({
      isValid: ethers.isAddress(value),
      errorMessage: "Invalid Ethereum address",
    }),
  },
  {
    id: "priceFeedId",
    label: "Price Feed ID",
    type: "text",
    placeholder: "0xa6... (32-byte hex)",
    description: "The 32-byte hex identifier for the price feed",
    validate: (value: string) => ({
      isValid: /^0x[a-fA-F0-9]{64}$/.test(value),
      errorMessage: "Must be a 32-byte hex string (66 characters including 0x)",
    }),
  },
  {
    id: "vaultFee",
    label: "Vault Fee (%)",
    type: "number",
    placeholder: "3.0",
    description: "Percentage fee for the vault (0-100)",
    validate: (value: string) => ({
      isValid: /^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100,
      errorMessage: "Must be between 0 and 100",
    }),
  },
  {
    id: "vaultCreatorFee",
    label: "Creator Fee (%)",
    type: "number",
    placeholder: "3.0",
    description: "Percentage fee for the creator (0-100)",
    validate: (value: string) => ({
      isValid: /^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100,
      errorMessage: "Must be between 0 and 100",
    }),
  },
  {
    id: "treasuryFee",
    label: "Treasury Fee (%)",
    type: "number",
    placeholder: "0.3",
    description: "Percentage fee for the treasury (0-100)",
    validate: (value: string) => ({
      isValid: /^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100,
      errorMessage: "Must be between 0 and 100",
    }),
  },
];

export default function CreateFatePoolForm() {
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
  const [validation, setValidation] = useState<FieldValidation>({});
  const [showInfo, setShowInfo] = useState<{ [key: string]: boolean }>({});

  const { address } = useAccount();
  const currentChainId = useChainId();
  const router = useRouter();

  const { writeContract: deployPool, data: deployData, isPending: isSigning } = useWriteContract();
  const { isLoading: isDeployingTx } = useWaitForTransactionReceipt({ hash: deployData });

  const isDeploying = isSigning || isDeployingTx;
  const isWrongChain = currentChainId !== SEPOLIA_CHAIN_ID;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const field = fields.find((f) => f.id === name);
    if (field?.validate) {
      const validationResult = field.validate(value);
      setValidation((prev) => ({ ...prev, [name]: validationResult }));
    }
  };

  const toggleInfo = (fieldId: string) => {
    setShowInfo((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const deployContract = async () => {
    try {
      const vaultFeeUnits = Math.round((parseFloat(formData.vaultFee) / 100) * DENOMINATOR);
      const creatorFeeUnits = Math.round((parseFloat(formData.vaultCreatorFee) / 100) * DENOMINATOR);
      const treasuryFeeUnits = Math.round((parseFloat(formData.treasuryFee) / 100) * DENOMINATOR);

      await deployPool({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: PredictionPoolFactoryABI,
        functionName: "createPool",
        args: [
          formData.poolName,
          formData.baseTokenAddress,
          vaultFeeUnits,
          creatorFeeUnits,
          treasuryFeeUnits,
          formData.oracleAddress,
          formData.priceFeedId as `0x${string}`,
        ],
      });
    } catch (error) {
      console.error("Error deploying pool:", error);
      toast.error("Failed to deploy prediction pool");
    }
  };

  useEffect(() => {
    if (deployData) {
      const toastId = toast.loading("Transaction submitted...");
      toast.success("Prediction pool created!", {
        id: toastId,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`${EXPLORER_URL}${deployData}`, "_blank"),
        },
      });
      setTimeout(() => {
        router.push("/my-pools");
      }, 2000);
    }
  }, [deployData, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newValidation: FieldValidation = {};
    let isValid = true;

    fields.forEach((field) => {
      if (field.validate) {
        const result = field.validate(formData[field.id as keyof FormData]);
        newValidation[field.id] = result;
        if (!result.isValid) isValid = false;
      }
    });

    const totalFees =
      parseFloat(formData.vaultFee || "0") +
      parseFloat(formData.vaultCreatorFee || "0") +
      parseFloat(formData.treasuryFee || "0");

    if (totalFees > 100) {
      newValidation["feeValidation"] = {
        isValid: false,
        errorMessage: `Total fees cannot exceed 100% (current: ${totalFees}%)`,
      };
      isValid = false;
    }

    setValidation(newValidation);

    if (isValid) {
      await deployContract();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white font-normal">
      <div className="w-full max-w-3xl mx-auto px-4 py-12">
        {isDeploying ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-black dark:text-white" />
            <h2 className="text-2xl">Creating Your Prediction Pool</h2>
            <p className="text-gray-600 dark:text-gray-300">Deploying contract...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-300 dark:border-gray-700 p-8 bg-white dark:bg-black space-y-6"
          >
            <h1 className="text-4xl text-center mb-4">Create Prediction Pool</h1>

            {!address ? (
              <div className="text-center space-y-4">
                <p>Connect your wallet to proceed</p>
                <ConnectButton />
              </div>
            ) : isWrongChain ? (
              <div className="text-center space-y-4">
                <p>Please switch to the Sepolia network</p>
                <Button
                  onClick={() =>
                    window.ethereum?.request({
                      method: "wallet_switchEthereumChain",
                      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
                    })
                  }
                >
                  Switch to Sepolia
                </Button>
              </div>
            ) : (
              <>
                {fields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id} className="block mb-1">
                      {field.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.id as keyof FormData]}
                        onChange={handleChange}
                        className={`w-full bg-white dark:bg-black border ${
                          validation[field.id]?.isValid === false ? "border-red-500" : "border-gray-300"
                        } px-4 py-2 rounded`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleInfo(field.id)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    {(showInfo[field.id] || validation[field.id]?.isValid === false) && (
                      <p className={`text-sm mt-1 ${validation[field.id]?.isValid === false ? "text-red-500" : "text-gray-600"}`}>
                        {validation[field.id]?.isValid === false
                          ? validation[field.id]?.errorMessage
                          : field.description}
                      </p>
                    )}
                  </div>
                ))}
                {validation["feeValidation"]?.isValid === false && (
                  <p className="text-sm text-red-500">{validation["feeValidation"].errorMessage}</p>
                )}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    onClick={() => router.push("/explorePools")}
                    className="border border-gray-400 text-black dark:text-white"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-black text-white dark:bg-white dark:text-black">
                    {isDeploying ? "Deploying..." : "Create Pool"}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
