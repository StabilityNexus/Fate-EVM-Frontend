import { z } from "zod";

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const FormDataSchema = z.object({
  poolName: z.string().trim(),
  baseTokenAddress: z.string().trim(),
  oracleType: z.enum(["chainlink", "hebeswap"]),
  priceFeedAddress: z.string().trim(),
  hebeswapPairAddress: z.string().trim(),
  hebeswapQuoteToken: z.string().trim(),
  bullCoinName: z.string().trim(),
  bullCoinSymbol: z.string().trim(),
  bearCoinName: z.string().trim(),
  bearCoinSymbol: z.string().trim(),
  creatorAddress: z.string().trim(),
  mintFee: z.string().trim(),
  burnFee: z.string().trim(),
  creatorFee: z.string().trim(),
  treasuryFee: z.string().trim(),
  initialDeposit: z.string().trim(),
  quoteTokenAddress: z.string().trim().optional(),
  oracleDescription: z.string().trim().optional(),
});

export type FormData = z.infer<typeof FormDataSchema>;

export const StepOneFormDataSchema = FormDataSchema.pick({
  poolName: true,
  baseTokenAddress: true,
  oracleType: true,
  priceFeedAddress: true,
  hebeswapPairAddress: true,
  hebeswapQuoteToken: true,
  initialDeposit: true,
}).superRefine((data, ctx) => {
  if (!data.poolName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["poolName"],
      message: "Pool name is required",
    });
  }

  if (!data.baseTokenAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["baseTokenAddress"],
      message: "Base token address is required",
    });
  } else if (!ETH_ADDRESS_REGEX.test(data.baseTokenAddress)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["baseTokenAddress"],
      message: "Invalid Ethereum address format",
    });
  }

  if (!data.initialDeposit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["initialDeposit"],
      message: "Initial deposit must be a valid number",
    });
  } else {
    const deposit = Number(data.initialDeposit);
    if (Number.isNaN(deposit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["initialDeposit"],
        message: "Initial deposit must be a valid number",
      });
    } else if (deposit < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["initialDeposit"],
        message: "Initial deposit cannot be negative",
      });
    }
  }

  if (data.oracleType === "chainlink" && !data.priceFeedAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["priceFeedAddress"],
      message: "Please select a Chainlink price feed",
    });
  }

  if (data.oracleType === "hebeswap") {
    if (!data.hebeswapPairAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapPairAddress"],
        message: "Hebeswap pair address is required",
      });
    } else if (!ETH_ADDRESS_REGEX.test(data.hebeswapPairAddress)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapPairAddress"],
        message: "Invalid Hebeswap pair address format",
      });
    }

    if (!data.hebeswapQuoteToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapQuoteToken"],
        message: "Quote token address is required",
      });
    } else if (!ETH_ADDRESS_REGEX.test(data.hebeswapQuoteToken)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapQuoteToken"],
        message: "Invalid quote token address format",
      });
    }
  }
});

export const StepTwoFormDataSchema = FormDataSchema.pick({
  bullCoinName: true,
  bullCoinSymbol: true,
  bearCoinName: true,
  bearCoinSymbol: true,
}).superRefine((data, ctx) => {
  if (!data.bullCoinName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bullCoinName"],
      message: "Bull coin name is required",
    });
  }
  if (!data.bullCoinSymbol) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bullCoinSymbol"],
      message: "Bull coin symbol is required",
    });
  }
  if (!data.bearCoinName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bearCoinName"],
      message: "Bear coin name is required",
    });
  }
  if (!data.bearCoinSymbol) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bearCoinSymbol"],
      message: "Bear coin symbol is required",
    });
  }
});

const FeeStepSchema = z.object({
  mintFee: z.string().trim(),
  burnFee: z.string().trim(),
  creatorFee: z.string().trim(),
  treasuryFee: z.string().trim(),
});

export const StepThreeFormDataSchema = FeeStepSchema.superRefine((data, ctx) => {
  const mintFee = Number(data.mintFee);
  const burnFee = Number(data.burnFee);
  const creatorFee = Number(data.creatorFee);
  const treasuryFee = Number(data.treasuryFee);

  if (!Number.isFinite(mintFee)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mintFee"],
      message: "Invalid fee value",
    });
  }
  if (!Number.isFinite(burnFee)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["burnFee"],
      message: "Invalid fee value",
    });
  }
  if (!Number.isFinite(creatorFee)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["creatorFee"],
      message: "Invalid fee value",
    });
  }
  if (!Number.isFinite(treasuryFee)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["treasuryFee"],
      message: "Invalid fee value",
    });
  }

  if (mintFee < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mintFee"],
      message: "Invalid fee value",
    });
  }
  if (burnFee < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["burnFee"],
      message: "Invalid fee value",
    });
  }
  if (creatorFee < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["creatorFee"],
      message: "Invalid fee value",
    });
  }
  if (treasuryFee < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["treasuryFee"],
      message: "Invalid fee value",
    });
  }

  const totalFee = mintFee + burnFee + creatorFee + treasuryFee;
  if (totalFee >= 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mintFee"],
      message: "Total fees must be less than 100%",
    });
  }
});
