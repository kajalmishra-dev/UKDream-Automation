import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Load test credentials from the .env file in the project folder into process.env.
 * - The path is fixed to this folder, so it works no matter where you run the command from.
 * - quiet: true hides dotenv's log line on every run.
 * - If .env does not exist, nothing breaks: tests that need credentials will
 *   report a clear "Missing environment variable" error (see utils/env.ts).
 */
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

/**
 * Playwright configuration for the UK Dream automation project.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporters:
   *  - 'list' prints each test result in the terminal
   *  - 'html' builds a visual report in ./playwright-report (open with: npx playwright show-report) */
  reporter: [['list'], ['html', { open: 'never' }]],

  /* Shared settings for all the projects below. */
  use: {
    /* Lets tests use relative paths, e.g. page.goto('/login') */
    baseURL: 'https://app.myukdream.com',

    /* Save a screenshot only when a test fails (attached to the HTML report) */
    screenshot: 'only-on-failure',

    /* Tracing is OFF: traces record typed values, cookies and network data,
     * which could expose credentials. Re-enable only after a safe setup is verified. */
    trace: 'off',
  },

  /* Browsers. Starting with Chromium only to keep runs fast and simple. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to also run on Firefox and Safari (WebKit):
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
