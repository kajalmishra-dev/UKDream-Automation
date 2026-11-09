import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for profile & settings: https://app.myukdream.com/settings
 *
 * SAFETY: this page also has "Delete my account", "Save changes" and
 * "Download my data". On purpose, this class exposes ONLY the Sign out button,
 * so no test can click a destructive control by mistake.
 */
export class SettingsPage {
  readonly page: Page;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // exact: true so it can never match any other button
    this.signOutButton = page.getByRole('button', { name: 'Sign out', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }
}
