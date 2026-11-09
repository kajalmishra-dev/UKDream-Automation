import { type Locator } from '@playwright/test';

/**
 * Returns true if the browser considers a form field valid
 * (built-in HTML5 checks such as `required`, `type="email"` and `minlength`).
 *
 * We check the validity state instead of the browser's popup text,
 * because that text differs between Chrome, Firefox and Safari.
 */
export async function isFieldValid(field: Locator): Promise<boolean> {
  return field.evaluate((el) => (el as HTMLInputElement).validity.valid);
}
