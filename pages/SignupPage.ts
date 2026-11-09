import { type Page, type Locator } from '@playwright/test';
import { isFieldValid as checkFieldValidity } from '../utils/formValidation';

/**
 * Page Object for the sign-up page: https://app.myukdream.com/signup
 *
 * Safety note: this class can fill the form but has no "submit valid data"
 * helper, so tests cannot accidentally create real accounts on the live site.
 */
export class SignupPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordHint: Locator;
  readonly consentCheckbox: Locator;
  readonly privacyNoticeLink: Locator;
  readonly createAccountButton: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Create your free account' });
    this.nameInput = page.getByLabel('Name (optional)');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.passwordHint = page.getByText('At least 8 characters.');
    this.consentCheckbox = page.getByRole('checkbox', { name: /privacy notice/ });
    this.privacyNoticeLink = page.getByRole('link', { name: 'privacy notice' });
    this.createAccountButton = page.getByRole('button', { name: 'Create account' });
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
  }

  /** Open the sign-up page directly. */
  async goto(): Promise<void> {
    await this.page.goto('/signup');
  }

  /** Fill email and password (and optionally name). Does NOT submit. */
  async fillForm(email: string, password: string, name?: string): Promise<void> {
    if (name) {
      await this.nameInput.fill(name);
    }
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /** True if the browser considers the field valid (required / email format / min length). */
  async isFieldValid(field: Locator): Promise<boolean> {
    return checkFieldValidity(field);
  }
}
