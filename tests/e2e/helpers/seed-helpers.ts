/**
 * Seed Phrase Helpers for E2E Tests
 * Handles seed phrase extraction and verification quiz solving
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Safe click helper that uses JavaScript dispatch to bypass overlay interception.
 * This is necessary because overlays (modals, backdrops) can intercept pointer events.
 * 
 * @param locator - The Playwright locator to click
 * @param options - Optional click options
 */
export async function safeClick(locator: Locator, options?: { timeout?: number }): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: options?.timeout || 10000 });
  await locator.scrollIntoViewIfNeeded();
  // Use JavaScript dispatch to bypass any overlay interception
  await locator.evaluate((btn) => (btn as HTMLElement).click());
}

/**
 * Wait for an element to be hidden (useful for modals/overlays)
 */
export async function waitForHidden(locator: Locator, timeout: number = 10000): Promise<void> {
  await expect(locator).toBeHidden({ timeout });
}

/**
 * Wait for navigation away from specific paths
 */
export async function waitForNavigationAway(page: Page, excludedPaths: string[], timeout: number = 20000): Promise<void> {
  await page.waitForURL(
    url => !excludedPaths.some(path => url.toString().includes(path)),
    { timeout }
  );
}

/**
 * Handle SecurityWarningModal that appears after clicking Eye Icon
 * This modal must be dismissed before seed words are revealed
 */
async function handleSecurityWarningModal(page: Page): Promise<void> {
  console.log('🔒 Checking for SecurityWarningModal...');
  
  const securityModal = page.locator('text=/คำเตือนความปลอดภัย|คำเตือนก่อน Import|Security Warning/i');
  const isModalVisible = await securityModal.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (!isModalVisible) {
    console.log('⚠️ SecurityWarningModal not visible, seed may already be revealed');
    return;
  }
  
  console.log('🔒 SecurityWarningModal detected, dismissing...');
  
  // Find and click the "ฉันเข้าใจแล้ว" (I Understand) button
  const confirmButton = page.locator(
    'button:has-text("ฉันเข้าใจแล้ว"), button:has-text("I Understand"), button:has-text("ยืนยัน")'
  ).first();
  
  await confirmButton.waitFor({ timeout: 5000, state: 'visible' });
  await safeClick(confirmButton);
  
  // Wait for modal to close - use waitForHidden instead of arbitrary timeout
  await waitForHidden(securityModal, 5000);
  
  console.log('✅ SecurityWarningModal dismissed');
}

/**
 * Wait for seed words to be visible and proceed button to be enabled
 */
async function waitForSeedRevealed(page: Page): Promise<void> {
  console.log('⏳ Waiting for seed words to be visible...');
  
  // Wait for seed words grid to appear (not blurred)
  await page.waitForSelector('.grid.grid-cols-3 span.text-emerald-50', { timeout: 10000 });
  
  // Wait for proceed button to be visible and enabled
  const proceedButton = page.locator(
    'button:has-text("ฉันจดบันทึกเรียบร้อยแล้ว"), button:has-text("I have written it down")'
  ).first();
  
  await proceedButton.waitFor({ timeout: 5000, state: 'visible' });
  
  // Wait for button to become enabled (state change may take time)
  // Use waitFor with a condition instead of arbitrary timeout
  await page.waitForFunction(
    async () => {
      const button = document.querySelector('button:has-text("ฉันจดบันทึกเรียบร้อยแล้ว"), button:has-text("I have written it down")');
      return button && !(button as HTMLButtonElement).disabled;
    },
    { timeout: 10000 }
  ).catch(() => {
    // Fallback: check if disabled
    throw new Error('Proceed button is still disabled after revealing seed words');
  });
  
  console.log('✅ Seed words revealed and proceed button is enabled');
}

/**
 * Extract seed phrase words from the backup/display screen
 * Handles the full flow: Eye Icon click -> Security Modal -> Seed extraction
 */
