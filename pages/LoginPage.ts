import { type Page, type Locator } from '@playwright/test';
import { isFieldValid as checkFieldValidity } from '../utils/formValidation';
import { fillSecret } from '../utils/secureInput';

/**
 * Page Object for the sign-in page: https://app.myukdream.com/login
 *
 * Locators use accessible roles and labels (what a user actually sees),
 * because the app has no test IDs and these are the most stable option.
 */
export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly studentTab: Locator;
  readonly mentorTab: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly createAccountLink: Locator;
  /** Error shown after a failed sign-in. The page also contains an always-empty
   *  alert (framework route announcer), so we only match alerts that have text. */
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    this.studentTab = page.getByRole('tab', { name: "I'm a student" });
    this.mentorTab = page.getByRole('tab', { name: "I'm a mentor" });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.createAccountLink = page.getByRole('link', { name: 'Create a free account' });
    this.errorAlert = page.getByRole('alert').filter({ hasText: /\S/ });
  }

  /** Open the sign-in page directly. */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Fill in the form and click "Sign in".
   * Uses fillSecret() so the email and password never appear in step titles or reports.
   */
  async login(email: string, password: string): Promise<void> {
    await fillSecret(this.emailInput, email);
    await fillSecret(this.passwordInput, password);
    await this.signInButton.click();
  }

  /** True if the browser considers the field valid (HTML5 checks like required / email format). */
  async isFieldValid(field: Locator): Promise<boolean> {
    return checkFieldValidity(field);
  }
}
