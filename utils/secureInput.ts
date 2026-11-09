import { type Locator } from '@playwright/test';

/**
 * Types a sensitive value (email, password) into a field WITHOUT the value
 * appearing in Playwright step titles, the HTML report or terminal output.
 *
 * Why: locator.fill('secret') is recorded as `Fill "secret"` in the report.
 * Here the value is set inside the browser via evaluate(), which is recorded
 * only as "Evaluate" - its arguments are not shown.
 *
 * How: uses the browser's native value setter and fires the same `input` and
 * `change` events real typing produces, so the app's form logic sees the value.
 *
 * Limitation: if a test FAILS while the value is still in the field, Playwright's
 * failure snapshot (error-context.md) and screenshot can still capture it.
 */
export async function fillSecret(field: Locator, value: string): Promise<void> {
  await field.waitFor({ state: 'visible' });

  await field.evaluate((element, secret) => {
    const input = element as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    input.focus();
    nativeSetter?.call(input, secret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);

  // Confirm the field really holds the value - the error message never includes it
  const accepted = await field.evaluate(
    (element, secret) => (element as HTMLInputElement).value === secret,
    value,
  );
  if (!accepted) {
    throw new Error('fillSecret: the field did not accept the value (value hidden for security).');
  }
}
