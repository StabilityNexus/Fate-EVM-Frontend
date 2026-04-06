import { describe, it, expect } from 'vitest';
import { 
  normalizeAmountInput, 
  toDisplayAmountWithMin,
  stripTrailingZeros,
  truncateDecimalString,
  toDisplayAmount,
  toExactAmount,
} from '../format';

describe('format utilities', () => {
  describe('normalizeAmountInput (Bug 3: Precision boundaries)', () => {
    it('truncates input with more than 18 decimal places to 18 decimals', () => {
      // 0.100000000000000000001 has 21 decimal places, truncated to 18 = 0.100000000000000000
      // After stripTrailingZeros, this becomes 0.1
      expect(normalizeAmountInput('0.100000000000000000001')).toBe('0.1');
    });

    it('accepts valid decimal input', () => {
      expect(normalizeAmountInput('1.5')).toBe('1.5');
    });

    it('handles whitespace', () => {
      expect(normalizeAmountInput('  0.5  ')).toBe('0.5');
    });

    it('rejects invalid input', () => {
      expect(normalizeAmountInput('abc')).toBe('');
    });

    it('removes leading zeros from whole number part', () => {
      expect(normalizeAmountInput('1.0000')).toBe('1');
    });

    it('accepts whole numbers', () => {
      expect(normalizeAmountInput('100')).toBe('100');
    });

    it('rejects negative numbers', () => {
      expect(normalizeAmountInput('-1')).toBe('');
      expect(normalizeAmountInput('1.5-')).toBe('');
    });
  });

  describe('toDisplayAmountWithMin (Bug 4: Tiny deficit display)', () => {
    it('returns "< 0.000001" for values > 0 but below display threshold', () => {
      // 1 wei with 18 decimals = 0.000000000000000001
      // With displayDecimals=6, this would show as "0"
      expect(toDisplayAmountWithMin(BigInt(1), 18, 6)).toBe('< 0.000001');
    });

    it('returns "0" for zero value', () => {
      expect(toDisplayAmountWithMin(BigInt(0), 18, 6)).toBe('0');
    });

    it('shows display amount for larger values', () => {
      // 1000000000000 wei = 0.000001 ETH - should show as number, not "<" 
      expect(toDisplayAmountWithMin(BigInt(1000000000000), 18, 6)).toBe('0.000001');
    });

    it('handles higher decimal display', () => {
      expect(toDisplayAmountWithMin(BigInt(1), 18, 8)).toBe('< 0.00000001');
    });
  });

  describe('stripTrailingZeros', () => {
    it('removes trailing zeros after decimal', () => {
      expect(stripTrailingZeros('1.500')).toBe('1.5');
    });

    it('keeps whole numbers intact', () => {
      expect(stripTrailingZeros('100')).toBe('100');
    });

    it('handles .0', () => {
      expect(stripTrailingZeros('1.0')).toBe('1');
    });
  });

  describe('truncateDecimalString', () => {
    it('truncates to maxDecimals', () => {
      expect(truncateDecimalString('1.23456789', 4)).toBe('1.2345');
    });

    it('removes trailing zeros from fractional part', () => {
      expect(truncateDecimalString('1.2300', 4)).toBe('1.23');
    });

    it('returns integer only if no fractional part', () => {
      expect(truncateDecimalString('100', 4)).toBe('100');
    });

    it('returns empty for invalid input', () => {
      expect(truncateDecimalString('', 4)).toBe('');
      expect(truncateDecimalString('abc', 4)).toBe('');
      expect(truncateDecimalString('1.2.3', 4)).toBe('');
    });
  });

  describe('toDisplayAmount', () => {
    it('formats bigint to display string', () => {
      // 1 ETH = 1000000000000000000 wei
      expect(toDisplayAmount(BigInt('1000000000000000000'), 18, 4)).toBe('1');
      expect(toDisplayAmount(BigInt('1234567890123456789'), 18, 4)).toBe('1.2345');
    });
  });

  describe('toExactAmount', () => {
    it('formats bigint to full precision string', () => {
      expect(toExactAmount(BigInt('1000000000000000000'), 18)).toBe('1');
      expect(toExactAmount(BigInt('1234567890123456789'), 18)).toBe('1.234567890123456789');
    });

    it('handles extremely large BigInt values without throwing', () => {
      const largeValue = BigInt('999999999999999999999999999999999999999');
      const result = toExactAmount(largeValue, 18);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeAmountInput edge cases', () => {
    it('rejects scientific notation (e.g., 1e18)', () => {
      expect(normalizeAmountInput('1e18')).toBe('');
    });

    it('handles extremely large BigInt values without throwing in toDisplayAmount', () => {
      const largeValue = BigInt('999999999999999999999999999999999999999');
      const result = toDisplayAmount(largeValue, 18, 4);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});