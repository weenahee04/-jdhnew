# Browser Crash (SIGSEGV/SIGABRT) - Complete Solution

## Problem
Playwright browsers crash immediately on launch with:
- **Chromium**: `SIGSEGV` (Segmentation fault)
- **System Chrome**: `SIGABRT` + `Operation not permitted` (Crashpad permissions)
- **WebKit**: `Abort trap: 6`
- **Firefox**: `SIGABRT`

## Root Cause
This is a **macOS permissions issue** with Chrome's Crashpad directory, not a test code issue.

## Solutions (Try in Order)

### Solution 1: Run in Headed Mode (Easiest)
```bash
npx playwright test --headed
```
Headless mode has more restrictions. Headed mode often works when headless fails.

### Solution 2: Fix Chrome Crashpad Permissions
```bash
# Close all Chrome instances first
killall "Google Chrome" 2>/dev/null || true

# Delete Crashpad directory
rm -rf ~/Library/Application\ Support/Google/Chrome/Crashpad

# Run the fix script
./fix-browser-crash.sh
```

### Solution 3: Use System Chrome (Already Configured)
The `playwright.config.ts` is already configured to use system Chrome:
```typescript
channel: 'chrome', // Uses /Applications/Google Chrome.app
```

If it still crashes, try:
```bash
# Reinstall Playwright browsers
npx playwright install --force chromium
```

### Solution 4: Grant Full Disk Access (macOS)
1. Open **System Settings** > **Privacy & Security** > **Full Disk Access**
2. Add Terminal (or your IDE) to the list
3. Restart Terminal/IDE

### Solution 5: Run Fix Script
```bash
chmod +x fix-browser-crash.sh
./fix-browser-crash.sh
```

## Current Configuration
- ✅ Using system Chrome (`channel: 'chrome'`)
- ✅ Disabled crashpad (`--disable-crashpad`)
- ✅ Custom user data dir in temp
- ✅ Single worker to prevent conflicts
- ✅ Increased timeouts

## Test the Fix
```bash
# Test single test
npx playwright test tests/e2e/navigation.spec.ts:54 --headed

# Test all navigation tests
npx playwright test tests/e2e/navigation.spec.ts --headed

# Test all E2E tests
npm run test:e2e -- --headed
```

## If Still Crashing
1. **Check macOS version compatibility**
2. **Update Chrome**: Open Chrome > About Google Chrome
3. **Update Playwright**: `npm install @playwright/test@latest`
4. **Try different browser**: Comment out chromium, try firefox
5. **Check system logs**: `Console.app` > Search for "Chrome" or "Playwright"

## Alternative: Use CI/CD
If local testing is impossible, consider:
- GitHub Actions (uses Linux, no macOS permission issues)
- Docker container
- Remote test execution



