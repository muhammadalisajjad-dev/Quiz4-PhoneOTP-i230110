import { Platform } from 'react-native';
import * as firebaseAuth from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth, firebaseInitError } from './firebase';
import { AppError, mapAuthError } from './errors';

const RECAPTCHA_CONTAINER_ID = 'quiz4-recaptcha-container';
const FAKE_RECAPTCHA_TOKEN = 'NO_RECAPTCHA';
let verifier: any = null;

function requireAuth() {
  if (!auth) {
    throw new AppError('firebase-not-configured', firebaseInitError ?? 'Firebase is not configured.');
  }
  return auth as any;
}

/**
 * Web: real invisible reCAPTCHA via the Firebase JS SDK.
 * Native: Firebase's JS phone-auth build cannot render reCAPTCHA, so we use
 * Firebase's documented testing mode (appVerificationDisabledForTesting) plus a
 * minimal ApplicationVerifier. Firebase only accepts this for predefined test
 * phone numbers; real numbers still fail, which is honest and expected.
 */
function getVerifier(): any {
  if (Platform.OS === 'web') {
    if (verifier) return verifier;

    const authInstance = requireAuth();
    const RecaptchaVerifierCtor = (firebaseAuth as any).RecaptchaVerifier;
    if (!RecaptchaVerifierCtor) {
      throw new AppError('recaptcha-unavailable', 'reCAPTCHA is unavailable in this web runtime.');
    }

    const dom = globalThis as any;
    if (!dom.document) {
      throw new AppError('recaptcha-unavailable', 'reCAPTCHA is unavailable because there is no browser DOM.');
    }

    let container = dom.document.getElementById(RECAPTCHA_CONTAINER_ID);
    if (!container) {
      container = dom.document.createElement('div');
      container.id = RECAPTCHA_CONTAINER_ID;
      dom.document.body.appendChild(container);
    }

    verifier = new RecaptchaVerifierCtor(authInstance, container, {
      size: 'invisible',
      'expired-callback': () => resetVerifier(),
    });
    return verifier;
  }

  // Native / Expo Go — development/testing path for Firebase test numbers.
  const authInstance = requireAuth();
  authInstance.settings.appVerificationDisabledForTesting = true;
  return {
    type: 'recaptcha',
    verify: async () => FAKE_RECAPTCHA_TOKEN,
    _reset: () => undefined,
    render: async () => 0,
    clear: () => undefined,
  };
}

export function resetVerifier(): void {
  if (!verifier) return;
  try {
    verifier.clear?.();
  } catch {
    // never let cleanup break a user-facing retry
  }
  verifier = null;
}

/** Requests a Firebase phone-auth verification. Resolves only when Firebase accepted it. */
export async function sendOtp(phoneE164: string): Promise<ConfirmationResult> {
  const authInstance = requireAuth();
  try {
    return await firebaseAuth.signInWithPhoneNumber(authInstance, phoneE164, getVerifier());
  } catch (error) {
    resetVerifier();
    throw mapAuthError(error);
  }
}

/** Confirms the 6-digit code with Firebase. Rejects for wrong/expired codes. */
export async function verifyOtp(confirmation: ConfirmationResult, code: string) {
  try {
    return await confirmation.confirm(code);
  } catch (error) {
    throw mapAuthError(error);
  }
}
