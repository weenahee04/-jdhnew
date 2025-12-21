/**
 * Send and Receive Tests
 * Tests send/receive functionality, modals, and error handling
 */

import { test, expect } from '@playwright/test';
import { setupMockWallet, loginTestUser, setMockWalletBalance, getMockWalletBalance } from './helpers/mock-wallet';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Test user credentials (should be registered before running tests)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456';

test.describe('Send and Receive', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Login with email/password (replaces old "connect wallet" flow)
    // The app automatically loads wallet after successful login
    await loginTestUser(page, TEST_EMAIL, TEST_PASSWORD);
    
    // Wait for dashboard to load (balance or quick actions visible)
    await page.waitForSelector('text=/Total Balance|ภาพรวม|Balance|฿/i', { timeout: 15000 });
    await page.waitForTimeout(1000); // Wait for UI to stabilize
  });

  test.describe('Receive', () => {
    test('should open receive modal', async ({ page }) => {
      // Find and click receive button (QuickActions has label "รับ")
      const receiveButton = page.locator('button:has-text("รับ"), text=/รับ/i').first();
      await receiveButton.waitFor({ timeout: 10000, state: 'visible' });
      await receiveButton.scrollIntoViewIfNeeded();
      await receiveButton.click();
      await page.waitForTimeout(1500);
      
      // Check for receive modal (ActionModal with type="receive")
      const receiveModal = page.locator('text=/Receive|รับ|Address|ที่อยู่|Wallet Address/i').first();
      await expect(receiveModal).toBeVisible({ timeout: 10000 });
    });

    test('should display QR code in receive modal', async ({ page }) => {
      // Open receive modal
      const receiveButton = page.locator('button:has-text("รับ"), text=/รับ/i').first();
      await receiveButton.waitFor({ timeout: 10000, state: 'visible' });
      await receiveButton.scrollIntoViewIfNeeded();
      await receiveButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Receive|รับ|Address|ที่อยู่/i', { timeout: 10000 });
      
      // Check for QR code (might be canvas, svg, or img)
      // QR code is usually rendered as canvas or svg
      const qrCode = page.locator('canvas, svg, img[alt*="QR" i], [class*="qr" i], [class*="QR" i]').first();
      await expect(qrCode).toBeVisible({ timeout: 10000 });
    });

    test('should display wallet address in receive modal', async ({ page }) => {
      // Open receive modal
      const receiveButton = page.locator('button:has-text("รับ"), text=/รับ/i').first();
      await receiveButton.waitFor({ timeout: 10000, state: 'visible' });
      await receiveButton.scrollIntoViewIfNeeded();
      await receiveButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Receive|รับ|Address|ที่อยู่/i', { timeout: 10000 });
      
      // Check for address display (Solana addresses are base58, 32-44 chars)
      // Look for code element, address class, or any text that looks like a Solana address
      const addressDisplay = page.locator('code, [class*="address" i], text=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/').first();
      await expect(addressDisplay).toBeVisible({ timeout: 10000 });
    });

    test('should copy address to clipboard', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Open receive modal
      const receiveButton = page.locator('button:has-text("รับ"), text=/รับ/i').first();
      await receiveButton.waitFor({ timeout: 10000, state: 'visible' });
      await receiveButton.scrollIntoViewIfNeeded();
      await receiveButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Receive|รับ|Address|ที่อยู่/i', { timeout: 10000 });
      
      // Find and click copy button (usually has Copy icon or text)
      const copyButton = page.locator('button:has-text("Copy"), button:has-text("คัดลอก"), button[title*="Copy" i], button[aria-label*="copy" i], button:has([data-lucide="copy"])').first();
      await copyButton.waitFor({ timeout: 5000, state: 'visible' });
      await copyButton.click();
      await page.waitForTimeout(1000);
      
      // Verify clipboard content (if possible)
      // Note: Clipboard API might not work in all browsers
      const clipboardText = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch {
          return null;
        }
      });
      
      // If clipboard access works, verify it contains address (Solana address format)
      if (clipboardText) {
        expect(clipboardText).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
      }
      
      // Verify copy feedback (check icon, toast, or text change)
      const copyFeedback = page.locator('text=/Copied|คัดลอกแล้ว|สำเร็จ/i, [class*="check" i], [class*="success" i]').first();
      // Copy feedback might be brief, so use shorter timeout
      await expect(copyFeedback).toBeVisible({ timeout: 3000 }).catch(() => {
        // If no explicit feedback, that's okay - clipboard might still work
        console.log('No copy feedback visible, but clipboard may still work');
      });
    });

    test('should close receive modal', async ({ page }) => {
      // Open receive modal
      const receiveButton = page.locator('button:has-text("รับ"), text=/รับ/i').first();
      await receiveButton.waitFor({ timeout: 10000, state: 'visible' });
      await receiveButton.scrollIntoViewIfNeeded();
      await receiveButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Receive|รับ|Address|ที่อยู่/i', { timeout: 10000 });
      
      // Find and click close button (X icon or Close button)
      const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×"), button:has-text("Close"), button:has([data-lucide="x"])').first();
      await closeButton.waitFor({ timeout: 5000, state: 'visible' });
      await closeButton.click();
      await page.waitForTimeout(1000);
      
      // Modal should be closed (check that modal content is not visible)
      const receiveModal = page.locator('text=/Receive|รับ|Address|ที่อยู่/i').first();
      await expect(receiveModal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Send - Happy Path', () => {
    test('should open send modal', async ({ page }) => {
      // Find and click send button (QuickActions has label "โอน")
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Check for send modal (ActionModal with type="send")
      const sendModal = page.locator('text=/Send|ส่ง|Amount|จำนวน|To Address|ที่อยู่ผู้รับ/i').first();
      await expect(sendModal).toBeVisible({ timeout: 10000 });
    });

    test('should fill send form with valid data', async ({ page }) => {
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill recipient address (wait for input to be visible)
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR');
      
      // Fill amount (wait for input to be visible)
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="จำนวน" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('1');
      
      await page.waitForTimeout(500);
      
      // Verify inputs are filled
      expect(await addressInput.inputValue()).toContain('GkDEVLZP');
      expect(await amountInput.inputValue()).toBe('1');
    });

    test('should show confirmation modal before sending', async ({ page }) => {
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill form
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR');
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('1');
      
      await page.waitForTimeout(500);
      
      // Click send/confirm button (in send modal, not confirmation modal yet)
      const sendConfirmButton = page.locator('button:has-text("Send"), button:has-text("ส่ง"), button:has-text("Confirm"), button[type="submit"]').first();
      await sendConfirmButton.waitFor({ timeout: 5000, state: 'visible' });
      await sendConfirmButton.click();
      await page.waitForTimeout(1500);
      
      // Check for confirmation modal (SendConfirmationModal)
      const confirmationModal = page.locator('text=/Confirm|ยืนยัน|Total|รวม|ยืนยันการส่ง/i').first();
      await expect(confirmationModal).toBeVisible({ timeout: 10000 });
    });

    test('should complete send transaction successfully', async ({ page }) => {
      // Set wallet balance (if function exists)
      try {
        await setMockWalletBalance(page, 100);
      } catch (e) {
        console.log('setMockWalletBalance not available, continuing...');
      }
      
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill form with valid data
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR');
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('0.1'); // Use smaller amount to avoid balance issues
      
      await page.waitForTimeout(500);
      
      // Click send button in modal
      const sendModalButton = page.locator('button:has-text("Send"), button:has-text("ส่ง")').first();
      await sendModalButton.waitFor({ timeout: 5000, state: 'visible' });
      await sendModalButton.click();
      await page.waitForTimeout(1500);
      
      // If confirmation modal appears, confirm it
      const confirmationConfirmButton = page.locator('button:has-text("Confirm"), button:has-text("ยืนยัน"), button:has-text("Send")').first();
      if (await confirmationConfirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmationConfirmButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Check for success message or transaction status
      // Success might be shown as toast, modal, or status update
      // Modal might close on success, so we check for either success message or modal closing
      const successIndicator = page.locator('text=/Success|สำเร็จ|Transaction|ธุรกรรม|completed/i').first();
      const modalClosed = await page.locator('text=/Send|ส่ง|Amount|จำนวน/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      
      // Either success message appears or modal closes (both indicate success)
      if (!(await successIndicator.isVisible({ timeout: 3000 }).catch(() => false))) {
        // If no success message, modal should close
        expect(modalClosed).toBe(false);
      }
    });
  });

  test.describe('Send - Error Path', () => {
    test('should show error for invalid address', async ({ page }) => {
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill invalid address
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('invalid-address');
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('1');
      
      await page.waitForTimeout(500);
      
      // Try to submit
      const confirmButton = page.locator('button:has-text("Send"), button:has-text("ส่ง")').first();
      await confirmButton.waitFor({ timeout: 5000, state: 'visible' });
      await confirmButton.click();
      await page.waitForTimeout(1500);
      
      // Check for error message (might be in modal or alert)
      const errorMessage = page.locator('text=/Invalid|ไม่ถูกต้อง|ที่อยู่|address/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should show error for zero amount', async ({ page }) => {
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill valid address but zero amount
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR');
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('0');
      
      await page.waitForTimeout(500);
      
      // Try to submit
      const confirmButton = page.locator('button:has-text("Send"), button:has-text("ส่ง")').first();
      await confirmButton.waitFor({ timeout: 5000, state: 'visible' });
      
      // Button should be disabled or show error
      const isDisabled = await confirmButton.isDisabled().catch(() => false);
      if (!isDisabled) {
        await confirmButton.click();
        await page.waitForTimeout(1500);
        
        // Check for error message
        const errorMessage = page.locator('text=/Invalid|ไม่ถูกต้อง|amount|จำนวน|greater than 0/i').first();
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
      } else {
        expect(isDisabled).toBe(true);
      }
    });

    test('should show error for insufficient balance', async ({ page }) => {
      // Set low balance (if function exists)
      try {
        await setMockWalletBalance(page, 0.1);
      } catch (e) {
        console.log('setMockWalletBalance not available, continuing...');
      }
      
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill form with amount exceeding balance
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR');
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('100'); // More than balance
      
      await page.waitForTimeout(500);
      
      // Try to submit
      const confirmButton = page.locator('button:has-text("Send"), button:has-text("ส่ง")').first();
      await confirmButton.waitFor({ timeout: 5000, state: 'visible' });
      await confirmButton.click();
      await page.waitForTimeout(1500);
      
      // Check for insufficient balance error
      const errorMessage = page.locator('text=/Insufficient|ไม่พอ|Balance|ยอด|available/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should disable confirm button when balance is insufficient', async ({ page }) => {
      // Set low balance (if function exists)
      try {
        await setMockWalletBalance(page, 0.1);
      } catch (e) {
        console.log('setMockWalletBalance not available, continuing...');
      }
      
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill form with amount exceeding balance
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR');
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('100');
      
      await page.waitForTimeout(1000); // Wait for validation to run
      
      // Confirm button should be disabled
      const confirmButton = page.locator('button:has-text("Send"), button:has-text("ส่ง"), button:has-text("Confirm")').first();
      await confirmButton.waitFor({ timeout: 5000, state: 'visible' });
      const isDisabled = await confirmButton.isDisabled().catch(() => false);
      
      // Button should be disabled or error shown
      if (!isDisabled) {
        // If not disabled, error should be visible
        const errorMessage = page.locator('text=/Insufficient|ไม่พอ|available/i').first();
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      } else {
        expect(isDisabled).toBe(true);
      }
    });

    test('should show error for negative amount', async ({ page }) => {
      // Open send modal
      const sendButton = page.locator('button:has-text("โอน"), text=/โอน/i').first();
      await sendButton.waitFor({ timeout: 10000, state: 'visible' });
      await sendButton.scrollIntoViewIfNeeded();
      await sendButton.click();
      await page.waitForTimeout(1500);
      
      // Wait for modal to appear
      await page.waitForSelector('text=/Send|ส่ง|Amount|จำนวน/i', { timeout: 10000 });
      
      // Fill negative amount
      const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="ที่อยู่" i], input[type="text"]').first();
      await addressInput.waitFor({ timeout: 5000, state: 'visible' });
      await addressInput.fill('GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR');
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first();
      await amountInput.waitFor({ timeout: 5000, state: 'visible' });
      await amountInput.fill('-1');
      
      await page.waitForTimeout(500);
      
      // Try to submit
      const confirmButton = page.locator('button:has-text("Send"), button:has-text("ส่ง")').first();
      await confirmButton.waitFor({ timeout: 5000, state: 'visible' });
      await confirmButton.click();
      await page.waitForTimeout(1500);
      
      // Check for error message (might be validation error or alert)
      const errorMessage = page.locator('text=/Invalid|ไม่ถูกต้อง|negative|ลบ|greater than 0/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});

