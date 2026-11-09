import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { JourneyPage } from '../pages/JourneyPage';
import { SettingsPage } from '../pages/SettingsPage';
import { getStudentCredentials, type StudentCredentials } from '../utils/env';

/**
 * Test Case 2: Student sign-in with a valid test account.
 * Credentials come from .env (see .env.example) - never hardcode them here.
 */
test.describe('Student sign-in - valid test account', () => {
  let loginPage: LoginPage;
  let student: StudentCredentials;

  test.beforeEach(async ({ page }) => {
    student = getStudentCredentials(); // fails clearly if .env is not set up
    loginPage = new LoginPage(page);
  });

  test('signs in and lands on the home page', async ({ page }) => {
    const homePage = new HomePage(page);

    await loginPage.goto();
    await loginPage.login(student.email, student.password);

    // Signed-in home page: welcome heading, side menu and profile link
    await expect(page).toHaveURL(/myukdream\.com\/$/);
    await expect(homePage.welcomeHeading).toBeVisible();
    await expect(homePage.mainNav).toBeVisible();
    await expect(homePage.profileLink).toHaveAttribute('href', '/settings');
    await expect(loginPage.signInButton).toBeHidden();
  });

  test('returns to the page the user originally asked for', async ({ page }) => {
    const journeyPage = new JourneyPage(page);

    // Opening a protected page while signed out sends us to sign-in...
    await journeyPage.goto();
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fjourney/);

    // ...and after signing in we are taken back to it
    await loginPage.login(student.email, student.password);
    await expect(page).toHaveURL(/\/journey$/);
    await expect(journeyPage.heading).toBeVisible();
  });

  test('shows an error when the password is wrong', async ({ page }) => {
    await loginPage.goto();
    // Real email, deliberately wrong password (derived, so nothing is hardcoded)
    await loginPage.login(student.email, `${student.password}-wrong`);

    await expect(loginPage.errorAlert).toHaveText('Incorrect email or password.');
    await expect(page).toHaveURL(/\/login/);
  });

  test('signing out ends the session', async ({ page }) => {
    // KNOWN DEFECT (found 2026-11-04): after "Sign out" the server re-issues a valid
    // session cookie, so the user stays signed in. Remove this line once fixed -
    // Playwright will report the test as "unexpectedly passed" when that happens.
    test.fail(true, 'Known defect: user stays signed in after clicking "Sign out"');

    const homePage = new HomePage(page);
    const settingsPage = new SettingsPage(page);

    await loginPage.goto();
    await loginPage.login(student.email, student.password);
    await expect(homePage.welcomeHeading).toBeVisible();

    await settingsPage.goto();
    await settingsPage.signOut();

    // Expected: back to sign-in, and protected pages require sign-in again
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/journey');
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fjourney/);
  });
});
