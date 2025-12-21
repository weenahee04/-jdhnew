# Browser Crash (SIGSEGV) Fix Guide

## Problem
Playwright browsers (Chromium, Firefox, WebKit) are crashing immediately on launch with:
- Chromium: `SIGSEGV` (Segmentation fault)
- Firefox: `SIGABRT` (Abort)
- WebKit: `Abort trap: 6`

This is a **system-level issue**, not a test code issue.

## Solutions

### Solution 1: Reinstall Playwright Browsers (Recommended)
```bash
cd /Users/stmichael/jdhwallets/-jdhnew
npx playwright install --force chromium
npx playwright install --force firefox
npx playwright install --force webkit
```

### Solution 2: Run in Headed Mode
```bash
npx playwright test --headed
```

### Solution 3: Use System Chrome (if available)
Update `playwright.config.ts` to use system Chrome:
```typescript
projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      channel: 'chrome', // Use system Chrome
    },
  },
],
```

### Solution 4: Check System Requirements
- macOS version compatibility
- Available memory
- Disk space

## Current Status
- ✅ Test code has been improved (better selectors, timeouts)
- ❌ Browser crashes prevent tests from running
- ⚠️ This is an environment issue that needs manual intervention

## Next Steps
1. Try Solution 1 (reinstall browsers)
2. If still failing, try Solution 2 (headed mode)
3. If still failing, check system requirements

