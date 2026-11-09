# UKDream-Automation

End-to-end test automation for the [UK Dream](https://app.myukdream.com) web app, built with [Playwright](https://playwright.dev) and TypeScript using the Page Object Model.

## What's covered

| Spec | What it tests | Needs a test account? |
| --- | --- | --- |
| `tests/login.spec.ts` | Access protection (redirect to sign-in) and invalid / empty sign-in attempts | No |
| `tests/signup.spec.ts` | Sign-up form validation (consent checkbox, password rules). Never submits valid data, so no accounts are created | No |
| `tests/student-login.spec.ts` | Student sign-in with a valid account, callback redirect, sign-out | Yes |
| `tests/uk-dream-e2e.spec.ts` | Five core end-to-end checks (TC-01 to TC-05) | Partly |
| `tests/example.spec.ts` | Playwright's default sample test | No |

All tests are non-destructive: they do not create, change or delete accounts on the live site.

## Project structure

```
pages/              Page Objects (LoginPage, SignupPage, HomePage, JourneyPage, SettingsPage)
tests/              Test specs
utils/
  env.ts            Reads required credentials from .env with clear error messages
  secureInput.ts    Fills secrets without exposing them in reports or logs
  formValidation.ts Checks HTML5 field validity in a browser-independent way
playwright.config.ts
.env.example        Template for local credentials
```

## Setup

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npx playwright install chromium
```

Tests that sign in need a **test** student account. Copy the template and fill it in:

```bash
cp .env.example .env
```

```env
UKDREAM_STUDENT_EMAIL=your-test-student@example.com
UKDREAM_STUDENT_PASSWORD=your-test-password-here
```

`.env` is git-ignored. Never commit real credentials. If it is missing, only the tests that need an account fail, with a clear "Missing environment variable" message.

## Running tests

```bash
npx playwright test                         # all tests
npx playwright test tests/login.spec.ts     # one file
npx playwright test --headed                # watch the browser
npx playwright test --ui                    # interactive UI mode
npx playwright show-report                  # open the HTML report
```

## Configuration notes

- **Base URL:** `https://app.myukdream.com`
- **Browser:** Chromium only. Firefox and WebKit can be enabled in `playwright.config.ts`.
- **Screenshots:** saved only when a test fails.
- **Tracing:** off on purpose, because traces can record typed credentials.
- **CI:** 2 retries, 1 worker, and `test.only` fails the build.

## Security practices

- Credentials come only from `.env`, never from source code.
- Passwords are typed with `fillSecret()` so they don't appear in step titles or the HTML report.
- `SettingsPage` exposes only the **Sign out** button, so tests cannot click "Delete my account" by accident.
- Negative tests use `example.com` addresses, which can never belong to a real user.
