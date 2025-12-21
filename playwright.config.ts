import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable parallel to prevent browser crashes
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1, // Use single worker to prevent browser crashes
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Increase timeout for full registration + wallet creation flow */
    actionTimeout: 90000, // 90 seconds for actions
    navigationTimeout: 90000, // 90 seconds for navigation
  },

  /* Global test timeout */
  timeout: 90000, // 90 seconds for full test execution

  /* Expect timeout */
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  /* Configure projects for major browsers */
  projects: [
    // Use WebKit (Safari) instead of Chromium to avoid crash issues
    // WebKit doesn't have the same permissions/crashpad issues as Chrome
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Chromium disabled due to crash issues (SIGSEGV/SIGABRT)
    // Uncomment if you want to use Chromium after fixing permissions
    // {
    //   name: 'chromium',
    //   use: { 
    //     ...devices['Desktop Chrome'],
    //     launchOptions: {
    //       args: [
    //         '--disable-dev-shm-usage',
    //         '--disable-gpu',
    //         '--no-sandbox',
    //         '--disable-setuid-sandbox',
    //         '--disable-crashpad',
    //         '--disable-breakpad',
    //       ],
    //     },
    //   },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

