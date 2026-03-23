import { z } from "zod";
import { validationMessages } from "@/lib/i18n/validationMessages";

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const msg = validationMessages.createPool;

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
      message: msg.poolNameRequired,
    });
  }

  if (!data.baseTokenAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["baseTokenAddress"],
      message: msg.baseTokenAddressRequired,
    });
  } else if (!ETH_ADDRESS_REGEX.test(data.baseTokenAddress)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["baseTokenAddress"],
      message: msg.invalidEthAddressFormat,
    });
  }

  if (!data.initialDeposit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["initialDeposit"],
      message: msg.initialDepositInvalid,
    });
  } else {
    const deposit = Number(data.initialDeposit);
    if (!Number.isFinite(deposit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["initialDeposit"],
        message: msg.initialDepositInvalid,
      });
    } else if (deposit < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["initialDeposit"],
        message: msg.initialDepositNegative,
      });
    }
  }

  if (data.oracleType === "chainlink") {
    if (!data.priceFeedAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceFeedAddress"],
        message: msg.chainlinkPriceFeedRequired,
      });
    } else if (!ETH_ADDRESS_REGEX.test(data.priceFeedAddress)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceFeedAddress"],
        message: msg.invalidEthAddressFormat,
      });
    }
  }

  if (data.oracleType === "hebeswap") {
    if (!data.hebeswapPairAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapPairAddress"],
        message: msg.hebeswapPairRequired,
      });
    } else if (!ETH_ADDRESS_REGEX.test(data.hebeswapPairAddress)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapPairAddress"],
        message: msg.hebeswapPairInvalid,
      });
    }

    if (!data.hebeswapQuoteToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapQuoteToken"],
        message: msg.quoteTokenAddressRequired,
      });
    } else if (!ETH_ADDRESS_REGEX.test(data.hebeswapQuoteToken)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hebeswapQuoteToken"],
        message: msg.quoteTokenAddressInvalid,
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
      message: msg.bullCoinNameRequired,
    });
  }
  if (!data.bullCoinSymbol) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bullCoinSymbol"],
      message: msg.bullCoinSymbolRequired,
    });
  }
  if (!data.bearCoinName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bearCoinName"],
      message: msg.bearCoinNameRequired,
    });
  }
  if (!data.bearCoinSymbol) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bearCoinSymbol"],
      message: msg.bearCoinSymbolRequired,
    });
  }
});

const FeeStepSchema = z.object({
  mintFee: z
    .string()
    .trim()
    .nonempty({ message: msg.invalidFeeValue })
    .refine((s) => Number.isFinite(Number(s)) && Number(s) > 0, {
      message: msg.positiveFeeRequired,
    }),
  burnFee: z
    .string()
    .trim()
    .nonempty({ message: msg.invalidFeeValue })
    .refine((s) => Number.isFinite(Number(s)) && Number(s) > 0, {
      message: msg.positiveFeeRequired,
    }),
  creatorFee: z
    .string()
    .trim()
    .nonempty({ message: msg.invalidFeeValue })
    .refine((s) => Number.isFinite(Number(s)) && Number(s) > 0, {
      message: msg.positiveFeeRequired,
    }),
  treasuryFee: z
    .string()
    .trim()
    .nonempty({ message: msg.invalidFeeValue })
    .refine((s) => Number.isFinite(Number(s)) && Number(s) > 0, {
      message: msg.positiveFeeRequired,
    }),
});

export const StepThreeFormDataSchema = FeeStepSchema.superRefine((data, ctx) => {
  const mintFee = Number(data.mintFee);
  const burnFee = Number(data.burnFee);
  const creatorFee = Number(data.creatorFee);
  const treasuryFee = Number(data.treasuryFee);

  const totalFee = mintFee + burnFee + creatorFee + treasuryFee;
  if (totalFee >= 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["totalFee"],
      message: msg.totalFeesTooHigh,
    });
  }
});
