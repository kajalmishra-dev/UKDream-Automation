import { test, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { HomePage } from '../pages/HomePage';
import { SettingsPage } from '../pages/SettingsPage';
import { getStudentCredentials } from '../utils/env';

/**
 * UK Dream - 5 core end-to-end tests (TC-01 to TC-05).
 * - Credentials come from .env via getStudentCredentials(); they are never logged.
 * - Non-destructive: no account is created or changed.
 */

/** Signs in with the student test account from .env and waits for the home page. */
async function signInAsStudent(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  const student = getStudentCredentials();

  await loginPage.goto();
  await loginPage.studentTab.click();
  await expect(loginPage.studentTab).toHaveAttribute('aria-selected', 'true');
  await loginPage.login(student.email, student.password);
}

/** True if the server says there is a signed-in user. Returns only a boolean so nothing personal is printed. */
async function hasServerSession(page: Page): Promise<boolean> {
  const response = await page.request.get('/api/auth/session');
  const session = await response.json().catch(() => null);
  return Boolean(session?.user);
}

// ---------------------------------------------------------------------------
// Public pages - no account needed
// ---------------------------------------------------------------------------
test.describe('Public sign-in page', () => {
  test('TC-01: Login page UI validation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Page loads
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();

    // Student and mentor options (student selected by default)
    await expect(loginPage.studentTab).toBeVisible();
    await expect(loginPage.studentTab).toHaveAttribute('aria-selected', 'true');
    await expect(loginPage.mentorTab).toBeVisible();

    // Email and password fields (password is masked)
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Sign in button
    await expect(loginPage.signInButton).toBeVisible();
    await expect(loginPage.signInButton).toBeEnabled();

    // "Create a free account" link goes to the sign-up page
    await expect(loginPage.createAccountLink).toHaveAttribute('href', '/signup');
    await loginPage.createAccountLink.click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(new SignupPage(page).heading).toBeVisible();
  });

  test('TC-02: Empty and invalid login validation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // 1) Empty email and password: browser blocks the form
    await loginPage.signInButton.click();
    expect(await loginPage.isFieldValid(loginPage.emailInput)).toBe(false);
    expect(await loginPage.isFieldValid(loginPage.passwordInput)).toBe(false);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toHaveCount(0);

    // 2) Invalid email format: browser blocks the form.
    //    The password text is a dummy value and is never sent - we confirm the
    //    field is invalid BEFORE clicking, so no request reaches the server.
    await loginPage.emailInput.fill('not-an-email');
    await loginPage.passwordInput.fill('dummy-value-not-sent');
    expect(await loginPage.isFieldValid(loginPage.emailInput)).toBe(false);
    await loginPage.signInButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Signed-in tests - run in order; if one fails, the rest are skipped
// (e.g. if sign-in fails, we do not try the dashboard or logout)
// ---------------------------------------------------------------------------
test.describe('Signed-in student', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-03: Valid student login', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    await signInAsStudent(page);

    // Successful authentication: left the login page, home page shown, server session exists
    await expect(page).toHaveURL(/myukdream\.com\/$/);
    await expect(homePage.welcomeHeading).toBeVisible();
    await expect(loginPage.signInButton).toBeHidden();
    expect(await hasServerSession(page), 'server should report a signed-in user').toBe(true);
  });

  test('TC-04: Student dashboard validation', async ({ page }, testInfo) => {
    const homePage = new HomePage(page);

    // Record unexpected errors while the dashboard loads
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 500 && response.url().includes('myukdream.com')) {
        serverErrors.push(`${response.status()} ${response.url().split('?')[0]}`);
      }
    });

    await signInAsStudent(page);
    await expect(homePage.welcomeHeading).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Important dashboard sections
    await expect(homePage.getStartedSection).toBeVisible();
    await expect(homePage.whatToDoFirstSection).toBeVisible();
    await expect(homePage.askQuestionSection).toBeVisible();
    await expect(homePage.questionInput).toBeVisible();

    // Main menu and profile link
    await expect(homePage.mainNav).toBeVisible();
    for (const link of ['Home', 'My path', 'Deadlines', 'Documents', 'Mentors']) {
      await expect(homePage.navLink(link)).toBeVisible();
    }
    await expect(homePage.profileLink).toBeVisible();

    // No unexpected errors.
    // Note: the page always has one alert that announces the page heading to screen
    // readers (e.g. "Welcome, Automation"), so we look for error wording instead.
    const errorWords = /error|incorrect|something went wrong|failed|try again|unable to/i;
    await expect(page.getByRole('alert').filter({ hasText: errorWords })).toHaveCount(0);
    await expect(page.getByText(/application error|something went wrong/i)).toHaveCount(0);
    expect(pageErrors, 'JavaScript errors on the page').toEqual([]);
    expect(serverErrors, 'server (5xx) errors').toEqual([]);

    // Screenshot of the dashboard for the report
    await testInfo.attach('student-dashboard', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  test('TC-05: Logout functionality', async ({ page }) => {
    const homePage = new HomePage(page);
    const settingsPage = new SettingsPage(page);

    await signInAsStudent(page);
    await expect(homePage.welcomeHeading).toBeVisible();

    // Locate the logout option: profile link -> settings -> "Sign out"
    await homePage.profileLink.click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(settingsPage.signOutButton).toBeVisible();
    await settingsPage.signOut();

    // Soft assertions: every check is reported, even if an earlier one fails
    await expect.soft(page, 'should be redirected to the login page').toHaveURL(/\/login/, { timeout: 10_000 });
    expect.soft(await hasServerSession(page), 'server session should have ended').toBe(false);
    await page.goto('/journey');
    await expect.soft(page, 'protected page should require sign-in again').toHaveURL(/\/login\?callbackUrl=%2Fjourney/);
  });
});
