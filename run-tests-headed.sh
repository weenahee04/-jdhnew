#!/bin/bash

# Run Playwright tests in headed mode (visible browser)
# This often works when headless mode crashes

echo "🚀 Running Playwright tests in HEADED mode..."
echo ""

# Run all E2E tests with visible browser
npx playwright test --headed --workers=1


