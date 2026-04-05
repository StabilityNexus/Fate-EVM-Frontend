---
phase: 1
reviewers: [opencode]
reviewed_at: 2026-04-05T20:33:00Z
plans_reviewed: [Implementation complete - no PLAN.md, reviewing final implementation]
---

# Cross-AI Plan Review — Phase 1 (Form Validation Consolidation)

## OpenCode Review

### 1. Summary
The implementation achieves the goal of consolidating form validation into Zod schemas with clear step-based validation. However, there are critical issues around Zod version compatibility, some validation gaps, and missed opportunities to leverage more robust address validation.

### 2. Strengths

- **Good schema organization**: Three step schemas properly isolate validation concerns per form step (`FormData.ts:30-129`, `131-165`, `167-212`)
- **Clean error mapping**: `validateCurrentStep` correctly maps Zod issues to form errors (`CreateFatePool.tsx:179-185`)
- **Appropriate separation**: `validation.ts` correctly handles blockchain-level validation (viem's `isAddress`/`getAddress`) separate from form validation
- **i18n integration**: Using `validationMessages` for localized error messages (`FormData.ts:2,5`)
- **Type inference**: `FormData` correctly inferred via `z.infer` (`FormData.ts:28`)

### 3. Concerns

| Severity | Issue | Location |
|----------|-------|----------|
| **HIGH** | Zod v4 specified but v3 likely installed (package-lock shows v3.22.4/3.25.x) — `safeParse` API differs significantly between versions | `package.json:38` |
| **HIGH** | ETH_ADDRESS_REGEX only checks format, not checksum — vulnerable to case-sensitive address bugs | `FormData.ts:4,53,91,107,121` |
| **MEDIUM** | No max length on string fields — potential DoS with excessively long input | `FormData.ts:8-26` |
| **MEDIUM** | `totalFee >= 100` should be `> 100` — allows exactly 100% which is likely unintended | `FormData.ts:205` |
| **MEDIUM** | `Number()` conversion silently produces NaN for non-numeric strings like "abc" — the `Number.isFinite` check handles it but error message is generic | `FormData.ts:68-81` |
| **LOW** | Step schemas use `.pick()` which creates new object type — not a runtime issue but could use stricter typing | `FormData.ts:30-37` |
| **LOW** | No validation for negative initialDeposit upper bound — user could enter extremely large numbers | `FormData.ts:75-80` |

### 4. Suggestions

1. **Fix Zod version**: Verify actual installed version and test `safeParse` compatibility, or downgrade to `"zod": "^3.24.0"` for consistency with installed v3
2. **Replace regex with viem**: Use viem's `isAddress` from `validation.ts` for robust checksum validation:
   ```typescript
   import { isAddress } from 'viem';
   // Replace ETH_ADDRESS_REGEX.test() with isAddress()
   ```
3. **Add field length limits**:
   ```typescript
   poolName: z.string().trim().min(1).max(100),
   ```
4. **Fix total fee logic**: Change `totalFee >= 100` to `totalFee > 100` at `FormData.ts:205`
5. **Add upper bound validation** for initialDeposit (e.g., max 10^18 for ETH denomination)

### 5. Risk Level: **MEDIUM**

**Justification**: The Zod version mismatch is the highest risk — if v4 is installed, `safeParse` behavior may differ. The regex-only address validation is a security gap for checksum verification. However, the core refactoring is well-structured, error handling is robust, and the separation of concerns is sound. Fixing the version and address validation issues would reduce risk to LOW.

---

## Consensus Summary

Only one reviewer (OpenCode) available for this review cycle.

### Key Action Items

1. **CRITICAL**: Verify Zod version in `package-lock.json` and ensure `safeParse` API compatibility
2. **HIGH**: Replace `ETH_ADDRESS_REGEX` with viem's `isAddress()` for proper checksum validation
3. **MEDIUM**: Fix total fee logic (`>= 100` → `> 100`)
4. **MEDIUM**: Add max length constraints to string fields

### Implementation Already Correct

- ✅ Zod explicitly added as dependency
- ✅ FormData type inferred via `z.infer`
- ✅ validateCurrentStep refactored to use `.safeParse()`
- ✅ validation.ts retains only blockchain-level validators (no duplicate form validation)
