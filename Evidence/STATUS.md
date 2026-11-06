# Verification status — Quiz 4 Phone OTP

Date: 6 November 2026
Repository: https://github.com/muhammadalisajjad-dev/Quiz4-PhoneOTP-i230110 (branch `master`)
Firebase project: `safeskip-a2`
Hosted URL: https://safeskip-a2.web.app

This document reports exactly what was and was not verified. Nothing here is simulated.

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
| Send OTP → Firebase | App's real reCAPTCHA verifier → raw HTTP `sendVerificationCode` | ❌ **Blocked** — Firebase returned `OPERATION_NOT_ALLOWED` |
| `.env` tracked in Git | GitHub API `contents/.env` | ✅ **Absent** — returns HTTP 404 |
| Real SMS delivered | — | ❌ **No SMS was sent** |
| `confirmationResult.confirm("654321")` tested | — | ❌ **Not reachable** — region blocker prevents code from being sent |
| OTP success screen captured | — | ❌ **Not captured (not reachable)** |
| Browser session recording | Playwright video of real Chrome | ✅ **Captured** — `Evidence/otp-demo.webm` |
| Capture script | `node Evidence/capture-http-verify.mjs` | ✅ Ran against `https://safeskip-a2.web.app` |

---

## Exact Firebase error observed (genuine)

Tapping **Send OTP** against the configured predefined test number `+1 650-555-3434` produced this genuine Firebase response from `POST /v1/accounts:sendVerificationCode`:

```
HTTP 400
"error": {
  "code": 400,
  "message": "OPERATION_NOT_ALLOWED : SMS unable to be sent until this region enabled by the app developer."
}
```

The app renders this as a genuine error screen (`Screenshot/04-error-state.jpeg`):

> **Firebase Phone Auth — GENUINE ERROR (blocked)**
> Request: POST /v1/accounts:sendVerificationCode
> Phone: +16505553434 (Firebase predefined test number)
> Firebase response: HTTP 400
> Message: OPERATION_NOT_ALLOWED — SMS unable to be sent until this region enabled by the app developer.
> Region policy blocker: United States (+1) is not allowed in Firebase Console Authentication → Settings → SMS region policy.
> No SMS was delivered (Spark plan). OTP screen and success screen are not reachable until this is fixed.

Phone sign-in **is enabled** for `safeskip-a2`, but the United States (+1) region is not in the SMS region allow-list. Firebase blocked the request before any SMS could be sent. Until `+1` is added to the allow-list, neither `confirmationResult.confirm("654321")` nor the success screen can be reached.

No OTP was invented, hardcoded, or validated locally at any point.

---

## Why no SMS was sent

1. Phone sign-in is enabled, but the United States (+1) region is blocked by the SMS region policy.
2. Even after that is fixed, Firebase's own documentation states that **verification SMS is only available on the Blaze (pay-as-you-go) plan**. This project stayed on the free **Spark** plan; billing was never enabled.
3. Firebase predefined test numbers verify genuinely through Firebase **without** sending an SMS — but only after the region policy allows the number's country code.

---

## Evidence that exists in this repository

| File | Description |
|---|---|
| `Screenshot/00-country-picker.jpeg` | Country picker modal open on the phone-entry screen (running app). |
| `Screenshot/01-phone-entry.jpeg` | Phone-entry screen, Pakistan +92 default, `6505553434` typed, running app. |
| `Screenshot/04-error-state.jpeg` | Genuine Firebase `OPERATION_NOT_ALLOWED` error rendered from Firebase's HTTP 400 response. |
| `Evidence/otp-demo.webm` | Continuous Playwright recording of the real browser flow: open app → country picker → type number → Send OTP → genuine Firebase error. |
| `Evidence/http-verify-log.txt` | Timestamped capture log of the session. |
| `Evidence/capture-http-verify.mjs` | The Playwright script used to capture the screenshots and video, for reproducibility. |
| `Evidence/STATUS.md` | This document. |
| `Screenshot/README.md` / `Evidence/README.md` | Capture checklists. |

---

## Evidence NOT captured (and why)

| Missing item | Reason |
|---|---|
| OTP entry screen screenshot (`02`) | Firebase blocked `sendVerificationCode` (region policy), so the app never navigated to the OTP screen. |
| Success screen screenshot (`03`) | No verification could complete — no code was ever sent by Firebase. |
| Wrong-code error screenshot (`05`) | Requires a successful verification session first. |
| Success-flow recording | The full success flow cannot complete until the SMS region policy allows United States (+1). `Evidence/otp-demo.webm` records the available flow ending in the genuine Firebase error. |

These are intentionally absent rather than fabricated.

---

## What remains to finish the demo

Do these in the Firebase Console for project `safeskip-a2`:

1. **Authentication → Settings → SMS region policy** — if an allow-list is active, include **United States (+1)**.
2. **Authentication → Sign-in method → Phone → Phone numbers for testing** — ensure `+1 650-555-3434` with code `654321` is configured.
3. **Authentication → Settings → Authorized domains** — confirm `safeskip-a2.web.app` is authorized (done via Firebase Hosting).

Then open `https://safeskip-a2.web.app`, enter `+1 650-555-3434`, tap **Send OTP**, and enter `654321`. That produces a real Firebase verification (and a real Firebase user) with no SMS — then the remaining screenshots and the recording can be captured honestly.

Real SMS delivery additionally requires enabling the **Blaze** plan. That was not enabled and was not requested.

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
node Evidence/capture-http-verify.mjs
```

Expected today: the app loads, Send OTP reaches Firebase, and Firebase returns the genuine `OPERATION_NOT_ALLOWED` error until the SMS region policy allows `+1`.
