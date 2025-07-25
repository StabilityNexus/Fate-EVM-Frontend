"use client";

import React, { useState,useEffect } from "react";
import { ethers, type TransactionReceipt } from "ethers";
import { PredictionPoolFactoryABI } from "@/utils/abi/PredictionPoolFactory";
import { useAccount, useWalletClient } from "wagmi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL!;
const DENOMINATOR = 100_000;
const GAS_LIMIT_BUFFER = 50; // 50% buffer
const SEPOLIA_CHAIN_ID = BigInt(11155111);

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

export default function CreateFatePoolForm() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
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
  };

  useEffect(() => {
    if (!isConnected) {
      toast.error("Wallet not connected");
    }
  }, [isConnected]);

  const validateForm = (): boolean => {
    if (!isConnected || !address) {
      toast.error("⚠️ Please connect your wallet");
      return false;
    }

    const requiredFields = [
      { name: "Pool Name", key: "poolName" },
      { name: "Base Token Address", key: "baseTokenAddress" },
      { name: "Oracle Address", key: "oracleAddress" },
      { name: "Price Feed ID", key: "priceFeedId" },
    ];

    for (const field of requiredFields) {
      if (!formData[field.key as keyof FormData]?.trim()) {
        toast.error(`❌ ${field.name} is required`);
        return false;
      }
    }

    if (!ethers.isAddress(formData.baseTokenAddress)) {
      toast.error("❌ Invalid Base Token Address");
      return false;
    }

    if (!ethers.isAddress(formData.oracleAddress)) {
      toast.error("❌ Invalid Oracle Address");
      return false;
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(formData.priceFeedId)) {
      toast.error("❌ Price Feed ID must be a 32-byte hex string (66 characters including 0x)");
      return false;
    }

    const vaultFeeNum = parseFloat(formData.vaultFee) || 0;
    const vaultCreatorFeeNum = parseFloat(formData.vaultCreatorFee) || 0;
    const treasuryFeeNum = parseFloat(formData.treasuryFee) || 0;

    if ([vaultFeeNum, vaultCreatorFeeNum, treasuryFeeNum].some(f => f < 0 || f > 100)) {
      toast.error("❌ All fees must be between 0% and 100%");
      return false;
    }

    const totalFee = vaultFeeNum + vaultCreatorFeeNum + treasuryFeeNum;
    if (totalFee > 100) {
      toast.error(`❌ Total fees cannot exceed 100% (current: ${totalFee}%)`);
      return false;
    }

    return true;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    if (!walletClient) throw new Error("Wallet not connected");
    
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    
    // Verify network
    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      throw new Error("Please connect to Sepolia network");
    }
    
    // Verify contract exists
    const code = await provider.getCode(FACTORY_ADDRESS);
    if (code === "0x") throw new Error("Contract not deployed at this address");
    
    // Initialize contract
    const factory = new ethers.Contract(
      FACTORY_ADDRESS,
      PredictionPoolFactoryABI,
      signer
    );
    
    // Verify the createPool function exists
    try {
      factory.getFunction("createPool");
    } catch {
      throw new Error("Contract ABI doesn't include createPool function");
    }

    try {
      setLoading(true);
      setDebugInfo("🔄 Preparing transaction...");

      
      // Convert fees to contract units
      const vaultFeeUnits = Math.round((parseFloat(formData.vaultFee) / 100) * DENOMINATOR);
      const creatorFeeUnits = Math.round((parseFloat(formData.vaultCreatorFee) / 100) * DENOMINATOR);
      const treasuryFeeUnits = Math.round((parseFloat(formData.treasuryFee) / 100) * DENOMINATOR);

      setDebugInfo("⛽ Estimating gas...");
      const gasEstimate = await factory.createPool.estimateGas(
        formData.poolName,
        formData.baseTokenAddress,
        vaultFeeUnits,
        creatorFeeUnits,
        treasuryFeeUnits,
        formData.oracleAddress,
        formData.priceFeedId as `${string}`
      );

      const gasLimit = (gasEstimate * BigInt(100 + GAS_LIMIT_BUFFER)) / BigInt(100);

      setDebugInfo("🚀 Sending transaction...");
      const tx = await factory.createPool(
        formData.poolName,
        formData.baseTokenAddress,
        vaultFeeUnits,
        creatorFeeUnits,
        treasuryFeeUnits,
        formData.oracleAddress,
        formData.priceFeedId as `${string}`,
        { gasLimit }
      );

      toast.promise(tx.wait(), {
        loading: "⏳ Waiting for confirmation...",
        success: (receipt: unknown) => {
          const r = receipt as TransactionReceipt;
          return (
            <div className="space-y-1">
              <p className="font-semibold text-green-600 dark:text-green-400">
                ✅ Pool created successfully!
              </p>
              <a
                href={`${EXPLORER_URL}${r.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                🔗 View on Etherscan
              </a>
            </div>
          );
        },
        error: (err: any) => {
          return (
            <div className="text-red-600 dark:text-red-400 font-semibold">
              ❌ {err?.reason || err?.message || "Transaction failed"}
            </div>
          );
        },
      });

      resetForm();
    } catch (error: any) {
      console.error("Transaction Error:", error);
      const errorMessage = error?.reason || error?.message || "Transaction failed";
      toast.error(`❌ ${errorMessage}`);
      
      if (error.message.includes("rejected")) {
        setDebugInfo("User rejected transaction");
      } else if (error.message.includes("gas")) {
        setDebugInfo("Gas estimation failed. Check parameters.");
      } else if (error.message.includes("network")) {
        setDebugInfo("Network connection issue");
      }
    } finally {
      setLoading(false);
    }
  }

  const feeFields = [
    { id: "vaultFee", label: "Vault Fee (%)", name: "vaultFee", placeholder: "3.0" },
    { id: "vaultCreatorFee", label: "Creator Fee (%)", name: "vaultCreatorFee", placeholder: "3.0" },
    { id: "treasuryFee", label: "Treasury Fee (%)", name: "treasuryFee", placeholder: "0.3" },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
      <Card className="shadow-lg p-6 space-y-6 bg-white dark:bg-gray-900 text-foreground dark:text-white">
        <CardHeader>
          <CardTitle>Create Prediction Pool</CardTitle>
          <CardDescription>
            Fill in all parameters to deploy a new prediction pool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField
            label="Pool Name"
            name="poolName"
            value={formData.poolName}
            onChange={handleChange}
            placeholder="BTC Prediction"
          />

          <InputField
            label="Vault Creator"
            name="vaultcreator"
            value={address || ""}  
            onChange={handleChange}
            disabled={true}
          />
          
          <InputField
            label="Base Token Address"
            name="baseTokenAddress"
            value={formData.baseTokenAddress}
            onChange={handleChange}
            placeholder="0x..."
          />

          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Bull Coin Name"
              name="bullCoinName"
              value={formData.bullCoinName}
              onChange={handleChange}
              placeholder="BTC Bull"
            />
            <InputField
              label="Bull Coin Symbol"
              name="bullCoinSymbol"
              value={formData.bullCoinSymbol}
              onChange={handleChange}
              placeholder="BULL"
            />
            <InputField
              label="Bear Coin Name"
              name="bearCoinName"
              value={formData.bearCoinName}
              onChange={handleChange}
              placeholder="BTC Bear"
            />
            <InputField
              label="Bear Coin Symbol"
              name="bearCoinSymbol"
              value={formData.bearCoinSymbol}
              onChange={handleChange}
              placeholder="BEAR"
            />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Oracle Address"
              name="oracleAddress"
              value={formData.oracleAddress}
              onChange={handleChange}
              placeholder="0x..."
            />
            <InputField
              label="Price Feed ID"
              name="priceFeedId"
              value={formData.priceFeedId}
              onChange={handleChange}
              placeholder="0xa6... (32-byte hex)"
            />
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-4">
            {feeFields.map((field) => (
              <InputField
                key={field.id}
                label={field.label}
                name={field.name}
                value={formData[field.name as keyof FormData]}
                onChange={handleChange}
                type="number"
                placeholder={field.placeholder}
              />
            ))}
          </div>

          <div className="text-sm text-muted-foreground p-2 rounded bg-gray-100 dark:bg-gray-800">
            <p>ℹ️ Total fees must be ≤ 100%</p>
            <p>• 1% = 1000 basis points</p>
          </div>

          <Separator />

          <Button
            type="submit"
            disabled={loading || !isConnected}
            className="w-full border-2 border-black rounded-xl dark:border-white dark:text-white"
          >
            {loading ? "Creating Pool..." : "Create Prediction Pool"}
          </Button>

          {debugInfo && (
            <div className="text-sm text-muted-foreground p-2 rounded bg-gray-100 dark:bg-gray-800">
              {debugInfo}
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
}) => {
  const id = name.toLowerCase();
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-foreground dark:text-white">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="bg-white dark:bg-gray-800 text-foreground dark:text-white rounded-xl placeholder:text-gray-400 dark:placeholder:text-gray-500"
        pattern={type === "number" ? "[0-9]*[.,]?[0-9]*" : undefined}
        inputMode={type === "number" ? "decimal" : "text"}
      />
    </div>
  );
};