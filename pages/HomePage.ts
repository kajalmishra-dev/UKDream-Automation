import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the signed-in home page: https://app.myukdream.com/
 */
export class HomePage {
  readonly page: Page;
  /** "Welcome, <first name>" - the name depends on the account, so match the start only */
  readonly welcomeHeading: Locator;
  /** Side menu shown on every signed-in page */
  readonly mainNav: Locator;
  /** Avatar link to /settings, e.g. "AT Automation Test Profile and settings" */
  readonly profileLink: Locator;
  /** Dashboard sections (labelled regions in the main content) */
  readonly getStartedSection: Locator;
  readonly whatToDoFirstSection: Locator;
  readonly askQuestionSection: Locator;
  readonly questionInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole('heading', { level: 1, name: /^Welcome/ });
    this.mainNav = page.getByRole('navigation', { name: 'Main' });
    this.profileLink = this.mainNav.getByRole('link', { name: /Profile and settings/ });
    this.getStartedSection = page.getByRole('region', { name: 'Get started' });
    this.whatToDoFirstSection = page.getByRole('region', { name: 'What to do first' });
    this.askQuestionSection = page.getByRole('region', { name: 'Ask a question' });
    this.questionInput = this.askQuestionSection.getByRole('textbox', { name: 'Your question' });
  }

  /** A link in the side menu, e.g. navLink('My path') */
  navLink(name: string): Locator {
    return this.mainNav.getByRole('link', { name, exact: true });
  }
}
