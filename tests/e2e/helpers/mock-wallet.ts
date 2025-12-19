/**
 * Mock Wallet Adapter for E2E Tests
 * Simulates a connected Solana wallet
 */

import { Page } from '@playwright/test';

export interface MockWalletConfig {
  address: string;
  balance: number; // in SOL
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}

export const DEFAULT_MOCK_WALLET: MockWalletConfig = {
  address: 'MockAddress1234567890123456789012345678901234567890',
  balance: 100, // 100 SOL
  network: 'devnet',
};

/**
 * Setup mock wallet in browser context
 */
export async function setupMockWallet(page: Page, config: MockWalletConfig = DEFAULT_MOCK_WALLET) {
  // Mock window.solana (Phantom wallet)
  await page.addInitScript((walletConfig) => {
    (window as any).solana = {
      isPhantom: true,
      publicKey: {
        toString: () => walletConfig.address,
        toBase58: () => walletConfig.address,
      },
      isConnected: true,
      connect: async () => ({
        publicKey: {
          toString: () => walletConfig.address,
          toBase58: () => walletConfig.address,
        },
      }),
      disconnect: async () => {},
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
      signMessage: async (message: Uint8Array) => ({
        signature: new Uint8Array(64),
        publicKey: walletConfig.address,
      }),
      on: () => {},
      off: () => {},
      removeListener: () => {},
    };
    
    // Mock wallet balance
    (window as any).__MOCK_WALLET_BALANCE__ = walletConfig.balance;
    (window as any).__MOCK_WALLET_ADDRESS__ = walletConfig.address;
    (window as any).__MOCK_WALLET_NETWORK__ = walletConfig.network;
  }, config);
}

/**
 * Login a test user with email and password
 * This replaces the old "connectMockWallet" - the app uses email/password auth, not wallet extensions
 */
export async function loginTestUser(
  page: Page,
  email: string = 'test@example.com',
  password: string = 'Test123456'
): Promise<void> {
  // Step 1: Navigate to landing page
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  
  // Step 2: Click "Login" button to go to login page
  // Button is in App.tsx line 1001: <button onClick={() => setCurrentView('AUTH_LOGIN')}>
  const loginButton = page.locator('button:has-text("Login")').first();
  await loginButton.waitFor({ timeout: 15000, state: 'visible' });
  await loginButton.scrollIntoViewIfNeeded();
  await loginButton.click({ timeout: 10000 });
  
  // Step 3: Wait for login form to appear
  await page.waitForSelector('form', { timeout: 10000 });
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ timeout: 10000, state: 'visible' });
  
  // Step 4: Fill email and password
  // Email input: App.tsx line 1041-1049
  // Password input: App.tsx line 1053-1062
  await emailInput.fill(email);
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);
  
  // Step 5: Click "Sign In" button
  // Submit button: App.tsx line 1077-1090, text is "Sign In" for login
  const signInButton = page.locator('button:has-text("Sign In"), button[type="submit"]').first();
  await signInButton.waitFor({ timeout: 5000, state: 'visible' });
  await signInButton.click({ timeout: 10000 });
  
  // Step 6: Wait for successful login
  // After login, the app:
  // - Loads wallet automatically if user has one
  // - Sets currentView to 'APP' (dashboard)
  // - Shows "Total Balance" element
  
  // Wait for APP view to load (dashboard)
  // Look for "Total Balance" text which appears in the dashboard (App.tsx line 1138)
  await page.waitForSelector('text=/Total Balance|ภาพรวม|Dashboard/i', { timeout: 15000 });
  
  // Also wait for balance element to confirm wallet is loaded
  // Balance is shown in App.tsx around line 1142-1143
  await page.waitForSelector('text=/฿|SOL|Balance/i', { timeout: 10000 });
  
  // Give a moment for wallet to fully load
  await page.waitForTimeout(1000);
}

/**
 * @deprecated Use loginTestUser instead. This app uses email/password auth, not wallet extensions.
 */
export async function connectMockWallet(page: Page) {
  console.warn('connectMockWallet is deprecated. Use loginTestUser instead.');
  return loginTestUser(page);
}

/**
 * Disconnect mock wallet
 */
export async function disconnectMockWallet(page: Page) {
  // Find and click disconnect/logout button
  const disconnectButton = page.locator('text=/Disconnect|Logout|ออกจากระบบ/i').first();
  if (await disconnectButton.isVisible({ timeout: 2000 })) {
    await disconnectButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Get mock wallet balance from page context
 */
export async function getMockWalletBalance(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return (window as any).__MOCK_WALLET_BALANCE__ || 0;
  });
}

/**
 * Set mock wallet balance
 */
export async function setMockWalletBalance(page: Page, balance: number) {
  await page.evaluate((bal) => {
    (window as any).__MOCK_WALLET_BALANCE__ = bal;
  }, balance);
}

