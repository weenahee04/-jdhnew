#!/bin/bash

# Script to fix Chrome Crashpad permissions issues
# This removes Crashpad directories that cause "Operation not permitted" errors

echo "🔧 Fixing Chrome Crashpad Permissions Issues..."
echo ""

# Step 1: Close all Chrome instances
echo "Step 1: Closing all Chrome instances..."
killall "Google Chrome" 2>/dev/null || true
killall "Google Chrome for Testing" 2>/dev/null || true
sleep 2
echo "✅ Chrome instances closed"
echo ""

# Step 2: Remove Chrome Crashpad directories
echo "Step 2: Removing Chrome Crashpad directories..."

CHROME_CRASHPAD="$HOME/Library/Application Support/Google/Chrome/Crashpad"
CHROME_TESTING_CRASHPAD="$HOME/Library/Application Support/Google/Chrome for Testing/Crashpad"

if [ -d "$CHROME_CRASHPAD" ]; then
  echo "  Removing: $CHROME_CRASHPAD"
  rm -rf "$CHROME_CRASHPAD"
  echo "  ✅ Removed Chrome Crashpad"
else
  echo "  ℹ️  Chrome Crashpad not found (already removed or never created)"
fi

if [ -d "$CHROME_TESTING_CRASHPAD" ]; then
  echo "  Removing: $CHROME_TESTING_CRASHPAD"
  rm -rf "$CHROME_TESTING_CRASHPAD"
  echo "  ✅ Removed Chrome for Testing Crashpad"
else
  echo "  ℹ️  Chrome for Testing Crashpad not found (already removed or never created)"
fi

echo ""
echo "✅ Crashpad directories removed"
echo ""

# Step 3: Test browser launch
echo "Step 3: Testing browser launch..."
npx playwright test --list 2>&1 | head -3
echo ""

echo "✅ Fix completed!"
echo ""
echo "Next steps:"
echo "  1. Run tests: npm run test:e2e"
echo "  2. Or run in headed mode: npx playwright test --headed"
echo ""
echo "If still crashing, try:"
echo "  1. Grant Full Disk Access to Terminal in System Settings"
echo "  2. Restart Terminal/IDE"
echo "  3. Use Firefox or WebKit instead: Edit playwright.config.ts"

