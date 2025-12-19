/**
 * Navigation Smoke Tests
 * Tests all routes and navigation elements
 */

import { test, expect } from '@playwright/test';
import { setupMockWallet, connectMockWallet } from './helpers/mock-wallet';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// All routes/pages in the application
const ROUTES = {
  LANDING: '/',
  ONBOARDING: '/onboarding',
  AUTH_LOGIN: '/login',
  AUTH_REGISTER: '/register',
  WALLET_CREATE: '/wallet/create',
  WALLET_IMPORT: '/wallet/import',
  APP_HOME: '/app/home',
  APP_MARKET: '/app/market',
  APP_SWAP: '/app/swap',
  APP_WALLET: '/app/wallet',
  APP_HISTORY: '/app/history',
  APP_REWARDS: '/app/rewards',
  APP_STAKING: '/app/staking',
  APP_AIRDROP: '/app/airdrop',
  APP_MINING: '/app/mining',
  APP_SETTINGS: '/app/settings',
  APP_HELP: '/app/help',
};

// Navigation tabs (from NavTab enum)
const NAV_TABS = [
  { id: 'home', label: 'ภาพรวม|Overview' },
  { id: 'market', label: 'ตลาด|Market' },
  { id: 'swap', label: 'แลกเปลี่ยน|Swap' },
  { id: 'wallet', label: 'กระเป๋า|Portfolio' },
  { id: 'history', label: 'ประวัติ|History' },
  { id: 'rewards', label: 'รางวัล|Rewards' },
  { id: 'staking', label: 'Staking|สเตค' },
  { id: 'airdrop', label: 'Airdrop' },
  { id: 'mining', label: 'Mining|ขุดเหรียญ' },
  { id: 'settings', label: 'ตั้งค่า|Settings' },
  { id: 'help', label: 'ช่วยเหลือ|Help' },
];

test.describe('Navigation Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for page to load
    await page.waitForLoadState('networkidle');
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
    
    // Check for brand/logo
    const brand = page.locator('text=/jdh|JDH/i');
    await expect(brand.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click "Open account" or "Create account"
    const registerButton = page.locator('text=/Open account|Create account|สมัคร/i').first();
    await registerButton.click();
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    // Check for registration form elements
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Click "Login" button (exact text match)
    const loginButton = page.locator('button:has-text("Login")').first();
    await loginButton.waitFor({ timeout: 10000, state: 'visible' });
    await loginButton.click();
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate through all main navigation tabs when logged in', async ({ page }) => {
    // Setup mock wallet
    await setupMockWallet(page);
    await page.goto(BASE_URL);
    
    // Login/Register and connect wallet
    const registerButton = page.locator('text=/Open account|Create account/i').first();
    if (await registerButton.isVisible({ timeout: 2000 })) {
      await registerButton.click();
      await page.waitForTimeout(1000);
      
      // Fill registration form (if needed)
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('Test123456');
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Register|สมัคร")').first();
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigate through each tab
    for (const tab of NAV_TABS) {
      // Try to find tab in sidebar or bottom nav
      const tabButton = page.locator(`button:has-text("${tab.label}"), [data-tab="${tab.id}"]`).first();
      
      if (await tabButton.isVisible({ timeout: 2000 })) {
        await tabButton.click();
        await page.waitForTimeout(1000);
        
        // Verify page content loaded (no error messages)
        const errorMessage = page.locator('text=/Error|เกิดข้อผิดพลาด/i');
        await expect(errorMessage).not.toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await setupMockWallet(page);
    await page.goto(BASE_URL);
    
    // Wait for sidebar to appear (desktop)
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"]').first();
    
    if (await sidebar.isVisible({ timeout: 5000 })) {
      // Check sidebar links
      const sidebarLinks = sidebar.locator('button, a');
      const count = await sidebarLinks.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Click first few links
      for (let i = 0; i < Math.min(3, count); i++) {
        await sidebarLinks.nth(i).click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should have working bottom navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await setupMockWallet(page);
    await page.goto(BASE_URL);
    
    // Wait for bottom nav
    const bottomNav = page.locator('[class*="bottom"], [class*="Bottom"]').first();
    
    if (await bottomNav.isVisible({ timeout: 5000 })) {
      const navButtons = bottomNav.locator('button, a');
      const count = await navButtons.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Click navigation buttons
      for (let i = 0; i < Math.min(3, count); i++) {
        await navButtons.nth(i).click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle back navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to registration
    const registerButton = page.locator('button:has-text("Open account")').first();
    await registerButton.waitFor({ timeout: 10000, state: 'visible' });
    await registerButton.click();
    await page.waitForTimeout(1000);
    
    // Click back button
    const backButton = page.locator('button:has-text("Back"), [aria-label*="back" i]').first();
    if (await backButton.isVisible({ timeout: 2000 })) {
      await backButton.click();
      await page.waitForTimeout(1000);
      
      // Should be back on landing page
      const landingContent = page.locator('text=/Open account|Login/i');
      await expect(landingContent.first()).toBeVisible({ timeout: 5000 });
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
            !text.includes('favicon')) {
          errors.push(text);
        }
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate through a few pages
    const registerButton = page.locator('text=/Open account/i').first();
    if (await registerButton.isVisible({ timeout: 2000 })) {
      await registerButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Check for critical errors
    expect(errors.length).toBe(0);
  });
});

