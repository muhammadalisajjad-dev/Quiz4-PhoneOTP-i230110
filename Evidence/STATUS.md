# Verification status — Quiz 4 Phone OTP

Date: 6 November 2026
Repository: https://github.com/muhammadalisajjad-dev/Quiz4-PhoneOTP-i230110 (branch `master`)
Firebase project: `safeskip-a2`
Hosted URL: https://safeskip-a2.web.app

This document reports exactly what was and was not verified. Nothing here is simulated.

---

## Code fix applied (this session)

Fixed the Firebase reCAPTCHA verifier lifecycle in `src/lib/phoneAuth.ts`:

- The `RecaptchaVerifier` is now created **once** and cached, never recreated on every Send OTP click or React render. This eliminates the `reCAPTCHA has already been rendered in this element` error.
- One stable DOM container (`quiz4-recaptcha-container`) is used for the widget.
- A `sending` lock prevents multiple simultaneous Send OTP requests.
- Failed requests dispose of the verifier cleanly (`resetVerifier()` clears the container) so a retry builds a fresh verifier without duplicating the widget.
- Added an explicit **TEST_MODE** setting that sets `auth.settings.appVerificationDisabledForTesting = true` **before** creating the `RecaptchaVerifier`. This is Firebase's documented testing mode and is restricted to predefined test numbers only — it is never used for real phone numbers or production SMS.

Verification commands pass:
- `npx tsc --noEmit` ✅ passed
- `npx expo export --platform web` ✅ passed (807 modules bundled)
- Deployed to Firebase Hosting at `https://safeskip-a2.web.app` ✅

---

## What was verified

| Check | Command / method | Result |
|---|---|---|
| TypeScript typecheck | `npx tsc --noEmit` | ✅ **Passed** — no errors |
| Expo web export | `npx expo export --platform web` | ✅ **Passed** — 807 modules bundled to `dist/` |
| App loads at hosted URL | `https://safeskip-a2.web.app` | ✅ **Verified** — phone-entry screen loads |
| Phone-entry screen renders | Real Chrome browser (Playwright) | ✅ **Rendered** — screenshot `01-phone-entry.jpeg` |
| Country picker selects US +1 | Playwright click flow | ✅ **Worked** — screenshot `00-country-picker.jpeg` |
| Type test number `6505553434` | Playwright type flow | ✅ **Typed** — number visible in input |
| Send OTP → Firebase | App's real reCAPTCHA verifier → Firebase | ✅ **Accepted** — OTP screen reached |
| `confirmationResult.confirm("654321")` | Playwright flow → Firebase confirmation | ✅ **GENUINE SUCCESS** — signed-in Firebase user created |
| OTP success screen captured | Real Chrome browser (Playwright) | ✅ `Screenshot/03-verification-success.jpeg` |
| Invalid-code error captured | Wrong code `000000` entered | ✅ `Screenshot/05-invalid-code-error.jpeg` |
| Real SMS delivered | — | ❌ **No SMS was sent** — Firebase test numbers deliver no SMS |
| `.env` tracked in Git | GitHub API `contents/.env` | ✅ **Absent** — returns HTTP 404 |
| Billing/Blaze enabled | — | ❌ **No** — Spark plan only |

Firebase predefined test numbers verify **genuinely through Firebase** without sending an SMS — `confirmationResult.confirm("654321")` succeeded and Firebase created a signed-in user.

---

## Exact Firebase test result (genuine success)

The complete flow was tested against Firebase using the configured predefined test number `+1 650-555-3434` / code `654321`:

1. App loads at `https://safeskip-a2.web.app` ✅
2. Country picker (United States +1) and phone entry render ✅
3. Test number `6505553434` typed ✅
4. Send OTP → Firebase accepted the test number → OTP screen reached ✅
5. Code `654321` entered → `confirmationResult.confirm("654321")` → **GENUINE SUCCESS** ✅

**Verification successful:** `Screenshot/03-verification-success.jpeg` shows "Phone number verified" with "Firebase created a signed-in user for this phone number." This result came from Firebase, not from any simulated local check.

**Important:** This is a Firebase **predefined test number**. Firebase verified the console-defined code **without sending any SMS**. No real SMS was delivered — real SMS delivery requires the Blaze pay-as-you-go plan.

---

## Earlier error (preserved as historical evidence)

Earlier in this session, before the reCAPTCHA lifecycle fix and before the SMS region policy was configured for `+1`, Firebase returned:

```
HTTP 400
"error": {
  "code": 400,
  "message": "OPERATION_NOT_ALLOWED : SMS unable to be sent until this region enabled by the app developer."
}
```

This error is preserved in `Screenshot/04-error-state.jpeg` as historical troubleshooting evidence only — it is **not** the current result. The current result is genuine verification success.

---

## Why no SMS was sent

1. Firebase predefined test numbers verify genuinely **without sending an SMS** — this is expected behavior for test numbers.
2. Even for real phone numbers, Firebase's own documentation states that **verification SMS is only available on the Blaze (pay-as-you-go) plan**. This project stayed on the free **Spark** plan; billing was never enabled.
3. No SMS delivery was claimed anywhere in this repo.

---

## Evidence that exists in this repository

| File | Description |
|---|---|
| `Screenshot/00-country-picker.jpeg` | Country picker modal open on the phone-entry screen (running app). |
| `Screenshot/01-phone-entry.jpeg` | Phone-entry screen, Pakistan +92 default, `6505553434` typed, running app. |
| `Screenshot/02-otp-requested.jpeg` | OTP screen after Send OTP — input field + 60s resend countdown. |
| `Screenshot/03-verification-success.jpeg` | **GENUINE SUCCESS** — "Phone number verified", Firebase created a signed-in user. |
| `Screenshot/04-error-state.jpeg` | Historical: genuine Firebase `OPERATION_NOT_ALLOWED` error (earlier region-policy blocker) — preserved as troubleshooting evidence. |
| `Screenshot/05-invalid-code-error.jpeg` | Genuine Firebase rejection of a wrong code ("The code you entered is incorrect."). |
| `Evidence/otp-demo-success.webm` | Complete browser recording: phone entry → Send OTP → code entry → Firebase verification success. |
| `Evidence/capture-success.mjs` | The Playwright script used to capture the successful flow screenshots and video. |
| `Evidence/http-verify-log.txt` | Timestamped capture log of the session. |
| `Evidence/STATUS.md` | This document. |
| `Screenshot/README.md` / `Evidence/README.md` | Capture checklists. |

---

## How to reproduce the verified checks

```bash
cd Quiz4-PhoneOTP-i230110
npm install
npx tsc --noEmit
npx expo export --platform web
```

To reproduce the browser capture against the hosted app:

```bash
node Evidence/capture-success.mjs
```

Expected result: the app loads, Send OTP reaches Firebase, OTP screen is reached, code `654321` produces genuine Firebase verification success, and a signed-in Firebase user is created.
