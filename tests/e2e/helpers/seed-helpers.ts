/**
 * Seed Phrase Helpers for E2E Tests
 * Handles seed phrase extraction and verification quiz solving
 */

import { Page } from '@playwright/test';

/**
 * Extract seed phrase words from the backup/display screen
 * Waits for seed phrase to be visible and extracts all 12 words
 */
export async function extractSeedPhrase(page: Page): Promise<string[]> {
  // Wait for seed phrase backup screen to appear
  await page.waitForSelector('text=/จดบันทึก Seed Phrase|Seed Phrase/i', { timeout: 15000 });
  
  // Wait for the "กดเพื่อแสดง Key" button to appear (seed is hidden initially)
  const showSeedButton = page.locator('button:has-text("กดเพื่อแสดง Key"), button:has-text("Show")').first();
  if (await showSeedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Check if security warning modal appears
    const securityModal = page.locator('text=/คำเตือน|Warning|ห้ามแคปหน้าจอ/i');
    if (await securityModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click confirm/accept button in security warning
      const confirmButton = page.locator('button:has-text("ยอมรับ"), button:has-text("Accept"), button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Click to show seed phrase
    await showSeedButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Wait for seed words to be visible (not blurred)
  // Seed words are in a grid with class "grid grid-cols-3"
  // Each word is in a div with the word text in a span
  await page.waitForSelector('.grid.grid-cols-3 span.text-emerald-50', { timeout: 10000 });
  
  // Extract all 12 words from the DOM
  // Structure from WalletSetup.tsx line 262-267:
  // <div className="bg-zinc-900 border border-zinc-800 rounded-lg...">
  //   <span className="text-[9px] text-zinc-600 font-mono">{i+1}</span>
  //   <span className="text-emerald-50 font-medium">{word}</span>
  // </div>
  const seedWords = await page.evaluate(() => {
    const words: string[] = [];
    // Find the grid container with seed words
    const grid = document.querySelector('.grid.grid-cols-3');
    if (!grid) {
      console.error('Seed phrase grid not found');
      return words;
    }
    
    // Find all word containers (direct children of the grid)
    const wordContainers = Array.from(grid.children);
    
    // Sort by the number label to ensure correct order
    const sortedContainers = wordContainers.sort((a, b) => {
      const numA = parseInt(a.querySelector('span.font-mono')?.textContent || '0', 10);
      const numB = parseInt(b.querySelector('span.font-mono')?.textContent || '0', 10);
      return numA - numB;
    });
    
    sortedContainers.forEach((container) => {
      // Find the word span (has class text-emerald-50 and font-medium)
      // Try multiple selectors to be robust
      const wordSpan = container.querySelector('span.text-emerald-50, span.font-medium.text-emerald-50, span:not(.font-mono)');
      if (wordSpan && wordSpan.textContent) {
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
 * Solve the seed phrase verification quiz dynamically
 * Parses the question to find the target word index and selects the correct answer
 */
export async function solveSeedChallenge(page: Page, seedWords: string[]): Promise<void> {
  // Wait for verification screen to appear
  await page.waitForSelector('text=/ยืนยันความปลอดภัย|Verify|เลือกคำศัพท์/i', { timeout: 15000 });
  
  // Extract the question text to find the target index
  // Question format: "เลือกคำศัพท์ ลำดับที่ {index + 1} จาก Seed Phrase ของคุณ"
  // Or: "What is word #4?" or "Select the 4th word"
  const questionText = await page.locator('text=/เลือกคำศัพท์|What is word|Select.*word/i').first().textContent();
  
  if (!questionText) {
    throw new Error('Could not find verification question text');
  }
  
  console.log(`📝 Question text: ${questionText}`);
  
  // Parse the target index from the question
  // Look for patterns like:
  // - "ลำดับที่ 4" (Thai: position 4)
  // - "word #4" or "word 4"
  // - "4th word"
  // - "คำที่ 4"
  let targetIndex: number | null = null;
  
  // Pattern 1: "ลำดับที่ {number}" (Thai format)
  const thaiMatch = questionText.match(/ลำดับที่\s*(\d+)/i);
  if (thaiMatch) {
    const position = parseInt(thaiMatch[1], 10);
    // Position is 1-based, convert to 0-based index
    targetIndex = position - 1;
  }
  
  // Pattern 2: "word #4" or "word 4"
  if (targetIndex === null) {
    const wordMatch = questionText.match(/word\s*#?\s*(\d+)/i);
    if (wordMatch) {
      const position = parseInt(wordMatch[1], 10);
      targetIndex = position - 1;
    }
  }
  
  // Pattern 3: "4th word" or "4th"
  if (targetIndex === null) {
    const ordinalMatch = questionText.match(/(\d+)(?:th|st|nd|rd)\s*word/i);
    if (ordinalMatch) {
      const position = parseInt(ordinalMatch[1], 10);
      targetIndex = position - 1;
    }
  }
  
  // Pattern 4: "คำที่ {number}" (Thai: word number)
  if (targetIndex === null) {
    const thaiWordMatch = questionText.match(/คำที่\s*(\d+)/i);
    if (thaiWordMatch) {
      const position = parseInt(thaiWordMatch[1], 10);
      targetIndex = position - 1;
    }
  }
  
  // Pattern 5: Just find any number in the text (fallback)
  if (targetIndex === null) {
    const numberMatch = questionText.match(/(\d+)/);
    if (numberMatch) {
      const position = parseInt(numberMatch[1], 10);
      targetIndex = position - 1;
    }
  }
  
  if (targetIndex === null || targetIndex < 0 || targetIndex >= seedWords.length) {
    throw new Error(`Could not parse target index from question: "${questionText}". Seed words: ${seedWords.join(', ')}`);
  }
  
  // Get the correct word from our extracted seed words
  const correctWord = seedWords[targetIndex];
  
  if (!correctWord) {
    throw new Error(`Invalid target index ${targetIndex}. Seed words array length: ${seedWords.length}`);
  }
  
  console.log(`🎯 Target index: ${targetIndex + 1} (0-based: ${targetIndex}), Correct word: ${correctWord}`);
  
  // Find and click the button that contains the correct word
  // Options are in a grid with class "grid grid-cols-2" (WalletSetup.tsx line 364)
  // Each button contains the word text (line 375: {option})
  // Try multiple strategies to find the correct button
  let correctButton = page.locator(`button:has-text("${correctWord}")`).first();
  
  // If not found, try finding in the grid
  if (!(await correctButton.isVisible({ timeout: 2000 }).catch(() => false))) {
    const gridButtons = page.locator('.grid.grid-cols-2 button');
    const buttonCount = await gridButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = gridButtons.nth(i);
      const buttonText = await button.textContent();
      if (buttonText && buttonText.trim() === correctWord) {
        correctButton = button;
        break;
      }
    }
  }
  
  await correctButton.waitFor({ timeout: 10000, state: 'visible' });
  await correctButton.scrollIntoViewIfNeeded();
  await correctButton.click({ timeout: 10000 });
  
  console.log(`✅ Selected correct word: ${correctWord}`);
  
  // Wait a moment for selection to register
  await page.waitForTimeout(500);
  
  // Click the "ยืนยัน (Verify)" button to submit
  const verifyButton = page.locator('button:has-text("ยืนยัน"), button:has-text("Verify")').first();
  await verifyButton.waitFor({ timeout: 5000, state: 'visible' });
  await verifyButton.click({ timeout: 10000 });
  
  console.log(`✅ Submitted verification`);
  
  // Wait for success screen or dashboard
  await page.waitForTimeout(2000);
  
  // Check if there was an error (wrong answer)
  const errorMessage = page.locator('text=/คำศัพท์ไม่ถูกต้อง|incorrect|wrong/i');
  if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
    throw new Error('Verification failed: Wrong answer selected');
  }
  
  // Wait for success screen or dashboard to appear
  await page.waitForSelector('text=/สำเร็จ|Success|Wallet.*ready|พร้อมใช้งาน/i', { timeout: 10000 });
  console.log(`✅ Verification successful!`);
}

/**
 * Complete the full wallet creation flow:
 * 1. Extract seed phrase
 * 2. Click "ฉันจดบันทึกเรียบร้อยแล้ว"
 * 3. Solve verification quiz
 * 4. Wait for success
 */
export async function completeWalletCreation(page: Page): Promise<string[]> {
  // Step 1: Extract seed phrase
  const seedWords = await extractSeedPhrase(page);
  
  // Step 2: Click "ฉันจดบันทึกเรียบร้อยแล้ว" button to proceed to verification
  const proceedButton = page.locator('button:has-text("ฉันจดบันทึกเรียบร้อยแล้ว"), button:has-text("I have written it down")').first();
  await proceedButton.waitFor({ timeout: 10000, state: 'visible' });
  await proceedButton.click({ timeout: 10000 });
  
  // Wait for verification screen
  await page.waitForTimeout(1000);
  
  // Step 3: Solve the verification quiz
  await solveSeedChallenge(page, seedWords);
  
  // Step 4: Wait for success screen
  await page.waitForSelector('text=/สำเร็จ|Success|พร้อมใช้งาน/i', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  return seedWords;
}

