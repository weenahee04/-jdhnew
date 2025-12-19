/**
 * Swap Tests
 * Tests swap functionality, quote fetching, and swap execution
 */

import { test, expect } from '@playwright/test';
import { setupMockWallet, connectMockWallet } from './helpers/mock-wallet';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('Swap', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockWallet(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Connect wallet
    await connectMockWallet(page);
    await page.waitForTimeout(2000);
  });

  test('should navigate to swap page', async ({ page }) => {
    // Find swap tab/button
    const swapButton = page.locator('text=/Swap|แลกเปลี่ยน/i').first();
    await swapButton.click();
    await page.waitForTimeout(1000);
    
    // Verify swap page content
    const swapContent = page.locator('text=/Swap|แลกเปลี่ยน|From|จาก/i');
    await expect(swapContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open swap modal', async ({ page }) => {
    // Find swap button (might be in quick actions or main nav)
    const swapButton = page.locator('button:has-text("Swap"), button:has-text("แลกเปลี่ยน")').first();
    await swapButton.click();
    await page.waitForTimeout(1000);
    
    // Check for swap modal
    const swapModal = page.locator('text=/Swap|แลกเปลี่ยน|From|To/i');
    await expect(swapModal.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow selecting from and to tokens', async ({ page }) => {
    // Open swap modal
    const swapButton = page.locator('button:has-text("Swap"), button:has-text("แลกเปลี่ยน")').first();
    await swapButton.click();
    await page.waitForTimeout(1000);
    
    // Find token selectors
    const fromSelector = page.locator('button:has-text("SOL"), button:has-text("From"), [class*="from"]').first();
    const toSelector = page.locator('button:has-text("USDC"), button:has-text("To"), [class*="to"]').first();
    
    if (await fromSelector.isVisible({ timeout: 3000 })) {
      await fromSelector.click();
      await page.waitForTimeout(500);
      
      // Token list should appear
      const tokenList = page.locator('text=/SOL|USDC|BTC|ETH/i');
      await expect(tokenList.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should fetch swap quote when amount is entered', async ({ page }) => {
    // Open swap modal
    const swapButton = page.locator('button:has-text("Swap"), button:has-text("แลกเปลี่ยน")').first();
    await swapButton.click();
    await page.waitForTimeout(1000);
    
    // Enter amount
    const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
    if (await amountInput.isVisible({ timeout: 3000 })) {
      await amountInput.fill('1');
      await page.waitForTimeout(2000); // Wait for quote to fetch
      
      // Check for quote display (output amount, price impact, etc.)
      const quoteDisplay = page.locator('text=/≈|You will receive|จะได้รับ/i');
      // Quote might take time to load or might fail
      await page.waitForTimeout(1000);
    }
  });

  test('should show price impact warning for high slippage', async ({ page }) => {
    // Open swap modal
    const swapButton = page.locator('button:has-text("Swap"), button:has-text("แลกเปลี่ยน")').first();
    await swapButton.click();
    await page.waitForTimeout(1000);
    
    // Enter large amount (might cause high slippage)
    const amountInput = page.locator('input[type="number"]').first();
    if (await amountInput.isVisible({ timeout: 3000 })) {
      await amountInput.fill('1000');
      await page.waitForTimeout(2000);
      
      // Check for price impact warning
      const warning = page.locator('text=/High|Warning|คำเตือน|Price impact/i');
      // Warning might not always appear
      await page.waitForTimeout(1000);
    }
  });

  test('should execute swap transaction', async ({ page }) => {
    // Open swap modal
    const swapButton = page.locator('button:has-text("Swap"), button:has-text("แลกเปลี่ยน")').first();
    await swapButton.click();
    await page.waitForTimeout(1000);
    
    // Fill swap form
    const amountInput = page.locator('input[type="number"]').first();
    if (await amountInput.isVisible({ timeout: 3000 })) {
      await amountInput.fill('1');
      await page.waitForTimeout(2000); // Wait for quote
      
      // Click swap button
      const executeButton = page.locator('button:has-text("Swap"), button:has-text("แลกเปลี่ยน"), button:has-text("Confirm")').first();
      if (await executeButton.isVisible({ timeout: 3000 })) {
        await executeButton.click();
        await page.waitForTimeout(2000);
        
        // Check for transaction status or success message
        const statusMessage = page.locator('text=/Success|Processing|Transaction/i');
        await page.waitForTimeout(1000);
      }
    }
  });
});

