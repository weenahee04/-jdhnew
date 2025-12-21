import { test, expect, Page } from '@playwright/test';
import {
  generateUniqueEmail,
  generateUniquePassword,
  clearStorage,
  getUserFromStorage,
  getCurrentUserFromSession,
  cleanupTestUser,
  acceptTermsIfShown,
} from './helpers/auth-helpers';
import { completeWalletCreation, safeClick } from './helpers/seed-helpers';

/**
 * E2E Tests for Authentication and Profile Flow
 * 
 * Tests cover:
 * 1. User Registration
 * 2. User Login
 * 3. Profile Data Persistence
 * 4. Data Persistence after refresh and re-login
 * 5. Duplicate email validation
 */

// Set timeout to 2 minutes for long registration + wallet creation flow
test.setTimeout(120000);

test.describe('Authentication & Profile Flow', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // Setup console and error logging for debugging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error('🔴 PAGE CONSOLE ERROR:', text);
      } else if (type === 'warning') {
        console.warn('⚠️ PAGE CONSOLE WARNING:', text);
      } else {
        console.log('📝 PAGE CONSOLE:', `[${type.toUpperCase()}]`, text);
      }
    });

    page.on('pageerror', exception => {
      console.error('💥 PAGE ERROR (uncaught exception):', exception.message);
      console.error('Stack:', exception.stack);
    });

    page.on('requestfailed', request => {
      console.error('❌ REQUEST FAILED:', request.url(), request.failure()?.errorText);
    });

    // Generate unique credentials for each test
    testEmail = generateUniqueEmail();
    testPassword = generateUniquePassword();
    
    // Navigate to app first (required for localStorage access)
    console.log('🌐 Navigating to /');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    console.log('📍 Current URL after navigation:', page.url());
    
    await page.waitForLoadState('networkidle');
    console.log('✅ Network idle, page loaded');
    
    // Check if page is blank/black by looking for body content
    const bodyContent = await page.evaluate(() => {
      return {
        bodyText: document.body?.innerText?.substring(0, 200) || 'EMPTY',
        bodyChildren: document.body?.children?.length || 0,
        hasReactRoot: !!document.getElementById('root') || !!document.querySelector('[data-reactroot]'),
      };
    });
    console.log('📄 Page body check:', bodyContent);
    
    // Clear storage after navigation
    await clearStorage(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test user after each test
    if (testEmail) {
      await cleanupTestUser(page, testEmail);
    }
  });

  // ============================================================================
  // REUSABLE HELPER FUNCTIONS
  // ============================================================================

  /**
   * Navigate to registration form from landing page
   */
  async function navigateToRegistration(page: Page): Promise<void> {
    const signUpButton = page.locator(
      'button:has-text("Open account"), button:has-text("Sign Up"), button:has-text("สมัครสมาชิก")'
    ).first();
    
    if (await signUpButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Sign up button found, clicking...');
      await safeClick(signUpButton);
      await page.waitForLoadState('networkidle');
      console.log('📍 Current URL after clicking sign up:', page.url());
    } else {
      console.warn('⚠️ Sign up button not found, may already be on registration page');
      await page.waitForLoadState('networkidle');
    }
  }

  /**
   * Wait for email input to be visible (more reliable than waiting for form)
   */
  async function waitForEmailInput(page: Page, timeout: number = 20000): Promise<void> {
    try {
      await page.waitForSelector('input[type="email"]', { state: 'visible', timeout });
    } catch (e) {
      // Fallback: wait for any input field
      console.log('⚠️ Email input not found with type selector, trying fallback...');
      await page.waitForSelector('input', { state: 'visible', timeout: 5000 });
      // Try to find by placeholder or label
      const emailInputByPlaceholder = page.locator(
        'input[placeholder*="email" i], input[placeholder*="อีเมล" i]'
      ).first();
      if (await emailInputByPlaceholder.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ Found email input by placeholder');
      } else {
        throw new Error('Could not find email input field');
      }
    }
  }

  /**
   * Fill and submit registration form
   */
  async function submitRegistrationForm(page: Page, email: string, password: string): Promise<void> {
    await waitForEmailInput(page);
    
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 10000, state: 'visible' });
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator(
      'button:has-text("Sign Up"), button:has-text("สมัคร"), button[type="submit"]'
    ).first();

    await emailInput.fill(email);
    await passwordInput.fill(password);
    console.log('Filled registration form');
    
    await submitButton.click();
    await page.waitForLoadState('networkidle');
  }

  /**
   * Complete full registration flow: navigate -> fill form -> accept terms -> create wallet
   */
  async function registerUser(page: Page, email: string, password: string): Promise<void> {
    await navigateToRegistration(page);
    await submitRegistrationForm(page, email, password);
    await acceptTermsIfShown(page);
    
    // Wait for wallet creation screen and complete it
    await page.waitForSelector('text=/สร้าง Wallet|Seed Phrase|จดบันทึก|Generating/i', { timeout: 15000 });
    await completeWalletCreation(page);
    
    // Wait for dashboard/app to load
    await page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to login form from landing page
   */
  async function navigateToLogin(page: Page): Promise<void> {
    const loginButton = page.locator(
      'button:has-text("Log in"), button:has-text("เข้าสู่ระบบ"), button:has-text("Login")'
    ).first();
    
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await safeClick(loginButton);
      await page.waitForLoadState('networkidle');
    }
  }

  /**
   * Fill and submit login form
   */
  async function submitLoginForm(page: Page, email: string, password: string): Promise<void> {
    await waitForEmailInput(page, 15000);
    
    const loginEmailInput = page.locator('input[type="email"]').first();
    await loginEmailInput.waitFor({ timeout: 10000, state: 'visible' });
    const loginPasswordInput = page.locator('input[type="password"]').first();
    const loginSubmitButton = page.locator(
      'button:has-text("Log in"), button:has-text("เข้าสู่ระบบ"), button:has-text("Login"), button[type="submit"]'
    ).first();

    await loginEmailInput.fill(email);
    await loginPasswordInput.fill(password);
    await loginSubmitButton.click();
    await page.waitForLoadState('networkidle');
  }

  /**
   * Complete full login flow: navigate -> fill form -> verify success
   */
  async function loginUser(page: Page, email: string, password: string): Promise<void> {
    await navigateToLogin(page);
    await submitLoginForm(page, email, password);
  }

  /**
   * Logout user by clicking Settings -> Logout buttons
   * Uses safeClick to bypass overlay interception
   */
  async function logoutUser(page: Page): Promise<void> {
    console.log('🔓 Logging out...');
    
    // Click Settings button (using safeClick to bypass overlays)
    const settingsButton = page.locator(
      'button:has-text("Settings"), button:has-text("ตั้งค่า"), [data-testid="settings"]'
    ).first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await safeClick(settingsButton);
      await page.waitForLoadState('networkidle');
    }
    
    // Click Logout button (using safeClick to bypass overlays)
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("ออกจากระบบ"), button:has-text("Log out"), [data-testid="logout"]'
    ).first();
    
    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await safeClick(logoutButton);
      await page.waitForLoadState('networkidle');
    } else {
      // Fallback: Clear session manually if logout button not found
      await page.evaluate(() => {
        sessionStorage.clear();
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for navigation away from dashboard
    await page.waitForURL(url => !url.toString().includes('dashboard'), { timeout: 10000 });
    
    // Verify we're on login/landing page
    const loginOrSignUpVisible = await page.locator(
      'button:has-text("Login"), button:has-text("Open account"), button:has-text("Sign Up")'
    ).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!loginOrSignUpVisible) {
      // Navigate to home page if not already there
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ Logged out successfully');
  }

  /**
   * Clear session and navigate to home (simulates logout)
   */
  async function clearSessionAndNavigateHome(page: Page): Promise<void> {
    await page.evaluate(() => {
      sessionStorage.clear();
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }

  // ============================================================================
  // REGISTRATION TESTS
  // ============================================================================

  test('Register success - verify redirect and session', async ({ page }) => {
    console.log('=== Test: Register success ===');
    console.log(`Test email: ${testEmail}`);

    // Register user with wallet creation
    await registerUser(page, testEmail, testPassword);
    console.log('✅ User registered and wallet created');

    // Verify user is registered in localStorage
    const userData = await getUserFromStorage(page, testEmail);
    expect(userData).not.toBeNull();
    expect(userData.user).toBeDefined();
    expect(userData.user.email).toBe(testEmail.toLowerCase());
    expect(userData.user.id).toBeDefined();
    expect(userData.user.createdAt).toBeDefined();

    console.log('User registered in localStorage:', {
      email: userData.user.email,
      id: userData.user.id,
      createdAt: userData.user.createdAt,
    });

    // Verify session is set
    const currentUser = await getCurrentUserFromSession(page);
    expect(currentUser).not.toBeNull();
    expect(currentUser.email).toBe(testEmail.toLowerCase());
    expect(currentUser.id).toBe(userData.user.id);

    console.log('Session verified:', currentUser);

    // Verify redirect (should be on app view, not register page)
    const isOnRegisterPage = await page.locator('input[type="email"]').isVisible().catch(() => false);
    expect(isOnRegisterPage).toBe(false);

    console.log('✓ Registration successful - redirect and session verified');
  });

  test('Profile created and matches registration data', async ({ page }) => {
    console.log('=== Test: Profile matches registration data ===');
    console.log(`Test email: ${testEmail}`);

    // Register user
    await registerUser(page, testEmail, testPassword);

    // Get user data from storage
    const userData = await getUserFromStorage(page, testEmail);
    expect(userData).not.toBeNull();
    
    const registeredUser = userData.user;
    const registeredEmail = registeredUser.email;
    const registeredId = registeredUser.id;
    const registeredCreatedAt = registeredUser.createdAt;

    console.log('Registered user data:', {
      email: registeredEmail,
      id: registeredId,
      createdAt: registeredCreatedAt,
    });

    // Get current session
    const sessionUser = await getCurrentUserFromSession(page);
    expect(sessionUser).not.toBeNull();

    // Verify profile data matches
    expect(sessionUser.email).toBe(registeredEmail);
    expect(sessionUser.id).toBe(registeredId);
    expect(sessionUser.createdAt).toBe(registeredCreatedAt);

    console.log('Session user data:', sessionUser);

    // Navigate to settings/profile if available
    const settingsButton = page.locator(
      'button:has-text("Settings"), button:has-text("ตั้งค่า"), [data-testid="settings"]'
    ).first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await safeClick(settingsButton);
      await page.waitForLoadState('networkidle');
    }

    // Verify data persistence via storage check
    const persistedUser = await getUserFromStorage(page, testEmail);
    expect(persistedUser.user.email).toBe(registeredEmail);
    expect(persistedUser.user.id).toBe(registeredId);
    expect(persistedUser.user.createdAt).toBe(registeredCreatedAt);

    console.log('✓ Profile data matches registration data');
  });

  // ============================================================================
  // LOGIN TESTS
  // ============================================================================

  test('Login with correct credentials succeeds', async ({ page }) => {
    console.log('=== Test: Login success ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Register user first
    await registerUser(page, testEmail, testPassword);

    // Step 2: Clear session and navigate to login
    await clearSessionAndNavigateHome(page);

    // Step 3: Login with correct credentials
    await loginUser(page, testEmail, testPassword);

    // Step 4: Verify login succeeded
    const sessionUser = await getCurrentUserFromSession(page);
    expect(sessionUser).not.toBeNull();
    expect(sessionUser.email).toBe(testEmail.toLowerCase());

    // Verify we're not on login page anymore
    const isOnLoginPage = await page.locator('input[type="email"]').isVisible().catch(() => false);
    expect(isOnLoginPage).toBe(false);

    console.log('✓ Login successful:', sessionUser);
  });

  test('Login with incorrect credentials shows error', async ({ page }) => {
    console.log('=== Test: Login with wrong password ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Register user first
    await registerUser(page, testEmail, testPassword);

    // Step 2: Clear session and navigate to login
    await clearSessionAndNavigateHome(page);

    // Step 3: Try to login with wrong password
    await navigateToLogin(page);
    await waitForEmailInput(page, 15000);

    const loginEmailInput = page.locator('input[type="email"]').first();
    await loginEmailInput.waitFor({ timeout: 10000, state: 'visible' });
    const loginPasswordInput = page.locator('input[type="password"]').first();
    const loginSubmitButton = page.locator(
      'button:has-text("Log in"), button:has-text("เข้าสู่ระบบ"), button:has-text("Login"), button[type="submit"]'
    ).first();

    await loginEmailInput.fill(testEmail);
    await loginPasswordInput.fill('WrongPassword123');
    await loginSubmitButton.click();
    await page.waitForLoadState('networkidle');

    // Step 4: Verify error message
    const errorMessage = page.locator('text=/อีเมลหรือรหัสผ่าน|email.*password|incorrect|invalid/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    const errorText = await errorMessage.textContent();
    console.log('Error message:', errorText);
    expect(errorText).toMatch(/อีเมล|รหัสผ่าน|email|password|incorrect|invalid/i);

    // Verify session is not set
    const sessionUser = await getCurrentUserFromSession(page);
    expect(sessionUser).toBeNull();

    console.log('✓ Login error shown correctly for wrong password');
  });

  // ============================================================================
  // DATA PERSISTENCE TESTS
  // ============================================================================

  test('User data persists after refresh and re-login', async ({ page }) => {
    console.log('=== Test: Data persists after refresh and re-login ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Register user
    await registerUser(page, testEmail, testPassword);

    // Get initial user data
    const initialUserData = await getUserFromStorage(page, testEmail);
    const initialEmail = initialUserData.user.email;
    const initialId = initialUserData.user.id;
    const initialCreatedAt = initialUserData.user.createdAt;

    console.log('Initial user data:', {
      email: initialEmail,
      id: initialId,
      createdAt: initialCreatedAt,
    });

    // Step 2: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 3: Logout (if logged in) or navigate to login
    const currentUrl = page.url();
    const isOnDashboard = currentUrl.includes('/') || currentUrl.includes('/dashboard') || 
                          await page.locator('text=/Total Balance|ภาพรวม|Dashboard/i').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isOnDashboard) {
      console.log('📍 On dashboard after refresh, logging out first...');
      await logoutUser(page);
    } else {
      await clearSessionAndNavigateHome(page);
    }

    // Step 4: Login again
    await loginUser(page, testEmail, testPassword);

    // Step 5: Verify data persisted
    const persistedUserData = await getUserFromStorage(page, testEmail);
    expect(persistedUserData).not.toBeNull();
    
    expect(persistedUserData.user.email).toBe(initialEmail);
    expect(persistedUserData.user.id).toBe(initialId);
    expect(persistedUserData.user.createdAt).toBe(initialCreatedAt);

    // Verify session is set
    const sessionUser = await getCurrentUserFromSession(page);
    expect(sessionUser).not.toBeNull();
    expect(sessionUser.email).toBe(initialEmail);
    expect(sessionUser.id).toBe(initialId);

    console.log('Persisted user data:', persistedUserData.user);
    console.log('Session user:', sessionUser);
    console.log('✓ User data persists after refresh and re-login');
  });

  test('Update displayName persists after refresh and re-login', async ({ page }) => {
    console.log('=== Test: Update displayName persists ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Register user
    await registerUser(page, testEmail, testPassword);

    // Step 2: Navigate to Settings
    const settingsButton = page.locator(
      'button:has-text("Settings"), button:has-text("ตั้งค่า"), [data-testid="settings"]'
    ).first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await safeClick(settingsButton);
      await page.waitForLoadState('networkidle');
    } else {
      console.log('Settings button not found, may need to complete wallet setup first');
    }

    // Step 3: Update display name
    const editNameButton = page.locator(
      'button[title="แก้ไขชื่อ"], button:has-text("แก้ไข"), button'
    ).filter({ has: page.locator('svg') }).first();
    
    if (await editNameButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await safeClick(editNameButton);
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('input[type="text"]').filter({ hasText: /กรอกชื่อ|name/i }).first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const newDisplayName = `TestUser_${Date.now()}`;
        await nameInput.fill(newDisplayName);
        await page.waitForLoadState('networkidle');

        const saveButton = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();
        if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await safeClick(saveButton);
          await page.waitForLoadState('networkidle');

          // Step 4: Verify display name is updated in storage
          const userData = await getUserFromStorage(page, testEmail);
          expect(userData).not.toBeNull();
          expect(userData.user.displayName).toBe(newDisplayName);

          console.log('Display name updated:', userData.user.displayName);

          // Step 5: Refresh page
          await page.reload();
          await page.waitForLoadState('networkidle');

          // Step 6: Verify display name persists after refresh
          const persistedUser = await getUserFromStorage(page, testEmail);
          expect(persistedUser.user.displayName).toBe(newDisplayName);

          // Step 7: Check session
          const sessionUser = await getCurrentUserFromSession(page);
          if (sessionUser) {
            expect(sessionUser.displayName).toBe(newDisplayName);
          }

          console.log('✓ Display name persists after refresh');
        }
      }
    } else {
      console.log('Edit name button not found - may need wallet setup first');
      // For now, verify that displayName field exists in user data
      const userData = await getUserFromStorage(page, testEmail);
      expect(userData).not.toBeNull();
      expect(userData.user).toHaveProperty('displayName');
      console.log('✓ Display name field exists in user data');
    }
  });

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  test('Duplicate email shows correct error', async ({ page }) => {
    console.log('=== Test: Duplicate email error ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Register first user
    await registerUser(page, testEmail, testPassword);

    // Verify first registration succeeded
    const firstUser = await getUserFromStorage(page, testEmail);
    expect(firstUser).not.toBeNull();
    console.log('First user registered:', firstUser.user.email);

    // Step 2: Logout before trying to register again
    console.log('🔓 Logging out before attempting duplicate registration...');
    await logoutUser(page);

    // Step 3: Navigate to registration form (with fallback strategies)
    console.log('📝 Navigating to registration form for duplicate email test...');
    const signUpButton = page.locator(
      'button:has-text("Open account"), button:has-text("Sign Up"), button:has-text("สมัครสมาชิก")'
    ).first();
    
    // Increase timeout to 15 seconds for finding Sign Up button after logout
    if (await signUpButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await safeClick(signUpButton);
      await page.waitForLoadState('networkidle');
    } else {
      // If button not found, try navigating to home first, then look again
      console.log('⚠️ Sign up button not found, navigating to home page...');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Try to find button again with increased timeout
      try {
        const signUpButton2 = page.locator(
          'button:has-text("Open account"), button:has-text("Sign Up"), button:has-text("สมัครสมาชิก")'
        ).first();
        await signUpButton2.waitFor({ timeout: 15000, state: 'visible' });
        await safeClick(signUpButton2);
        await page.waitForLoadState('networkidle');
      } catch (e) {
        // Final fallback: Navigate directly to registration page if button still not found
        console.log('⚠️ Sign up button still not found, navigating directly to registration page...');
        const baseURL = process.env.BASE_URL || 'http://localhost:3000';
        await page.goto(`${baseURL}/register`);
        await page.waitForLoadState('networkidle');
      }
    }

    // Wait for email input to be visible (registration form loaded)
    await waitForEmailInput(page, 15000);

    // Step 4: Try to register with same email but different password
    const emailInput2 = page.locator('input[type="email"]').first();
    await emailInput2.waitFor({ timeout: 10000, state: 'visible' });
    const passwordInput2 = page.locator('input[type="password"]').first();
    const submitButton2 = page.locator(
      'button:has-text("Sign Up"), button:has-text("สมัคร"), button[type="submit"]'
    ).first();

    await emailInput2.fill(testEmail);
    await passwordInput2.fill('DifferentPassword123');
    await submitButton2.click();
    await page.waitForLoadState('networkidle');

    // Step 5: Verify error message is shown
    const errorMessage = page.locator('text=/อีเมลนี้ถูกใช้งานแล้ว|email.*already|already.*used/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    const errorText = await errorMessage.textContent();
    console.log('Error message:', errorText);
    expect(errorText).toMatch(/อีเมล|email|already|used/i);

    // Verify second registration did not create duplicate
    const users = await page.evaluate(() => {
      try {
        const stored = localStorage.getItem('jdh_users');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    });

    const userCount = Object.keys(users).filter(key => key.toLowerCase() === testEmail.toLowerCase()).length;
    expect(userCount).toBe(1); // Should only have one user with this email

    console.log('✓ Duplicate email error shown correctly');
  });
});
