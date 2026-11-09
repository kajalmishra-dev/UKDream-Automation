/**
 * Reads a required environment variable (loaded from .env by playwright.config.ts).
 *
 * Throws a clear error if it is missing or still the placeholder from .env.example,
 * so a forgotten setup step is obvious instead of causing a confusing timeout.
 * Never log the returned value - it may be a password.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value || value.startsWith('your-')) {
    throw new Error(
      `Missing environment variable "${name}". ` +
        'Copy .env.example to .env and fill in your test account details.',
    );
  }

  return value;
}

export interface StudentCredentials {
  email: string;
  password: string;
}

/**
 * The test student account from .env (UKDREAM_STUDENT_EMAIL / UKDREAM_STUDENT_PASSWORD).
 * Call this inside a test or hook, not at the top of a file, so a missing .env
 * only fails the tests that actually need an account.
 */
export function getStudentCredentials(): StudentCredentials {
  return {
    email: getRequiredEnv('UKDREAM_STUDENT_EMAIL'),
    password: getRequiredEnv('UKDREAM_STUDENT_PASSWORD'),
  };
}
