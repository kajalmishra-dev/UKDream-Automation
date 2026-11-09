import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Test Case 1: Access protection and sign-in negative scenarios.
 * No real credentials are needed. The account below is fake on purpose:
 * example.com is a reserved domain, so it can never belong to a real user.
 */
const FAKE_EMAIL = 'nobody.ukdream.test@example.com';
const FAKE_PASSWORD = 'NotARealPassword123';

test.describe('Login page - access protection and invalid sign-in', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('redirects a signed-out user from a protected page to sign-in', async ({ page }) => {
    await page.goto('/journey');

    // The app should send us to /login and remember where we wanted to go
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fjourney/);

    // The sign-in form is shown, with "student" selected by default
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.studentTab).toHaveAttribute('aria-selected', 'true');
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeEnabled();
    await expect(loginPage.createAccountLink).toHaveAttribute('href', '/signup');
  });

  test('blocks sign-in when email and password are empty', async ({ page }) => {
    await loginPage.goto();
    await loginPage.signInButton.click();

    // Browser validation stops the form: both required fields are invalid
    expect(await loginPage.isFieldValid(loginPage.emailInput)).toBe(false);
    expect(await loginPage.isFieldValid(loginPage.passwordInput)).toBe(false);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toHaveCount(0);
  });

  test('blocks sign-in when the email format is invalid', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('not-an-email', FAKE_PASSWORD);

    // Email is rejected by the browser; password itself is fine
    expect(await loginPage.isFieldValid(loginPage.emailInput)).toBe(false);
    expect(await loginPage.isFieldValid(loginPage.passwordInput)).toBe(true);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toHaveCount(0);
  });

  test('shows an error for an unknown email and password', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(FAKE_EMAIL, FAKE_PASSWORD);

    // The server rejects the login and the user stays on the sign-in page
    await expect(loginPage.errorAlert).toHaveText('Incorrect email or password.');
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });
});
