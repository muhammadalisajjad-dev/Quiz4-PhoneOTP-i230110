/**
 * Normalizes Firebase / runtime failures into clear, honest, user-facing errors.
 * No message here ever claims an SMS was delivered — that is Firebase's result,
 * not ours.
 */
export class AppError extends Error {
  code: string;
  hint?: string;

  constructor(code: string, message: string, hint?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.hint = hint;
  }
}

type FirebaseLikeError = { code?: string; message?: string };

export function mapAuthError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const err = error as FirebaseLikeError;
  const code = err?.code ?? 'unknown';
  const raw = err?.message ?? (error instanceof Error ? error.message : String(error));
  const lower = `${code} ${raw}`.toLowerCase();

  // Billing / plan restrictions (Spark plan cannot send verification SMS).
  if (lower.includes('billing') || lower.includes('blaze') || code === 'auth/billing-required') {
    return new AppError(
      'billing-required',
      'Firebase blocked this request because the project is on the free Spark plan: verification SMS requires the pay-as-you-go (Blaze) plan.',
      'Without Blaze, use a Firebase predefined test phone number (Authentication → Sign-in method → Phone → Phone numbers for testing) for development, or approve enabling billing to send real SMS.',
    );
  }

  switch (code) {
    case 'auth/invalid-phone-number':
      return new AppError(
        code,
        'That phone number is not valid.',
        'Check the country code and number, e.g. +92 300 1234567.',
      );
    case 'auth/configuration-not-found':
      return new AppError(
        code,
        'Firebase Authentication is not configured for this project.',
        'Open Firebase Console → Authentication, complete the initial setup, then enable the Phone sign-in method. Also confirm the API key in .env belongs to this project.',
      );
    case 'auth/api-key-not-valid':
      return new AppError(
        code,
        'The Firebase API key is invalid for this project.',
        'Copy the Web app configuration from Firebase Console → Project settings → Your apps into .env.',
      );
    case 'auth/operation-not-allowed':
      return new AppError(
        code,
        'Phone sign-in is not enabled in this Firebase project.',
        'Firebase Console → Authentication → Sign-in method → enable “Phone”.',
      );
    case 'auth/unauthorized-domain':
      return new AppError(
        code,
        'This domain is not authorized for Firebase phone auth.',
        'Firebase Console → Authentication → Settings → Authorized domains → add this domain. Note: Firebase does not allow localhost for phone authentication.',
      );
    case 'auth/quota-exceeded':
      return new AppError(
        code,
        'Firebase SMS quota for this project has been exceeded.',
        'Try again later, use a Firebase test phone number, or review plan limits.',
      );
    case 'auth/too-many-requests':
      return new AppError(
        code,
        'Too many verification requests were attempted.',
        'Wait a while before requesting another code.',
      );
    case 'auth/captcha-check-failed':
      return new AppError(
        code,
        'The reCAPTCHA security check failed.',
        'Retry from a normal browser window (ad-blockers can block reCAPTCHA), or on native use a Firebase predefined test phone number.',
      );
    case 'auth/missing-recaptcha-token':
    case 'auth/invalid-app-credential':
      return new AppError(
        code,
        'Firebase rejected the app-verification token.',
        'On Expo Go/native, use a Firebase predefined test phone number with its console-defined code. On web, complete the reCAPTCHA and make sure the domain is authorized (localhost is not allowed for phone auth).',
      );
    case 'auth/operation-not-supported-in-this-environment':
      return new AppError(
        code,
        'Firebase phone auth is not supported in this runtime.',
        'Use the web build, or a development build with @react-native-firebase/auth for native phone auth.',
      );
    case 'auth/invalid-verification-code':
      return new AppError(code, 'The code you entered is incorrect.', 'Re-enter the 6-digit code from the SMS (or the Firebase test-number code).');
    case 'auth/code-expired':
      return new AppError(code, 'That verification code has expired.', 'Tap “Resend code” and try again.');
    case 'auth/network-request-failed':
      return new AppError(code, 'Network error — check your internet connection.');
    case 'auth/user-disabled':
      return new AppError(code, 'This phone number has been disabled by Firebase.');
    default:
      return new AppError(code, `Verification failed: ${raw}`);
  }
}
