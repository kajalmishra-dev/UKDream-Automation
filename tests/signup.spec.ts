import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage';

/**
 * Test Case 3: Sign-up form validation.
 * These tests NEVER submit valid data, so no account is created on the live site.
 * example.com is a reserved domain and can never belong to a real user.
 */
const FAKE_EMAIL = 'nobody.ukdream.test@example.com';
const VALID_LENGTH_PASSWORD = 'NotARealPassword123';

test.describe('Sign-up page - form validation', () => {
  let signupPage: SignupPage;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    await signupPage.goto();
    await expect(signupPage.heading).toBeVisible();
  });

  test('"Create account" is enabled only after accepting the privacy notice', async () => {
    // Disabled on first load
    await expect(signupPage.createAccountButton).toBeDisabled();

    // Still disabled with valid details but no consent
    await signupPage.fillForm(FAKE_EMAIL, VALID_LENGTH_PASSWORD, 'Test User');
    await expect(signupPage.createAccountButton).toBeDisabled();

    // Enabled once consent is ticked (we do NOT click it)
    await signupPage.consentCheckbox.check();
    await expect(signupPage.createAccountButton).toBeEnabled();

    // Disabled again if consent is removed
    await signupPage.consentCheckbox.uncheck();
    await expect(signupPage.createAccountButton).toBeDisabled();
  });

  test('rejects a password shorter than 8 characters', async ({ page }) => {
    await expect(signupPage.passwordHint).toBeVisible();

    await signupPage.fillForm(FAKE_EMAIL, 'short');
    await signupPage.consentCheckbox.check();

    // Safety guard: confirm the browser will block the form BEFORE clicking
    expect(await signupPage.isFieldValid(signupPage.passwordInput)).toBe(false);
    expect(await signupPage.isFieldValid(signupPage.emailInput)).toBe(true);

    await signupPage.createAccountButton.click();

    // Nothing was submitted: still on the sign-up page with the form visible
    await expect(page).toHaveURL(/\/signup$/);
    await expect(signupPage.heading).toBeVisible();
  });

  test('rejects an invalid email format', async ({ page }) => {
    await signupPage.fillForm('not-an-email', VALID_LENGTH_PASSWORD);
    await signupPage.consentCheckbox.check();

    // Safety guard: confirm the browser will block the form BEFORE clicking
    expect(await signupPage.isFieldValid(signupPage.emailInput)).toBe(false);
    expect(await signupPage.isFieldValid(signupPage.passwordInput)).toBe(true);

    await signupPage.createAccountButton.click();

    await expect(page).toHaveURL(/\/signup$/);
    await expect(signupPage.heading).toBeVisible();
  });

  test('privacy notice opens in a new tab and "Sign in" goes to the login page', async ({ page, context }) => {
    // The privacy link has target="_blank", so wait for the new tab
    const [privacyTab] = await Promise.all([
      context.waitForEvent('page'),
      signupPage.privacyNoticeLink.click(),
    ]);
    await expect(privacyTab).toHaveURL(/\/privacy$/);
    await expect(privacyTab.getByRole('heading', { level: 1 })).toHaveText('Your privacy, in plain words');
    await privacyTab.close();

    // The original tab stays on sign-up, and the consent box was not ticked by the link click
    await expect(page).toHaveURL(/\/signup$/);
    await expect(signupPage.consentCheckbox).not.toBeChecked();

    // "Sign in" link takes the user to the login page
    await signupPage.signInLink.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});
