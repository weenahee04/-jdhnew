/**
 * Unit Tests for Core Logic
 * Tests formatters, validators, and calculations
 */

import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';

// ============================================
// FORMATTERS
// ============================================

/**
 * Format address with truncation (e.g., 0x123...456)
 */
export function formatAddress(address: string, startChars: number = 4, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format currency with commas and decimals
 */
export function formatCurrency(amount: number, decimals: number = 2, currency: string = 'THB'): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return `0.00 ${currency}`;
  }
  return `${amount.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })} ${currency}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num) || !isFinite(num)) {
    return '0.00';
  }
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

// ============================================
// VALIDATORS
// ============================================

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Solana addresses are base58 encoded and should be 32-44 characters
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  
  // Try to create PublicKey to validate
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate amount (positive number, not zero)
 */
export function isValidAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && isFinite(num) && num > 0;
}

/**
 * Validate amount doesn't exceed balance
 */
export function hasSufficientBalance(amount: number, balance: number, fee: number = 0): boolean {
  return amount > 0 && balance >= (amount + fee);
}

// ============================================
// CALCULATIONS
// ============================================

/**
 * Calculate gas fee (estimated)
 */
export function calculateGasFee(amount: number, isToken: boolean = false): number {
  // SOL transfer: ~0.000005 SOL
  // Token transfer: ~0.0001 SOL (includes ATA creation if needed)
  return isToken ? 0.0001 : 0.000005;
}

/**
 * Calculate total amount including fees
 */
export function calculateTotalWithFee(amount: number, fee: number): number {
  return amount + fee;
}

/**
 * Calculate slippage tolerance
 */
export function calculateSlippage(amount: number, slippageBps: number = 50): number {
  // slippageBps is in basis points (50 = 0.5%)
  const slippagePercent = slippageBps / 10000;
  return amount * slippagePercent;
}

/**
 * Convert USD to THB
 */
export function convertUsdToThb(usd: number, exchangeRate: number = 35): number {
  return usd * exchangeRate;
}

/**
 * Calculate insufficient balance error message
 */
export function getInsufficientBalanceMessage(
  amount: number, 
  balance: number, 
  fee: number, 
  symbol: string
): string {
  const available = balance - fee;
  return `ยอดเงินไม่พอ (Insufficient balance). Available: ${available.toFixed(4)} ${symbol} (need ${fee.toFixed(6)} ${symbol} for fees)`;
}

// ============================================
// UNIT TESTS
// ============================================

describe('Formatters', () => {
  describe('formatAddress', () => {
    it('should truncate long addresses', () => {
      const address = 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR';
      const formatted = formatAddress(address);
      expect(formatted).toBe('GkDE...hPyR');
    });

    it('should return short addresses as-is', () => {
      const address = '1234';
      const formatted = formatAddress(address);
      expect(formatted).toBe('1234');
    });

    it('should handle custom start/end chars', () => {
      const address = 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR';
      const formatted = formatAddress(address, 6, 6);
      expect(formatted).toBe('GkDEVL...hPyR');
    });

    it('should handle empty/null addresses', () => {
      expect(formatAddress('')).toBe('');
      expect(formatAddress(null as any)).toBe(null);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with commas and decimals', () => {
      expect(formatCurrency(1234.56)).toBe('1,234.56 THB');
      expect(formatCurrency(1000000)).toBe('1,000,000.00 THB');
    });

    it('should handle custom decimals', () => {
      expect(formatCurrency(1234.5678, 4)).toBe('1,234.5678 THB');
      expect(formatCurrency(1234.5, 0)).toBe('1,235 THB');
    });

    it('should handle invalid numbers', () => {
      expect(formatCurrency(NaN)).toBe('0.00 THB');
      expect(formatCurrency(Infinity)).toBe('0.00 THB');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(1000000)).toBe('1,000,000.00');
    });

    it('should handle custom decimals', () => {
      expect(formatNumber(1234.5678, 4)).toBe('1,234.5678');
      expect(formatNumber(1234.5, 0)).toBe('1,235');
    });
  });
});

describe('Validators', () => {
  describe('isValidSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      const validAddress = 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR';
      expect(isValidSolanaAddress(validAddress)).toBe(true);
    });

    it('should reject addresses that are too short', () => {
      expect(isValidSolanaAddress('123')).toBe(false);
      expect(isValidSolanaAddress('GkDEVLZP')).toBe(false);
    });

    it('should reject addresses that are too long', () => {
      const longAddress = 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR'.repeat(2);
      expect(isValidSolanaAddress(longAddress)).toBe(false);
    });

    it('should reject invalid address formats', () => {
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress(null as any)).toBe(false);
      expect(isValidSolanaAddress(undefined as any)).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    it('should validate positive numbers', () => {
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(0.001)).toBe(true);
      expect(isValidAmount('100')).toBe(true);
      expect(isValidAmount('0.001')).toBe(true);
    });

    it('should reject zero or negative numbers', () => {
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-1)).toBe(false);
      expect(isValidAmount('0')).toBe(false);
      expect(isValidAmount('-1')).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(isValidAmount(NaN)).toBe(false);
      expect(isValidAmount(Infinity)).toBe(false);
      expect(isValidAmount('abc')).toBe(false);
      expect(isValidAmount('')).toBe(false);
    });
  });

  describe('hasSufficientBalance', () => {
    it('should validate sufficient balance', () => {
      expect(hasSufficientBalance(10, 100, 5)).toBe(true);
      expect(hasSufficientBalance(10, 10, 0)).toBe(true);
    });

    it('should reject insufficient balance', () => {
      expect(hasSufficientBalance(100, 50, 5)).toBe(false);
      expect(hasSufficientBalance(10, 5, 0)).toBe(false);
    });

    it('should account for fees', () => {
      expect(hasSufficientBalance(10, 10, 0.001)).toBe(false);
      expect(hasSufficientBalance(10, 10.001, 0.001)).toBe(true);
    });
  });
});

describe('Calculations', () => {
  describe('calculateGasFee', () => {
    it('should calculate SOL transfer fee', () => {
      const fee = calculateGasFee(1, false);
      expect(fee).toBe(0.000005);
    });

    it('should calculate token transfer fee', () => {
      const fee = calculateGasFee(1, true);
      expect(fee).toBe(0.0001);
    });
  });

  describe('calculateTotalWithFee', () => {
    it('should add fee to amount', () => {
      expect(calculateTotalWithFee(10, 0.001)).toBe(10.001);
      expect(calculateTotalWithFee(100, 0.000005)).toBe(100.000005);
    });
  });

  describe('calculateSlippage', () => {
    it('should calculate slippage in basis points', () => {
      // 50 bps = 0.5%
      expect(calculateSlippage(100, 50)).toBe(0.5);
      // 100 bps = 1%
      expect(calculateSlippage(100, 100)).toBe(1);
    });

    it('should use default slippage if not provided', () => {
      expect(calculateSlippage(100)).toBe(0.5);
    });
  });

  describe('convertUsdToThb', () => {
    it('should convert USD to THB', () => {
      expect(convertUsdToThb(100)).toBe(3500);
      expect(convertUsdToThb(1)).toBe(35);
    });

    it('should use custom exchange rate', () => {
      expect(convertUsdToThb(100, 36)).toBe(3600);
    });
  });

  describe('getInsufficientBalanceMessage', () => {
    it('should generate correct error message', () => {
      const message = getInsufficientBalanceMessage(100, 50, 0.001, 'SOL');
      expect(message).toContain('ยอดเงินไม่พอ');
      expect(message).toContain('Available: 49.9990');
      expect(message).toContain('SOL');
    });
  });
});

