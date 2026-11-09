import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for "My path": https://app.myukdream.com/journey
 */
export class JourneyPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'My path' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/journey');
  }
}