export async function extractSeedPhrase(page: Page): Promise<string[]> {
  // Wait for seed phrase backup screen to appear
  await page.waitForSelector('text=/จดบันทึก Seed Phrase|Seed Phrase/i', { timeout: 15000 });
  
  // CRITICAL: Must click Eye Icon to reveal seed words before "I have written it down" button becomes enabled
  const showSeedButton = page.locator(
    'button:has-text("กดเพื่อแสดง Key"), button:has-text("Show"), button:has([data-lucide="eye"])'
  ).first();
  
  await showSeedButton.waitFor({ timeout: 10000, state: 'visible' });
  console.log('👁️ Clicking Eye Icon to reveal seed words...');
  await safeClick(showSeedButton);
  
  // Wait for SecurityWarningModal to appear (if it does)
  await page.waitForLoadState('networkidle');
  await handleSecurityWarningModal(page);
  
  // Wait for seed words to be revealed and proceed button enabled
  await waitForSeedRevealed(page);
  
  // Extract all 12 words from the DOM
  // Structure: grid.grid-cols-3 > div > span.text-emerald-50 (word) + span.font-mono (index)
  const seedWords = await page.evaluate(() => {
    const words: string[] = [];
    const grid = document.querySelector('.grid.grid-cols-3');
    if (!grid) {
      console.error('Seed phrase grid not found');
      return words;
    }
    
    // Get all word containers and sort by index number
    const wordContainers = Array.from(grid.children);
    const sortedContainers = wordContainers.sort((a, b) => {
      const numA = parseInt(a.querySelector('span.font-mono')?.textContent || '0', 10);
      const numB = parseInt(b.querySelector('span.font-mono')?.textContent || '0', 10);
      return numA - numB;
    });
    
    // Extract words from sorted containers
    sortedContainers.forEach((container) => {
      const wordSpan = container.querySelector('span.text-emerald-50, span.font-medium.text-emerald-50, span:not(.font-mono)');
      if (wordSpan?.textContent) {
        const word = wordSpan.textContent.trim();
        // Filter out numbers (the index label)
        if (word && word.length > 0 && !/^\d+$/.test(word)) {
          words.push(word);
        }
      }
    });
    
    return words;
  });
  
  // Verify we got 12 words
  if (seedWords.length !== 12) {
    throw new Error(`Expected 12 seed words, but found ${seedWords.length}. Words: ${seedWords.join(', ')}`);
  }
  
  console.log(`✅ Extracted ${seedWords.length} seed words: ${seedWords.slice(0, 3).join(', ')}...`);
  
  return seedWords;
}

/**
 * Parse the target word index from the verification question text
 * Supports multiple question formats (Thai and English)
 */
function parseQuestionIndex(questionText: string): number {
  // Pattern 1: "ลำดับที่ {number}" (Thai format)
  let match = questionText.match(/ลำดับที่\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10) - 1; // Convert 1-based to 0-based
  }
  
  // Pattern 2: "word #4" or "word 4"
  match = questionText.match(/word\s*#?\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10) - 1;
  }
  
  // Pattern 3: "4th word" or "4th"
  match = questionText.match(/(\d+)(?:th|st|nd|rd)\s*word/i);
  if (match) {
    return parseInt(match[1], 10) - 1;
  }
  
  // Pattern 4: "คำที่ {number}" (Thai: word number)
  match = questionText.match(/คำที่\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10) - 1;
  }
  
  // Pattern 5: Just find any number in the text (fallback)
  match = questionText.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10) - 1;
  }
  
  throw new Error(`Could not parse target index from question: "${questionText}"`);
}

/**
 * Solve the seed phrase verification quiz dynamically
 * Parses the question to find the target word index and selects the correct answer
 */
export async function solveSeedChallenge(page: Page, seedWords: string[]): Promise<void> {
  // Wait for verification screen to appear
  await page.waitForSelector('text=/ยืนยันความปลอดภัย|Verify|เลือกคำศัพท์/i', { timeout: 15000 });
  
  // Extract the question text to find the target index
  const questionText = await page.locator('text=/เลือกคำศัพท์|What is word|Select.*word/i').first().textContent();
  
  if (!questionText) {
    throw new Error('Could not find verification question text');
  }
  
  console.log(`📝 Question text: ${questionText}`);
  
  // Parse the target index from the question
  const targetIndex = parseQuestionIndex(questionText);
  
  if (targetIndex < 0 || targetIndex >= seedWords.length) {
    throw new Error(`Invalid target index ${targetIndex} from question: "${questionText}"`);
  }
  
  // Get the correct word from our extracted seed words
  const correctWord = seedWords[targetIndex];
  
  if (!correctWord) {
    throw new Error(`Invalid target index ${targetIndex}. Seed words array length: ${seedWords.length}`);
  }
  
  console.log(`🎯 Target index: ${targetIndex + 1} (0-based: ${targetIndex}), Correct word: ${correctWord}`);
  
  // Find and click the button that contains the correct word
  let correctButton = page.locator(`button:has-text("${correctWord}")`).first();
  
  // If not found, try finding in the grid
  if (!(await correctButton.isVisible({ timeout: 2000 }).catch(() => false))) {
    const gridButtons = page.locator('.grid.grid-cols-2 button');
    const buttonCount = await gridButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = gridButtons.nth(i);
      const buttonText = await button.textContent();
      if (buttonText?.trim() === correctWord) {
        correctButton = button;
        break;
      }
    }
  }
  
  await safeClick(correctButton);
  console.log(`✅ Selected correct word: ${correctWord}`);
  
  // Wait for selection to register (use waitForLoadState instead of timeout)
  await page.waitForLoadState('networkidle');
  
  // Click the "ยืนยัน (Verify)" button to submit
  const verifyButton = page.locator('button:has-text("ยืนยัน"), button:has-text("Verify")').first();
  await safeClick(verifyButton);
  console.log(`✅ Submitted verification`);
  
  // Wait for success screen or dashboard (use waitForSelector instead of timeout)
  await page.waitForSelector('text=/สำเร็จ|Success|Wallet.*ready|พร้อมใช้งาน/i', { timeout: 10000 });
  
  // Check if there was an error (wrong answer)
  const errorMessage = page.locator('text=/คำศัพท์ไม่ถูกต้อง|incorrect|wrong/i');
  if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
    throw new Error('Verification failed: Wrong answer selected');
  }
  
  console.log(`✅ Verification successful!`);
}

