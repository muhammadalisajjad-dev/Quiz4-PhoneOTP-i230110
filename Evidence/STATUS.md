# Verification status — Quiz 4 Phone OTP

Date: 5 November 2026
Repository: https://github.com/muhammadalisajjad-dev/Quiz4-PhoneOTP-i230110 (branch `master`)
Firebase project: `safeskip-a2`

This document reports exactly what was and was not verified. Nothing here is simulated.

---

## What was verified

| Check | Command / method | Result |
|---|---|---|
| TypeScript typecheck | `npx tsc --noEmit` | ✅ **Passed** — no errors |
| Expo web export | `npx expo export --platform web` | ✅ **Passed** — 807 modules bundled to `dist/` |
| App runs in a browser | `npx expo start --web` at `http://localhost:8081` | ✅ **Rendered** — phone-entry screen displayed |
| Country picker | Clicked the picker in the running app | ✅ Worked — screenshot `00-country-picker.jpeg` |
| Phone-entry screen | Loaded in the running app | ✅ Rendered — screenshot `01-phone-entry.jpeg` |
| Send OTP → Firebase | Filled a number and tapped **Send OTP** | ❌ **Failed** with a real Firebase error |
| `.env` tracked in Git | `gh api .../contents/.env` | ✅ **Absent** — returns HTTP 404 |
| Real SMS delivered | — | ❌ **No SMS was sent** |
| OTP success screen | — | ❌ **Not captured (not reachable)** |
| Browser session recording | Playwright video of real Chrome | ✅ **Captured** — `Evidence/otp-demo.webm` (26 s) |
| Capture script | `node Evidence/capture-demo.mjs` | ✅ Ran against `http://localhost:8081` |

---

## Exact Firebase error observed

Tapping **Send OTP** returned this genuine error from Firebase:

```
Firebase: Error (auth/configuration-not-found).
```

The app maps it to:

> **Firebase Authentication is not configured for this project.**
> Open Firebase Console → Authentication, complete the initial setup, then enable the Phone sign-in method. Also confirm the API key in `.env` belongs to this project.

Captured evidence: `Screenshot/04-error-state.jpeg`.

`auth/configuration-not-found` means Firebase Authentication has never been initialised for the `safeskip-a2` project, or the web API key in `.env` does not belong to that project. This is a Firebase Console configuration state, not application-code behaviour.

The browser console during the attempt also showed:

```
GET https://identitytoolkit.googleapis.com/v2/recaptchaConfig?... 404
```

which is consistent with Authentication not being initialised.

### Network-level proof (captured in `Evidence/runtime-log.txt`)

The Playwright session recorded Firebase's raw responses, not just the UI text:

```http
GET /v2/recaptchaConfig?clientType=CLIENT_TYPE_WEB&version=RECAPTCHA_ENTERPRISE&key=...  →  404
{
  "error": { "code": 404, "message": "CONFIGURATION_NOT_FOUND", "status": "NOT_FOUND" }
}

GET /v1/recaptchaParams?key=...  →  400
{
  "error": { "code": 400, "message": "CONFIGURATION_NOT_FOUND", "domain": "global", "reason": "invalid" }
}
```

Firebase itself rejected the request before any code could be sent.

---

## Why no SMS was sent

1. Firebase Authentication is not initialised for the project, so no phone-auth request can be accepted.
2. Even after initialisation, Firebase's own documentation states that **verification SMS is only available on the Blaze (pay-as-you-go) plan**. This project stayed on the free **Spark** plan; billing was never enabled.
3. No test phone number has been configured in the Firebase Console yet, so the no-SMS test path could not be exercised either.

No OTP was invented, hardcoded, or validated locally at any point.

---

## Evidence that exists in this repository

| File | Description |
|---|---|
| `Screenshot/00-country-picker.jpeg` | Country picker modal open on the phone-entry screen (running app). |
| `Screenshot/01-phone-entry.jpeg` | Phone-entry screen, Pakistan +92 default, running app. |
| `Screenshot/04-error-state.jpeg` | Real Firebase `auth/configuration-not-found` error after tapping Send OTP. |
| `Screenshot/README.md` | Screenshot checklist and remaining capture instructions. |
| `Evidence/otp-demo.webm` | 26-second continuous Playwright recording of the real flow: open app → country picker → type `3001234567` → Send OTP → actual Firebase error. |
| `Evidence/runtime-log.txt` | Timestamped capture log with Firebase network responses, including `CONFIGURATION_NOT_FOUND`. |
| `Evidence/capture-demo.mjs` | The script used to capture the screenshots and video, for reproducibility. |
| `Evidence/README.md` | Screen-recording checklist. |
| `Evidence/STATUS.md` | This document. |

---

## Evidence NOT captured (and why)

| Missing item | Reason |
|---|---|
| OTP entry screen screenshot (`02`) | Send OTP never succeeded, so the app never navigated to the OTP screen. |
| Success screen screenshot (`03`) | No verification could complete against Firebase. |
| Wrong-code error screenshot (`05`) | Requires a successful verification session first. |
| Success-flow recording | The full success flow cannot complete until Firebase is configured; `Evidence/otp-demo.webm` records the available flow ending in the real Firebase error. |

These are intentionally absent rather than fabricated.

---

## What remains to finish the demo

Do these in the Firebase Console for project `safeskip-a2`:

1. **Authentication → Get started** — initialise the Authentication product.
2. **Authentication → Sign-in method → Phone → Enable.**
3. **Authentication → Settings → SMS region policy** — if an allow-list is active, include **Pakistan (+92)**.
4. **Authentication → Sign-in method → Phone → Phone numbers for testing** — add a fictional number and fixed code, e.g. `+92 300 1234567` with code `123456`. This verifies genuinely through Firebase **without** sending an SMS.
5. **Authentication → Settings → Authorized domains** — `localhost` is not permitted for phone auth. Serve the web build from Firebase Hosting (e.g. `safeskip-a2.web.app`, already authorized) or another authorized domain.

Then:

```bash
cd Quiz4-PhoneOTP-i230110
npm install
copy .env.example .env      # fill with the Web app config
npx expo export --platform web
firebase init hosting       # public dir: dist, SPA: yes
firebase deploy --only hosting
```

Open the hosted URL, enter the configured test number, tap **Send OTP**, and enter the console-defined code. That produces a real Firebase verification (and a real Firebase user) with no SMS — then the remaining screenshots and the recording can be captured honestly.

Real SMS delivery additionally requires enabling the **Blaze** plan. That was not enabled and was not requested.

---

## How to reproduce the verified checks

```bash
cd Quiz4-PhoneOTP-i230110
npm install
npx tsc --noEmit
npx expo export --platform web
npx expo start --web
```

Expected today: the app renders, and Send OTP shows the genuine `auth/configuration-not-found` message until the Firebase Console steps above are completed.
