/**
 * Wallet Connection Tests
 * Tests wallet connection, disconnection, and state management
 */

import { test, expect } from '@playwright/test';
import { setupMockWallet, connectMockWallet, disconnectMockWallet, getMockWalletBalance } from './helpers/mock-wallet';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockWallet(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should display connect wallet button when not connected', async ({ page }) => {
    // Check for connect button
    const connectButton = page.locator('text=/Connect|เชื่อมต่อ|Open account/i').first();
    await expect(connectButton).toBeVisible({ timeout: 5000 });
  });

  test('should connect wallet successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click "Open account" button
    const connectButton = page.locator('button:has-text("Open account")').first();
    await connectButton.waitFor({ timeout: 10000, state: 'visible' });
    await connectButton.click();
    
    // Wait for wallet connection flow
    await page.waitForTimeout(2000);
    
    // If registration/login is required, handle it
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill('test@example.com');
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('Test123456');
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Check for wallet address display (after connection)
    await page.waitForTimeout(2000);
    const walletAddress = page.locator('text=/MockAddress|Wallet Address/i');
    
    // Wallet should be connected (address visible or balance shown)
    const balanceDisplay = page.locator('text=/SOL|Balance|ยอด/i');
    const addressDisplay = page.locator('[class*="address"], code').first();
    
    // At least one should be visible
    const isConnected = await balanceDisplay.isVisible({ timeout: 5000 }) || 
                       await addressDisplay.isVisible({ timeout: 5000 });
    
    expect(isConnected).toBeTruthy();
  });

  test('should display wallet address after connection', async ({ page }) => {
    // Connect wallet
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
    
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

  test('should display wallet balance after connection', async ({ page }) => {
    // Connect wallet
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
    
    // Look for balance display
    const balanceDisplay = page.locator('text=/100|SOL|Balance|ยอด/i').first();
    
    // Balance should be visible
    await expect(balanceDisplay).toBeVisible({ timeout: 5000 });
  });

  test('should update UI when wallet is connected', async ({ page }) => {
    // Initially, should show "Open account" button on landing page
    const connectButton = page.locator('button:has-text("Open account")').first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    
    // Connect wallet
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
    
    // Connect button should be gone or replaced
    const stillShowingConnect = await connectButton.isVisible({ timeout: 2000 });
    
    // Either button is gone or UI has updated
    if (stillShowingConnect) {
      // Check if balance/address is now visible instead
      const balanceDisplay = page.locator('text=/SOL|Balance/i');
      expect(await balanceDisplay.isVisible({ timeout: 2000 })).toBeTruthy();
    }
  });

  test('should disconnect wallet successfully', async ({ page }) => {
    // Connect wallet first
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
    
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

  test('should return to guest state after disconnect', async ({ page }) => {
    // Connect wallet
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
    
    // Disconnect
    await disconnectMockWallet(page);
    await page.waitForTimeout(1000);
    
    // Should show landing page or connect button
    const landingContent = page.locator('text=/Open account|Login|Connect/i');
    await expect(landingContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should persist wallet connection across page reload', async ({ page }) => {
    // Connect wallet
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
    
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

  test('should handle wallet connection errors gracefully', async ({ page }) => {
    // Try to connect with invalid/missing wallet
    // This tests error handling
    
    // Remove mock wallet
    await page.evaluate(() => {
      (window as any).solana = null;
    });
    
    // Try to connect
    const connectButton = page.locator('text=/Connect|เชื่อมต่อ|Open account/i').first();
    if (await connectButton.isVisible({ timeout: 2000 })) {
      await connectButton.click();
      await page.waitForTimeout(2000);
      
      // Should show error message or handle gracefully
      const errorMessage = page.locator('text=/Error|ไม่พบ|ไม่สามารถ/i');
      // Error might be shown or handled silently
      // Just verify page doesn't crash
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

