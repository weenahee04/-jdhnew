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
 * Ensure test user exists (register if not exists)
 * This function checks if user exists in localStorage and registers if needed
 */
export async function ensureTestUserExists(
  page: Page,
  email: string = 'test@example.com',
  password: string = 'Test123456'
): Promise<void> {
  // Check if user already exists
  const userExists = await page.evaluate((userEmail) => {
    try {
      const usersStr = localStorage.getItem('jdh_users');
      if (!usersStr) return false;
      const users = JSON.parse(usersStr);
      return users && users[userEmail.toLowerCase()];
    } catch {
      return false;
    }
  }, email);

  if (userExists) {
    console.log(`✓ Test user ${email} already exists`);
    return;
  }

  console.log(`📝 Registering test user ${email}...`);

  // Step 1: Navigate to landing page
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');

  // Step 2: Click "Open account" button to go to registration
  const registerButton = page.locator('button:has-text("Open account")').first();
  await registerButton.waitFor({ timeout: 15000, state: 'visible' });
  await registerButton.scrollIntoViewIfNeeded();
  await registerButton.click({ timeout: 10000 });

  // Step 3: Wait for registration form
  await page.waitForSelector('form', { timeout: 10000 });
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ timeout: 10000, state: 'visible' });

  // Step 4: Fill registration form
  await emailInput.fill(email);
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);

  // Step 5: Click "Sign Up" button
  const signUpButton = page.locator('button:has-text("Sign Up"), button[type="submit"]').first();
  await signUpButton.waitFor({ timeout: 5000, state: 'visible' });
  await signUpButton.click({ timeout: 10000 });

  // Step 6: Handle Terms & Conditions modal if shown
  await page.waitForTimeout(1000);
  const termsCheckbox = page.locator('input#accept-terms[type="checkbox"]');
  if (await termsCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await termsCheckbox.check();
    await page.waitForTimeout(300);
    
    const acceptButton = page.locator('button:has-text("ยอมรับ"), button:has-text("Accept")').first();
    if (await acceptButton.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Step 7: Wait for wallet creation page or dashboard
  // If user needs to create wallet, we'll handle that in loginTestUser
  await page.waitForTimeout(2000);

  // Verify user was created
  const userCreated = await page.evaluate((userEmail) => {
    try {
      const usersStr = localStorage.getItem('jdh_users');
      if (!usersStr) return false;
      const users = JSON.parse(usersStr);
      return users && users[userEmail.toLowerCase()];
    } catch {
      return false;
    }
  }, email);

  if (userCreated) {
    console.log(`✅ Test user ${email} registered successfully`);
  } else {
    console.warn(`⚠️ Test user ${email} registration may have failed`);
  }
}

/**
 * Login a test user with email and password
 * This replaces the old "connectMockWallet" - the app uses email/password auth, not wallet extensions
 * Automatically ensures test user exists before attempting login
 */
export async function loginTestUser(
  page: Page,
  email: string = 'test@example.com',
  password: string = 'Test123456'
): Promise<void> {
  // Ensure test user exists first (register if needed)
  await ensureTestUserExists(page, email, password);

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
  
  // Step 6: Handle wallet creation if user doesn't have wallet yet
  // Check if we're on wallet creation page
  const walletCreatePage = page.locator('text=/สร้าง Wallet|Create Wallet|Seed Phrase/i');
  if (await walletCreatePage.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('📝 User needs to create wallet, creating now...');
    
    // Click "สร้าง Wallet ใหม่" button
    const createWalletButton = page.locator('button:has-text("สร้าง Wallet ใหม่"), button:has-text("Create Wallet")').first();
    if (await createWalletButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createWalletButton.click();
      await page.waitForTimeout(1000);
      
      // Confirm seed phrase (click "ยืนยัน" or "Confirm")
      const confirmButton = page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        
        // Click "เริ่มต้นใช้งาน" or "Get Started"
        const getStartedButton = page.locator('button:has-text("เริ่มต้นใช้งาน"), button:has-text("Get Started")').first();
        if (await getStartedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await getStartedButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  }
  
  // Step 7: Wait for successful login and dashboard
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
  
  console.log(`✅ Successfully logged in as ${email}`);
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

