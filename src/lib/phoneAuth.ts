import { Platform } from 'react-native';
import * as firebaseAuth from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth, firebaseInitError } from './firebase';
import { AppError, mapAuthError } from './errors';

const RECAPTCHA_CONTAINER_ID = 'quiz4-recaptcha-container';
// TEST_MODE is restricted to predefined Firebase test numbers only.
// It sets Firebase's documented appVerificationDisabledForTesting flag so the
// reCAPTCHA UI challenge is skipped for the coursework demo (predefined test
// numbers verify genuinely through Firebase without an SMS). This must NEVER be
// enabled for real phone numbers or production SMS flows.
const TEST_MODE = true;

const FAKE_RECAPTCHA_TOKEN = 'NO_RECAPTCHA';

let verifier: any = null;
let container: HTMLElement | null = null;
let sending = false;

function requireAuth() {
  if (!auth) {
    throw new AppError('firebase-not-configured', firebaseInitError ?? 'Firebase is not configured.');
  }
  return auth as any;
}

/** Returns (or creates) a stable, single DOM container for the reCAPTCHA widget. */
function ensureContainer(): HTMLElement {
  const dom = globalThis as any;
  if (!dom.document) {
    throw new AppError('recaptcha-unavailable', 'reCAPTCHA is unavailable because there is no browser DOM.');
  }
  let el = dom.document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (!el) {
    el = dom.document.createElement('div');
    el.id = RECAPTCHA_CONTAINER_ID;
    el.style.display = 'none';
    dom.document.body.appendChild(el);
  }
  return el;
}

/** Fully disposes the verifier and clears its container so a fresh one can be built. */
export function resetVerifier(): void {
  if (verifier) {
    try {
      verifier.clear?.();
    } catch {
      // never let cleanup break a user-facing retry
    }
    verifier = null;
  }
  if (container) {
    try {
      container.innerHTML = '';
    } catch {}
    container = null;
  }
}

/**
 * Returns ONE cached RecaptchaVerifier for the lifetime of the screen.
 *
 * Never creates a second verifier on the same DOM container — that is what
 * produces "reCAPTCHA has already been rendered in this element". The verifier
 * is created once and reused across Send OTP / retries.
 */
function getVerifier(): any {
  if (Platform.OS === 'web') {
    const authInstance = requireAuth();
    const RecaptchaVerifierCtor = (firebaseAuth as any).RecaptchaVerifier;
    if (!RecaptchaVerifierCtor) {
      throw new AppError('recaptcha-unavailable', 'reCAPTCHA is unavailable in this web runtime.');
    }

    // Test/demo mode: disable the reCAPTCHA UI challenge for predefined test
    // numbers. Must be set BEFORE creating/rendering the RecaptchaVerifier.
    if (TEST_MODE) {
      authInstance.settings.appVerificationDisabledForTesting = true;
    }

    // Reuse the existing verifier instead of recreating it.
    if (verifier) return verifier;

    const el = ensureContainer();
    verifier = new RecaptchaVerifierCtor(authInstance, el, {
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

/**
 * Requests a Firebase phone-auth verification. Resolves only when Firebase
 * accepted the request. Prevents multiple simultaneous Send OTP calls.
 */
export async function sendOtp(phoneE164: string): Promise<ConfirmationResult> {
  const authInstance = requireAuth();
  if (sending) {
    throw new AppError('otp-in-progress', 'A verification request is already in progress.');
  }
  sending = true;
  try {
    return await firebaseAuth.signInWithPhoneNumber(authInstance, phoneE164, getVerifier());
  } catch (error) {
    resetVerifier();
    throw mapAuthError(error);
  } finally {
    sending = false;
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
