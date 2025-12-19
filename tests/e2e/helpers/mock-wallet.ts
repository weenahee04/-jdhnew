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
 * Connect mock wallet in the app
 */
export async function connectMockWallet(page: Page) {
  // First, ensure we're on the landing page
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  
  // The button is in App.tsx line 998-999:
  // <button onClick={() => setCurrentView('AUTH_REGISTER')} className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500...">
  //   Open account
  // </button>
  
  // Use multiple selector strategies for reliability:
  // 1. Exact text match (most reliable)
  // 2. Button with specific onClick behavior (setCurrentView)
  // 3. Button with gradient background classes
  
  // Strategy 1: Exact text match with button element
  let connectButton = page.locator('button:has-text("Open account")').first();
  
  // Wait for button to be visible and enabled
  await connectButton.waitFor({ 
    timeout: 15000, 
    state: 'visible' 
  });
  
  // Ensure button is enabled
  await connectButton.waitFor({ 
    timeout: 5000, 
    state: 'attached' 
  });
  
  // Scroll into view if needed
  await connectButton.scrollIntoViewIfNeeded();
  
  // Click the button
  await connectButton.click({ timeout: 10000 });
  
  // Wait for navigation to registration/auth page
  // The button sets currentView to 'AUTH_REGISTER', so wait for the form to appear
  await page.waitForSelector('form, input[type="email"]', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Note: This function connects to the registration flow, not a wallet directly
  // For actual wallet connection, tests should use the wallet creation flow
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

