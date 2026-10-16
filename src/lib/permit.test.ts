import { describe, expect, it } from "vitest";
import { concatHex, encodeAbiParameters, hashTypedData, keccak256, recoverTypedDataAddress, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { buildPermitTypedData, permitDeadline, splitPermitSignature } from "@/lib/permit";

// Same constants the Solidity tests sign with.
const PERMIT_TYPEHASH = keccak256(toHex("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"));
const DOMAIN_TYPEHASH = keccak256(
  toHex("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
);

const key = "0x00000000000000000000000000000000000000000000000000000000000a11ce" as const;
const alice = privateKeyToAccount(key);
const helper = "0x000000000000000000000000000000000000beef" as const;
const coin = "0x00000000000000000000000000000000000c0010" as const;

const domain = { name: "Bull", version: "1", chainId: 11155111, verifyingContract: coin };
const message = { owner: alice.address, spender: helper, value: BigInt(5) * BigInt(10) ** BigInt(17), nonce: BigInt(3), deadline: BigInt(1_800_000_000) };

describe("permit typed data", () => {
  it("hashes exactly as the coin does", () => {
    const structHash = keccak256(
      encodeAbiParameters(
        [{ type: "bytes32" }, { type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
        [PERMIT_TYPEHASH, message.owner, message.spender, message.value, message.nonce, message.deadline],
      ),
    );
    const domainSeparator = keccak256(
      encodeAbiParameters(
        [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }, { type: "uint256" }, { type: "address" }],
        [DOMAIN_TYPEHASH, keccak256(toHex(domain.name)), keccak256(toHex(domain.version)), BigInt(domain.chainId), domain.verifyingContract],
      ),
    );
    const expected = keccak256(concatHex(["0x1901", domainSeparator, structHash]));

    expect(hashTypedData(buildPermitTypedData(domain, message))).toBe(expected);
  });

  it("signs so the owner can be recovered, and splits into v, r, s", async () => {
    const typedData = buildPermitTypedData(domain, message);
    const signature = await alice.signTypedData(typedData);

    expect(await recoverTypedDataAddress({ ...typedData, signature })).toBe(alice.address);

    const { v, r, s } = splitPermitSignature(signature);
    expect([27, 28]).toContain(v);
    expect(r).toBe(signature.slice(0, 66));
    expect(s).toBe("0x" + signature.slice(66, 130));
  });

  it("puts the deadline ten minutes out by default", () => {
    expect(permitDeadline(1_700_000_000_000)).toBe(BigInt(1_700_000_600));
    expect(permitDeadline(1_700_000_000_000, 1)).toBe(BigInt(1_700_000_060));
  });
});
