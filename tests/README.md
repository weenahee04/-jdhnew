# 🧪 Comprehensive Test Suite

This directory contains a complete test suite for the JDH Crypto Wallet application, including both **Unit Tests** and **E2E Tests**.

## 📁 Directory Structure

```
tests/
├── unit/                    # Unit tests for core logic
│   └── core-logic.test.ts   # Formatters, validators, calculations
├── e2e/                     # End-to-end tests
│   ├── navigation.spec.ts   # Navigation and routing tests
│   ├── wallet-connection.spec.ts  # Wallet connection/disconnection
│   ├── send-receive.spec.ts  # Send and receive functionality
│   ├── staking.spec.ts      # Staking feature tests
│   ├── swap.spec.ts         # Swap feature tests
│   ├── auth-profile.spec.ts # Authentication and profile (existing)
│   └── helpers/             # Test utilities
│       ├── mock-wallet.ts   # Mock wallet adapter
│       └── auth-helpers.ts  # Auth test helpers (existing)
├── setup.ts                 # Global test setup
└── README.md                # This file
```

## 🚀 Quick Start

### Install Dependencies

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

### Run All Tests

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run all tests (unit + E2E)
npm run test:all

# Generate health report
npm run test:health
```

## 📊 Test Coverage

### Unit Tests (`tests/unit/`)

**File:** `core-logic.test.ts`

Tests cover:
- ✅ **Formatters**
  - Address truncation (`formatAddress`)
  - Currency formatting (`formatCurrency`)
  - Number formatting (`formatNumber`)
- ✅ **Validators**
  - Solana address validation (`isValidSolanaAddress`)
  - Amount validation (`isValidAmount`)
  - Balance sufficiency check (`hasSufficientBalance`)
- ✅ **Calculations**
  - Gas fee calculation (`calculateGasFee`)
  - Total with fee (`calculateTotalWithFee`)
  - Slippage calculation (`calculateSlippage`)
  - USD to THB conversion (`convertUsdToThb`)
  - Error messages (`getInsufficientBalanceMessage`)

### E2E Tests (`tests/e2e/`)

#### 1. Navigation Tests (`navigation.spec.ts`)
- ✅ Landing page loads without errors
- ✅ Header/footer visibility
- ✅ Navigation to registration/login
- ✅ All navigation tabs work
- ✅ Sidebar navigation
- ✅ Bottom navigation (mobile)
- ✅ Back navigation
- ✅ No console errors

#### 2. Wallet Connection Tests (`wallet-connection.spec.ts`)
- ✅ Connect wallet button visible
- ✅ Wallet connection flow
- ✅ Wallet address display
- ✅ Wallet balance display
- ✅ UI updates on connection
- ✅ Disconnect functionality
- ✅ Guest state after disconnect
- ✅ Connection persistence
- ✅ Error handling

#### 3. Send/Receive Tests (`send-receive.spec.ts`)
- ✅ Receive modal opens
- ✅ QR code display
- ✅ Address display
- ✅ Copy to clipboard
- ✅ Close modal
- ✅ Send modal opens
- ✅ Form validation
- ✅ Confirmation modal
- ✅ Success flow
- ✅ Invalid address error
- ✅ Zero amount error
- ✅ Insufficient balance error
- ✅ Negative amount error

#### 4. Staking Tests (`staking.spec.ts`)
- ✅ Navigate to staking page
- ✅ APY data display
- ✅ Staking form
- ✅ Enter stake amount
- ✅ Success feedback

#### 5. Swap Tests (`swap.spec.ts`)
- ✅ Navigate to swap page
- ✅ Open swap modal
- ✅ Token selection
- ✅ Quote fetching
- ✅ Price impact warning
- ✅ Execute swap

## 🛠️ Test Scripts

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run specific test file
npm run test:unit -- tests/unit/core-logic.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:navigation
npm run test:e2e:wallet
npm run test:e2e:send-receive
npm run test:e2e:staking
npm run test:e2e:swap

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Health Report

```bash
# Generate comprehensive health report
npm run test:health
```

This command:
1. Runs all unit tests
2. Runs all E2E tests
3. Generates HTML report
4. Outputs summary to console

## 🎯 Test Execution Strategy

### Development
- Run unit tests in watch mode: `npm run test:unit:watch`
- Run specific E2E test: `npm run test:e2e:headed tests/e2e/navigation.spec.ts`

### CI/CD
- Run all tests: `npm run test:all`
- Generate report: `npm run test:health`

### Debugging
- Use `npm run test:e2e:debug` for step-by-step debugging
- Use `npm run test:e2e:ui` for interactive test runner

## 📝 Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { formatAddress } from './core-logic.test';

describe('My Feature', () => {
  it('should do something', () => {
    expect(formatAddress('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR')).toBe('GkDE...hPyR');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';
import { setupMockWallet } from './helpers/mock-wallet';

test('should test feature', async ({ page }) => {
  await setupMockWallet(page);
  await page.goto('/');
  // ... test steps
});
```

## 🔧 Configuration

### Vitest Config (`vitest.config.ts`)
- Environment: `jsdom` (for React components)
- Setup file: `tests/setup.ts`
- Coverage provider: `v8`

### Playwright Config (`playwright.config.ts`)
- Base URL: `http://localhost:3000`
- Browsers: Chromium (default)
- Auto-start dev server

## 📈 Coverage Goals

- **Unit Tests**: 80%+ coverage for core logic
- **E2E Tests**: 100% coverage for critical user flows

## 🐛 Troubleshooting

### Tests fail to run
1. Install dependencies: `npm install`
2. Check Node version: `node --version` (should be 18+)
3. Clear cache: `npm cache clean --force`

### E2E tests timeout
1. Increase timeout in `playwright.config.ts`
2. Check if dev server is running: `npm run dev`
3. Verify base URL is correct

### Mock wallet not working
1. Check `tests/e2e/helpers/mock-wallet.ts`
2. Verify wallet adapter is properly mocked
3. Check browser console for errors

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)

---

**Last Updated:** 2024-12-13

