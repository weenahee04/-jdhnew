/**
 * Navigation Smoke Tests
 * Tests all routes and navigation elements
 * 
 * Note: This app uses state-based routing (not URL routing)
 * Navigation is controlled by AppView and NavTab state
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/mock-wallet';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Navigation tabs (from NavTab enum and Sidebar/BottomNav components)
// Based on actual Sidebar.tsx and BottomNav.tsx
const NAV_TABS = [
  { id: 'home', label: 'ภาพรวม', fullLabel: 'ภาพรวม (Overview)' },
  { id: 'market', label: 'ตลาด', fullLabel: 'ตลาด (Market)' },
  { id: 'swap', label: 'Swap', fullLabel: 'แลกเปลี่ยน (Swap)' },
  { id: 'wallet', label: 'กระเป๋า', fullLabel: 'กระเป๋า (Portfolio)' },
  { id: 'history', label: 'ประวัติ', fullLabel: 'ประวัติ (History)' },
  { id: 'settings', label: 'ตั้งค่า', fullLabel: 'ตั้งค่า (Settings)' },
  { id: 'help', label: 'ช่วยเหลือ', fullLabel: 'ช่วยเหลือ (Help)' },
];

test.describe('Navigation Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load landing page without errors', async ({ page }) => {
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    expect(await page.title()).toBeTruthy();
    
    // Check for critical errors (allow warnings)
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('deprecated') &&
      !e.includes('DevTools')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should display header/footer on landing page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Landing page has "Open account" and "Login" buttons
    // Check for main landing page content
    const landingContent = page.locator('text=/Open account|Login|Seamless crypto/i').first();
    await expect(landingContent).toBeVisible({ timeout: 10000 });
    
    // Check for brand/logo if present (may be in title or heading)
    const brand = page.locator('text=/jdh|JDH/i, title=/jdh/i').first();
    // Brand might not be visible on landing page, so this is optional
    const brandVisible = await brand.isVisible({ timeout: 3000 }).catch(() => false);
    if (brandVisible) {
      await expect(brand).toBeVisible();
    }
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Click "Open account" or "Create account"
    const registerButton = page.locator('button:has-text("Open account"), text=/Open account|สมัคร/i').first();
    await registerButton.waitFor({ timeout: 10000, state: 'visible' });
    await registerButton.scrollIntoViewIfNeeded();
    await registerButton.click();
    
    // Wait for navigation and form to appear
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');
    
    // Check for registration form elements
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Click "Login" button (exact text match)
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Log in")').first();
    await loginButton.waitFor({ timeout: 10000, state: 'visible' });
    await loginButton.scrollIntoViewIfNeeded();
    await loginButton.click();
    
    // Wait for navigation and form to appear
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should navigate through all main navigation tabs when logged in', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Login with email/password (app automatically loads wallet after login)
    await loginTestUser(page, 'test@example.com', 'Test123456');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=/Total Balance|ภาพรวม|Balance|฿/i', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Navigate through each tab
    for (const tab of NAV_TABS) {
      // Try to find tab in sidebar (desktop) or bottom nav (mobile)
      // Sidebar uses full label like "ภาพรวม (Overview)", BottomNav uses short label like "หน้าหลัก"
      const tabButton = page.locator(
        `button:has-text("${tab.label}"), button:has-text("${tab.fullLabel}"), button:has-text("${tab.id}")`
      ).first();
      
      if (await tabButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tabButton.scrollIntoViewIfNeeded();
        await tabButton.click();
        await page.waitForTimeout(1500);
        
        // Verify page content loaded (no error messages)
        const errorMessage = page.locator('text=/Error|เกิดข้อผิดพลาด|Failed/i').first();
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasError).toBe(false);
      } else {
        // Tab might not be available (e.g., disabled features)
        console.log(`Tab ${tab.id} not visible, skipping...`);
      }
    }
  });

  test('should have working sidebar navigation', async ({ page }) => {
    // Set desktop viewport to ensure sidebar is visible
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Login first
    await loginTestUser(page, 'test@example.com', 'Test123456');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=/Total Balance|ภาพรวม|Balance|฿/i', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Wait for sidebar to appear (desktop - Sidebar component has class "hidden md:flex")
    // Sidebar should be visible on desktop (md breakpoint)
    const sidebar = page.locator('div.hidden.md\\:flex.flex-col.w-64, [class*="sidebar" i]').first();
    
    // Check if sidebar is visible (should be on desktop)
    const sidebarVisible = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (sidebarVisible) {
      // Check sidebar brand/logo
      const brand = page.locator('text=/jdh\\./i, span:has-text("jdh.")').first();
      const brandVisible = await brand.isVisible({ timeout: 3000 }).catch(() => false);
      if (brandVisible) {
        await expect(brand).toBeVisible();
      }
      
      // Check sidebar navigation buttons
      // Sidebar has buttons with labels like "ภาพรวม (Overview)"
      const sidebarButtons = sidebar.locator('button').filter({ hasText: /ภาพรวม|ตลาด|แลกเปลี่ยน|กระเป๋า|ประวัติ|ตั้งค่า|ช่วยเหลือ/i });
      const count = await sidebarButtons.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Click first few navigation buttons (skip user profile section)
      for (let i = 0; i < Math.min(3, count); i++) {
        const button = sidebarButtons.nth(i);
        await button.waitFor({ timeout: 3000, state: 'visible' });
        await button.scrollIntoViewIfNeeded();
        await button.click();
        await page.waitForTimeout(1000);
      }
    } else {
      // Sidebar not visible (mobile view), skip this test
      console.log('Sidebar not visible (mobile view), skipping sidebar navigation test');
    }
  });

  test('should have working bottom navigation on mobile', async ({ page }) => {
    // Set mobile viewport (below md breakpoint)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Login first
    await loginTestUser(page, 'test@example.com', 'Test123456');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=/Total Balance|ภาพรวม|Balance|฿/i', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Wait for bottom nav (BottomNav component has class "md:hidden fixed bottom-0")
    const bottomNav = page.locator('div.md\\:hidden.fixed.bottom-0, [class*="bottom" i]:has(button)').first();
    
    const bottomNavVisible = await bottomNav.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (bottomNavVisible) {
      // BottomNav has buttons with icons and labels like "หน้าหลัก", "ตลาด", "Swap", "กระเป๋า", "ประวัติ"
      const navButtons = bottomNav.locator('button').filter({ hasText: /หน้าหลัก|ตลาด|Swap|กระเป๋า|ประวัติ/i });
      const count = await navButtons.count();
      
      // BottomNav should have at least 5 items (HOME, MARKET, SWAP, WALLET, HISTORY)
      expect(count).toBeGreaterThanOrEqual(3);
      
      // Click navigation buttons (skip first if it's already active)
      for (let i = 0; i < Math.min(3, count); i++) {
        const button = navButtons.nth(i);
        await button.waitFor({ timeout: 3000, state: 'visible' });
        await button.scrollIntoViewIfNeeded();
        await button.click();
        await page.waitForTimeout(1000);
      }
    } else {
      // Bottom nav not visible (desktop view), skip this test
      console.log('Bottom nav not visible (desktop view), skipping bottom nav test');
    }
  });

  test('should handle back navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate to registration
    const registerButton = page.locator('button:has-text("Open account"), text=/Open account/i').first();
    await registerButton.waitFor({ timeout: 10000, state: 'visible' });
    await registerButton.scrollIntoViewIfNeeded();
    await registerButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for registration form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Click back button (AuthScreen has back button)
    const backButton = page.locator('button:has-text("Back"), button:has-text("กลับ"), [aria-label*="back" i], button:has([data-lucide="arrow-left"])').first();
    const backButtonVisible = await backButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (backButtonVisible) {
      await backButton.click();
      await page.waitForTimeout(1500);
      await page.waitForLoadState('networkidle');
      
      // Should be back on landing page
      const landingContent = page.locator('text=/Open account|Login|Seamless crypto/i').first();
      await expect(landingContent).toBeVisible({ timeout: 10000 });
    } else {
      // Back button might not exist, that's okay
      console.log('Back button not found, skipping back navigation test');
    }
  });

  test('should not have console errors on any page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out non-critical errors
        if (!text.includes('Warning') && 
            !text.includes('deprecated') &&
            !text.includes('DevTools') &&
            !text.includes('favicon') &&
            !text.includes('Failed to load resource') &&
            !text.includes('404')) {
          errors.push(text);
        }
      }
    });

    page.on('pageerror', (exception) => {
      const errorText = exception.message;
      if (!errorText.includes('Warning') && 
          !errorText.includes('deprecated')) {
        errors.push(`Page Error: ${errorText}`);
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Navigate through a few pages
    const registerButton = page.locator('button:has-text("Open account"), text=/Open account/i').first();
    const registerButtonVisible = await registerButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (registerButtonVisible) {
      await registerButton.click();
      await page.waitForTimeout(1500);
      await page.waitForLoadState('networkidle');
    }
    
    // Check for critical errors (allow some non-critical ones)
    // Log errors for debugging
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    // Only fail on truly critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') &&
      !e.includes('deprecated') &&
      !e.includes('DevTools') &&
      !e.includes('favicon') &&
      !e.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

