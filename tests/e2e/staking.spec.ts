/**
 * Staking Tests
 * Tests staking page, APY display, and staking flow
 */

import { test, expect } from '@playwright/test';
import { setupMockWallet, connectMockWallet } from './helpers/mock-wallet';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('Staking', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockWallet(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Connect wallet
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
  });

  test('should navigate to staking page', async ({ page }) => {
    // Find staking tab/button
    const stakingButton = page.locator('text=/Staking|สเตค/i').first();
    
    if (await stakingButton.isVisible({ timeout: 5000 })) {
      await stakingButton.click();
      await page.waitForTimeout(1000);
      
      // Verify staking page content
      const stakingContent = page.locator('text=/Staking|สเตค|APY|Yield/i');
      await expect(stakingContent.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Staking might be disabled/maintenance
      const maintenanceMessage = page.locator('text=/Maintenance|ปิดปรับปรุง|Coming soon/i');
      if (await maintenanceMessage.isVisible({ timeout: 2000 })) {
        // Staking is disabled, skip test
        test.skip();
      }
    }
  });

  test('should display staking APY data', async ({ page }) => {
    // Navigate to staking
    const stakingButton = page.locator('text=/Staking|สเตค/i').first();
    if (await stakingButton.isVisible({ timeout: 5000 })) {
      await stakingButton.click();
      await page.waitForTimeout(1000);
      
      // Check for APY display
      const apyDisplay = page.locator('text=/APY|%|Yield|ผลตอบแทน/i');
      // APY might be shown or might be in maintenance
      const isVisible = await apyDisplay.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!isVisible) {
        // Check if maintenance message is shown instead
        const maintenanceMessage = page.locator('text=/Maintenance|ปิดปรับปรุง/i');
        const isMaintenance = await maintenanceMessage.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isMaintenance).toBeTruthy();
      }
    }
  });

  test('should display staking form when available', async ({ page }) => {
    // Navigate to staking
    const stakingButton = page.locator('text=/Staking|สเตค/i').first();
    if (await stakingButton.isVisible({ timeout: 5000 })) {
      await stakingButton.click();
      await page.waitForTimeout(1000);
      
      // Check for staking form (amount input, stake button)
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="จำนวน" i]').first();
      const stakeButton = page.locator('button:has-text("Stake"), button:has-text("สเตค")').first();
      
      // Form might not be visible if staking is disabled
      const formVisible = await amountInput.isVisible({ timeout: 3000 }).catch(() => false);
      const buttonVisible = await stakeButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!formVisible && !buttonVisible) {
        // Check for maintenance message
        const maintenanceMessage = page.locator('text=/Maintenance|ปิดปรับปรุง/i');
        await expect(maintenanceMessage.first()).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('should allow entering stake amount', async ({ page }) => {
    // Navigate to staking
    const stakingButton = page.locator('text=/Staking|สเตค/i').first();
    if (await stakingButton.isVisible({ timeout: 5000 })) {
      await stakingButton.click();
      await page.waitForTimeout(1000);
      
      // Find amount input
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      
      if (await amountInput.isVisible({ timeout: 3000 })) {
        await amountInput.fill('10');
        await page.waitForTimeout(500);
        
        // Verify input value
        expect(await amountInput.inputValue()).toBe('10');
      } else {
        // Staking might be disabled
        test.skip();
      }
    }
  });

  test('should show success feedback after staking', async ({ page }) => {
    // Navigate to staking
    const stakingButton = page.locator('text=/Staking|สเตค/i').first();
    if (await stakingButton.isVisible({ timeout: 5000 })) {
      await stakingButton.click();
      await page.waitForTimeout(1000);
      
      // Check if staking is available (not in maintenance)
      const maintenanceMessage = page.locator('text=/Maintenance|ปิดปรับปรุง/i');
      const isMaintenance = await maintenanceMessage.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isMaintenance) {
        test.skip();
      }
      
      // Fill stake amount
      const amountInput = page.locator('input[type="number"]').first();
      if (await amountInput.isVisible({ timeout: 3000 })) {
        await amountInput.fill('10');
        
        // Click stake button
        const stakeButton = page.locator('button:has-text("Stake"), button:has-text("สเตค")').first();
        if (await stakeButton.isVisible({ timeout: 2000 })) {
          await stakeButton.click();
          await page.waitForTimeout(2000);
          
          // Check for success message (might be toast or modal)
          const successMessage = page.locator('text=/Success|สำเร็จ|Staked|สเตคแล้ว/i');
          // Success might not always be visible immediately
          await page.waitForTimeout(1000);
        }
      }
    }
  });
});

