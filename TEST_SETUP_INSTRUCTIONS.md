# 🧪 Test Setup Instructions

## 📦 Install Dependencies

Before running tests, you need to install the required dependencies:

```bash
# Install all test dependencies
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test

# Install Playwright browsers (required for E2E tests)
npx playwright install
```

## ✅ Verify Installation

```bash
# Check if Playwright is installed
npx playwright --version

# Check if Vitest is installed
npx vitest --version
```

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run with coverage
npx vitest run --coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:navigation
npm run test:e2e:wallet
npm run test:e2e:send-receive

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### All Tests + Health Report

```bash
# Run all tests (unit + E2E)
npm run test:all

# Generate comprehensive health report
npm run test:health
```

## 🔧 Troubleshooting

### Playwright command not found

If you see `playwright: command not found`:

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install Playwright browsers
npx playwright install
```

### Vitest command not found

If you see `vitest: command not found`:

```bash
# Install Vitest
npm install --save-dev vitest @vitest/ui
```

### Tests fail to connect to dev server

Make sure the dev server is running:

```bash
# Start dev server in one terminal
npm run dev

# Run tests in another terminal
npm run test:e2e
```

Or let Playwright auto-start the server (configured in `playwright.config.ts`).

### Port 3000 already in use

If port 3000 is already in use:

1. Change the port in `playwright.config.ts`:
   ```typescript
   baseURL: process.env.BASE_URL || 'http://localhost:3001',
   ```

2. Or set environment variable:
   ```bash
   BASE_URL=http://localhost:3001 npm run test:e2e
   ```

## 📊 Test Reports

After running tests, you'll find:

- **E2E HTML Report**: `playwright-report/index.html`
- **E2E Test Results**: `test-results/` directory
- **Unit Test Coverage**: `coverage/` directory (if enabled)

Open the HTML report:
```bash
npx playwright show-report
```

## 🎯 Quick Start Checklist

- [ ] Install dependencies: `npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test`
- [ ] Install Playwright browsers: `npx playwright install`
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Generate health report: `npm run test:health`

---

**Note:** Make sure your dev server is running on `http://localhost:3000` or update the base URL in `playwright.config.ts`.

