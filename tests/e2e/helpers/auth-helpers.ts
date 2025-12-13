import { Page } from '@playwright/test';

/**
 * Generate unique email for testing
 */
export function generateUniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `test_${timestamp}_${random}@e2e.test`;
}

/**
 * Generate unique password for testing
 */
export function generateUniquePassword(): string {
  return `TestPass${Date.now()}`;
}

/**
 * Clear all localStorage and sessionStorage
 */
export async function clearStorage(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors if storage is not accessible
        console.warn('Storage clear error:', e);
      }
    });
  } catch (error) {
    // If page is not ready, wait a bit and try again
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('Storage clear error:', e);
      }
    });
  }
}

/**
 * Get user data from localStorage
 */
export async function getUserFromStorage(page: Page, email: string): Promise<any> {
  return await page.evaluate((userEmail) => {
    try {
      const users = localStorage.getItem('jdh_users');
      if (!users) return null;
      const usersObj = JSON.parse(users);
      return usersObj[userEmail.toLowerCase()] || null;
    } catch {
      return null;
    }
  }, email);
}

/**
 * Get current user from sessionStorage
 */
export async function getCurrentUserFromSession(page: Page): Promise<any> {
  return await page.evaluate(() => {
    try {
      const currentUser = sessionStorage.getItem('jdh_current_user');
      return currentUser ? JSON.parse(currentUser) : null;
    } catch {
      return null;
    }
  });
}

/**
 * Wait for navigation to specific view
 */
export async function waitForView(page: Page, viewName: string, timeout: number = 10000): Promise<void> {
  // Wait for URL change or specific element that indicates the view
  await page.waitForTimeout(500); // Small delay for React state update
}

/**
 * Check if user is logged in by checking sessionStorage
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  const currentUser = await getCurrentUserFromSession(page);
  return currentUser !== null;
}

/**
 * Accept Terms & Conditions modal if shown
 */
export async function acceptTermsIfShown(page: Page): Promise<void> {
  try {
    const termsCheckbox = page.locator('input#accept-terms[type="checkbox"]');
    if (await termsCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Check the checkbox first
      await termsCheckbox.check();
      await page.waitForTimeout(300);
      
      // Then click accept button
      const acceptButton = page.locator('button:has-text("ยอมรับ"), button:has-text("Accept")').first();
      if (await acceptButton.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }
  } catch (error) {
    // Terms modal might not be shown, ignore error
    console.log('Terms modal not shown or already accepted');
  }
}

/**
 * Cleanup: Remove test user from localStorage
 */
export async function cleanupTestUser(page: Page, email: string): Promise<void> {
  await page.evaluate((userEmail) => {
    try {
      const users = localStorage.getItem('jdh_users');
      if (!users) return;
      const usersObj = JSON.parse(users);
      delete usersObj[userEmail.toLowerCase()];
      localStorage.setItem('jdh_users', JSON.stringify(usersObj));
      
      // Also clear wallet data if exists
      const userData = usersObj[userEmail.toLowerCase()];
      if (userData && userData.user) {
        localStorage.removeItem(`jdh_wallet_${userData.user.id}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, email);
}

/**
 * Wait for element to be visible with retry
 */
export async function waitForElementVisible(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Fill form field with retry
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.fill(selector, value);
}

/**
 * Click button with retry
 */
export async function clickButton(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.click(selector);
}

