import { type Address, type Hex, parseSignature } from "viem";

export const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export type PermitDomain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
};

export type PermitMessage = {
  owner: Address;
  spender: Address;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
};

// The ERC-2612 permit message in the shape signTypedData takes.
export function buildPermitTypedData(domain: PermitDomain, message: PermitMessage) {
  return { domain, types: PERMIT_TYPES, primaryType: "Permit" as const, message };
}

// permit() wants the signature as v, r, s.
export function splitPermitSignature(signature: Hex): { v: number; r: Hex; s: Hex } {
  const { v, r, s, yParity } = parseSignature(signature);
  return { v: v !== undefined ? Number(v) : 27 + (yParity ?? 0), r, s };
}

export function permitDeadline(nowMs = Date.now(), minutes = 10): bigint {
  return BigInt(Math.floor(nowMs / 1000) + minutes * 60);
}
