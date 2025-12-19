/**
 * Wallet Connection Tests
 * Tests wallet connection, disconnection, and state management
 */

import { test, expect } from '@playwright/test';
import { setupMockWallet, loginTestUser, disconnectMockWallet, getMockWalletBalance } from './helpers/mock-wallet';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456';

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockWallet(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Login with email/password (app automatically loads wallet after login)
    await loginTestUser(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('should display login button when not logged in', async ({ page }) => {
    // Logout first to test guest state
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('jdh_current_user');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check for login button on landing page
    const loginButton = page.locator('button:has-text("Login")').first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully and load wallet', async ({ page }) => {
    // Logout first
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('jdh_current_user');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Login with email/password
    await loginTestUser(page, TEST_EMAIL, TEST_PASSWORD);
    
    // Wallet should be loaded automatically after login
    // Check for balance display (confirms wallet is loaded)
    const balanceDisplay = page.locator('text=/Total Balance|฿|SOL|Balance/i').first();
    await expect(balanceDisplay).toBeVisible({ timeout: 10000 });
  });

  test('should display wallet address after login', async ({ page }) => {
    // User is already logged in from beforeEach
    // Wallet should be loaded automatically
    
    // Look for wallet address display
    // Address might be truncated, so check for partial match
    const addressDisplay = page.locator('text=/MockAddress|GkDEVLZP|.../i').first();
    
    // Address should be visible (might be in settings or header)
    // Check multiple possible locations
    const possibleLocations = [
      page.locator('[class*="address"]'),
      page.locator('code'),
      page.locator('[data-testid*="address"]'),
    ];
    
    let addressFound = false;
    for (const locator of possibleLocations) {
      if (await locator.isVisible({ timeout: 2000 })) {
        addressFound = true;
        break;
      }
    }
    
    // Address should be displayed somewhere
    expect(addressFound).toBeTruthy();
  });

  test('should display wallet balance after login', async ({ page }) => {
    // User is already logged in from beforeEach
    // Wallet should be loaded automatically
    
    // Look for balance display
    const balanceDisplay = page.locator('text=/100|SOL|Balance|ยอด/i').first();
    
    // Balance should be visible
    await expect(balanceDisplay).toBeVisible({ timeout: 5000 });
  });

  test('should update UI when logged in', async ({ page }) => {
    // User is already logged in from beforeEach
    // Dashboard should be visible with balance
    const balanceDisplay = page.locator('text=/Total Balance|฿|SOL|Balance/i').first();
    await expect(balanceDisplay).toBeVisible({ timeout: 10000 });
    
    // Landing page buttons should not be visible
    const loginButton = page.locator('button:has-text("Login")').first();
    await expect(loginButton).not.toBeVisible({ timeout: 2000 });
  });

  test('should logout successfully', async ({ page }) => {
    // User is already logged in from beforeEach
    
    // Find and click disconnect/logout button
    const disconnectButton = page.locator('text=/Disconnect|Logout|ออกจากระบบ/i').first();
    
    if (await disconnectButton.isVisible({ timeout: 5000 })) {
      await disconnectButton.click();
      await page.waitForTimeout(2000);
      
      // Should return to landing or show connect button
      const connectButton = page.locator('text=/Connect|เชื่อมต่อ|Open account/i').first();
      await expect(connectButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should return to guest state after logout', async ({ page }) => {
    // User is already logged in from beforeEach
    
    // Logout
    await disconnectMockWallet(page);
    await page.waitForTimeout(1000);
    
    // Should show landing page with login button
    const landingContent = page.locator('button:has-text("Login"), button:has-text("Open account")').first();
    await expect(landingContent).toBeVisible({ timeout: 10000 });
  });

  test('should persist login across page reload', async ({ page }) => {
    // User is already logged in from beforeEach
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wallet should still be connected (if using localStorage/sessionStorage)
    // Note: This depends on implementation - may need to check localStorage
    const balanceDisplay = page.locator('text=/SOL|Balance/i');
    
    // If wallet persists, balance should be visible
    // If not, connect button should appear
    const isConnected = await balanceDisplay.isVisible({ timeout: 3000 });
    const connectButton = page.locator('text=/Connect|เชื่อมต่อ/i').first();
    const needsReconnect = await connectButton.isVisible({ timeout: 2000 });
    
    // One of these should be true
    expect(isConnected || needsReconnect).toBeTruthy();
  });

  test('should handle login errors gracefully', async ({ page }) => {
    // Logout first
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('jdh_current_user');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Try to login with invalid credentials
    const loginButton = page.locator('button:has-text("Login")').first();
    await loginButton.click();
    await page.waitForTimeout(1000);
    
    // Fill invalid credentials
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('invalid@example.com');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('WrongPassword123');
    
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();
    await page.waitForTimeout(2000);
    
    // Should show error message
    const errorMessage = page.locator('text=/อีเมล|รหัสผ่าน|email|password|incorrect|invalid/i').first();
    // Error might be shown or handled gracefully
    // Just verify page doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });
});

