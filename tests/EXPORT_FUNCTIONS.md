# 📤 Export Utility Functions for Testing

The unit test file `tests/unit/core-logic.test.ts` contains utility functions that should be exported to a shared utilities file for use across the application.

## 🔧 Recommended Action

Create a new file `lib/utils.ts` or `utils/formatters.ts` and move these functions there:

```typescript
// lib/utils.ts or utils/formatters.ts

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

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  
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

/**
 * Calculate gas fee (estimated)
 */
export function calculateGasFee(amount: number, isToken: boolean = false): number {
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
```

Then update the test file to import from the utility file:

```typescript
// tests/unit/core-logic.test.ts
import {
  formatAddress,
  formatCurrency,
  formatNumber,
  isValidSolanaAddress,
  isValidAmount,
  hasSufficientBalance,
  calculateGasFee,
  calculateTotalWithFee,
  calculateSlippage,
  convertUsdToThb,
  getInsufficientBalanceMessage,
} from '../../lib/utils'; // or '../../utils/formatters'
```

This way, the functions can be:
1. ✅ Tested in unit tests
2. ✅ Used in the actual application
3. ✅ Reused across components

