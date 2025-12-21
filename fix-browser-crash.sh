#!/bin/bash

# Script to fix Playwright browser crash issues
# Run this script to reinstall browsers and fix permissions

echo "🔧 Fixing Playwright Browser Crash Issues..."
echo ""

# Step 1: Clean Playwright cache
echo "Step 1: Cleaning Playwright cache..."
rm -rf ~/Library/Caches/ms-playwright
echo "✅ Cache cleaned"
echo ""

# Step 2: Reinstall browsers
echo "Step 2: Reinstalling Playwright browsers..."
npx playwright install chromium
echo "✅ Chromium reinstalled"
echo ""

# Step 3: Fix Chrome Crashpad permissions (if needed)
echo "Step 3: Checking Chrome Crashpad permissions..."
CHROME_SUPPORT_DIR="$HOME/Library/Application Support/Google/Chrome"
if [ -d "$CHROME_SUPPORT_DIR/Crashpad" ]; then
  echo "⚠️  Chrome Crashpad directory exists"
  echo "   If you see permission errors, you may need to:"
  echo "   1. Close all Chrome instances"
  echo "   2. Delete: $CHROME_SUPPORT_DIR/Crashpad"
  echo "   3. Restart Chrome"
else
  echo "✅ No Crashpad directory found"
fi
echo ""

# Step 4: Test browser launch
echo "Step 4: Testing browser launch..."
npx playwright test --list 2>&1 | head -5
echo ""

echo "✅ Fix script completed!"
echo ""
echo "If browsers still crash, try:"
echo "  1. Run tests in headed mode: npx playwright test --headed"
echo "  2. Use system Chrome: Already configured in playwright.config.ts"
echo "  3. Check macOS permissions in System Settings > Privacy & Security"