/**
 * Dismiss the WelcomeModal that appears after successful wallet creation
 * This overlay must be dismissed before the user can interact with the app
 */
async function dismissWelcomeModal(page: Page): Promise<void> {
  console.log('⏳ Waiting for WelcomeModal (success overlay) to appear...');
  
  // Wait for the overlay/modal to appear
  const welcomeModal = page.locator(
    'div.fixed.inset-0:has-text("ยินดีต้อนรับ"), div.fixed.inset-0:has-text("Welcome"), div.fixed.inset-0:has-text("พร้อมใช้งาน")'
  ).first();
  
  await welcomeModal.waitFor({ timeout: 15000, state: 'visible' });
  console.log('✅ WelcomeModal appeared');
  
  // Find the "Get Started" button
  const getStartedButton = page.locator(
    'button:has-text("เริ่มใช้งาน"), button:has-text("Get Started"), button:has-text("Go to Dashboard"), button:has-text("Done"), button:has-text("Start Trading"), button:has-text("Close")'
  ).first();
  
  // Wait for button to be visible and stable (wait for any entry animation)
  await getStartedButton.waitFor({ timeout: 10000, state: 'visible' });
  await page.waitForLoadState('networkidle'); // Wait for animations to complete
  
  console.log('🖱️ Clicking "Get Started" button to dismiss WelcomeModal...');
  await safeClick(getStartedButton);
  
  // Verify dismissal - wait for button/modal to be hidden
  console.log('⏳ Verifying WelcomeModal dismissal...');
  await waitForHidden(getStartedButton, 15000);
  
  // Verify navigation - ensure we're on dashboard/app page (not register/wallet-setup)
  console.log('⏳ Verifying navigation to dashboard...');
  await waitForNavigationAway(page, ['register', 'wallet-setup'], 20000);
  
  console.log('✅ WelcomeModal dismissed and navigation verified');
}

/**
 * Complete the full wallet creation flow:
 * 1. Extract seed phrase (clicks Eye Icon, handles Security Modal)
 * 2. Click "ฉันจดบันทึกเรียบร้อยแล้ว" to proceed to verification
 * 3. Solve verification quiz
 * 4. Dismiss WelcomeModal overlay
 * 5. Verify navigation to dashboard
 * 
 * @returns The extracted seed words array
 */
export async function completeWalletCreation(page: Page): Promise<string[]> {
  // Step 1: Extract seed phrase (this handles Eye Icon click and Security Modal)
  const seedWords = await extractSeedPhrase(page);
  
  // Step 2: Click "ฉันจดบันทึกเรียบร้อยแล้ว" button to proceed to verification
  const proceedButton = page.locator(
    'button:has-text("ฉันจดบันทึกเรียบร้อยแล้ว"), button:has-text("I have written it down")'
  ).first();
  
  await proceedButton.waitFor({ timeout: 10000, state: 'visible' });
  
  // Verify button is enabled before clicking
  const isDisabled = await proceedButton.isDisabled().catch(() => true);
  if (isDisabled) {
    throw new Error('Cannot proceed: "ฉันจดบันทึกเรียบร้อยแล้ว" button is still disabled. Make sure Eye Icon was clicked to reveal seed words.');
  }
  
  console.log('✅ Clicking "ฉันจดบันทึกเรียบร้อยแล้ว" button...');
  await safeClick(proceedButton);
  
  // Wait for verification screen to load
  await page.waitForLoadState('networkidle');
  
  // Step 3: Solve the verification quiz
  await solveSeedChallenge(page, seedWords);
  
  // Step 4: Dismiss WelcomeModal overlay
  await dismissWelcomeModal(page);
  
  return seedWords;
}
