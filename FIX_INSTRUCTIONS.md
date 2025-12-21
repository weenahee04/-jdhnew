# E2E Test Fix Instructions

## Current Status
- 50 tests total
- Browser crashes prevent tests from running (SIGSEGV)
- Test code has been improved but needs browser to run

## Immediate Action Required

### Step 1: Fix Browser Installation
Run these commands in your terminal:

```bash
cd /Users/stmichael/jdhwallets/-jdhnew
npx playwright install --force chromium
```

If that doesn't work, try:
```bash
rm -rf ~/Library/Caches/ms-playwright
npx playwright install chromium
```

### Step 2: Run Tests
```bash
npm run test:e2e
```

### Step 3: If Still Crashing
Try running in headed mode:
```bash
npx playwright test --headed
```

## Test Code Improvements Made
1. ✅ Improved email input selectors with fallbacks
2. ✅ Added networkidle waits after navigation
3. ✅ Increased timeouts for slow operations
4. ✅ Added JS dispatch clicks for overlay bypass
5. ✅ Better error handling and logging

## Remaining Issues
- Browser crashes (environment issue - needs manual fix)
- Some tests may need selector adjustments once browser works

