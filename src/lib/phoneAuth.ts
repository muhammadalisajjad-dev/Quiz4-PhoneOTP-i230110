import { Platform } from 'react-native';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth, firebaseInitError } from './firebase';
import { AppError, mapAuthError } from './errors';

const RECAPTCHA_CONTAINER_ID = 'quiz4-recaptcha-container';
let verifier: RecaptchaVerifier | null = null;

function requireAuth() {
  if (!auth) {
    throw new AppError('firebase-not-configured', firebaseInitError ?? 'Firebase is not configured.');
  }
  return auth;
}

/**
 * Firebase JS Phone Auth needs a browser DOM for reCAPTCHA.
 * - Web: creates an invisible reCAPTCHA verifier bound to a container div.
 * - Native (Expo Go / React Native): Firebase's JS SDK cannot render reCAPTCHA,
 *   so we throw an honest error instead of pretending an SMS was requested.
 */
function getVerifier(): RecaptchaVerifier {
  if (Platform.OS !== 'web') {
    throw new AppError(
      'native-recaptcha-unsupported',
      'Firebase reCAPTCHA cannot run inside Expo Go or a native React Native runtime.',
      'Run the web build (npx expo start --web) for the working phone-auth demo. For native Android OTP, use a development build with @react-native-firebase/auth (and Firebase Blaze billing for real SMS). Firebase predefined test numbers still need the console-configured code.',
    );
  }

  if (verifier) return verifier;

  const authInstance = requireAuth();
  const dom = globalThis as any;
  if (!dom.document) {
    throw new AppError('native-recaptcha-unsupported', 'reCAPTCHA is unavailable because there is no browser DOM.');
  }

  let container = dom.document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (!container) {
    container = dom.document.createElement('div');
    container.id = RECAPTCHA_CONTAINER_ID;
    dom.document.body.appendChild(container);
  }

  verifier = new RecaptchaVerifier(authInstance, container, {
    size: 'invisible',
    'expired-callback': () => {
      // Force a fresh challenge next time.
      resetVerifier();
    },
  });

  return verifier;
}

export function resetVerifier(): void {
  if (!verifier) return;
  try {
    (verifier as any).clear?.();
  } catch {
    // never let cleanup break a user-facing retry
  }
  verifier = null;
}

/** Requests a Firebase phone-auth verification. Resolves only when Firebase accepted it. */
export async function sendOtp(phoneE164: string): Promise<ConfirmationResult> {
  const authInstance = requireAuth();
  try {
    return await signInWithPhoneNumber(authInstance, phoneE164, getVerifier());
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
