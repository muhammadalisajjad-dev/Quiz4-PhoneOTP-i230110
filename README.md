# Quiz 4 - Phone OTP Verification (React Native / Expo)

A complete Expo/React Native app that verifies a phone number with Firebase Phone Authentication. The flow is:

**Enter phone number → request a code → enter the code → verify with Firebase → success or error.**

No OTP is generated, faked, or checked locally. Every verification result comes from Firebase.

---

## ⚠️ Important: Firebase plan limitation

Firebase Authentication phone SMS is **pay-as-you-go (Blaze) only**. This project was built on the free **Spark** plan, so:

- Real SMS sending is **blocked by Firebase** (the UI surfaces the genuine billing error).
- Development is done with **Firebase predefined test phone numbers**.
- A test number verifies **genuinely through Firebase** and creates a real Firebase user, but **no SMS is delivered** — the code is the one you define in the Firebase Console.

Nothing in this repo claims that a real SMS was sent when a test number was used.

---

## 🔎 Actual verification status (6 Nov 2026)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ passed |
| `npx expo export --platform web` | ✅ passed (807 modules bundled) |
| App loads at `https://safeskip-a2.web.app` | ✅ verified |
| Phone-entry screen renders | ✅ verified |
| Country picker selects United States +1 | ✅ verified |
| Send OTP reaches Firebase (reCAPTCHA token obtained) | ✅ verified |
| `POST /v1/accounts:sendVerificationCode` result | ✅ **Firebase accepted the test number** — OTP screen reached |
| `confirmationResult.confirm("654321")` tested | ✅ **Genuine Firebase success** — signed-in user created |
| OTP success screen captured | ✅ `Screenshot/03-verification-success.jpeg` |
| Real SMS sent | ❌ **No** — Firebase test numbers deliver no SMS |
| `.env` tracked in Git | ✅ Absent (gitignored, verified 404) |
| Billing/Blaze enabled | ❌ No |

Firebase predefined test numbers verify **genuinely through Firebase** without sending an SMS — `confirmationResult.confirm("654321")` succeeded and Firebase created a signed-in user.

See `Evidence/STATUS.md` for the full honest report.

---

## ✨ Features

- Phone number entry with a country picker (Pakistan +2 is the default).
- “Send OTP” calls Firebase `signInWithPhoneNumber`.
- OTP screen with 6-digit input, **resend countdown (60s)**, and resend action.
- Clear loading indicators, success screen, and detailed error messages.
- “Change phone number” returns to the phone screen and resets the request.
- Environment-variable based Firebase config (`.env` is git-ignored).
- Honest error mapping for billing, quota, invalid number, wrong code, expired code, unauthorized domain, reCAPTCHA and network failures.

---

## 🧱 Project structure

```
Quiz4-PhoneOTP-i230110/
├── .env.example                # Firebase config template (no real values committed)
├── .gitignore                  # .env and build artifacts excluded
├── app.json                    # Expo config, expo-router plugin, scheme
├── firebase.json               # Firebase Hosting config (serves dist/, SPA routing)
├── .firebaserc                 # Firebase project alias (safeskip-a2)
├── package.json                # Dependencies + scripts
├── tsconfig.json
├── index.js                    # Custom entry (imports expo-router/entry)
├── src/
│   ├── app/
│   │   ├── _layout.tsx         # Root layout (Slot)
│   │   └── (auth)/
│   │       ├── index.tsx       # Phone number entry
│   │       ├── otp.tsx         # OTP entry + resend countdown
│   │       ├── success.tsx     # Verified success screen
│   │       └── error.tsx       # Failure / retry screen
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── CountryPickerModal.tsx
│   │   └── MessageCard.tsx
│   ├── lib/
│   │   ├── countries.ts
│   │   ├── errors.ts
│   │   ├── firebase.ts
│   │   ├── otpSession.ts
│   │   └── phoneAuth.ts
│   └── theme.ts
├── README.md
└── Screenshot/
    ├── 00-country-picker.jpeg
    ├── 01-phone-entry.jpeg
    ├── 02-otp-requested.jpeg
    ├── 03-verification-success.jpeg
    ├── 04-error-state.jpeg
    └── 05-invalid-code-error.jpeg
```

---

## 🚀 Run the app

### 1. Install dependencies

```bash
cd Quiz4-PhoneOTP-i230110
npm install
```

> Prefer `npx expo install --fix` if Expo reports SDK version mismatches. Expo CLI resolves SDK-compatible versions automatically.

### 2. Configure Firebase

```bash
copy .env.example .env
```

Fill `.env` with the **Web app** config from:

> Firebase Console → Project settings → Your apps → Web app → SDK setup and configuration

Restart the dev server after changing `.env`.

### 3. Start the app

```bash
npx expo start
```

- **Browser (recommended for the phone-auth demo):** press `w` or run `npx expo start --web`. Firebase JS Phone Auth uses reCAPTCHA, which needs a browser DOM.
  - **Important:** Firebase does **not** allow `localhost` for phone authentication. A localhost web demo will fail the authorized-domain check even after Authentication is enabled. Deploy the web build to Firebase Hosting (or add a non-localhost tunnel domain to Authorized domains) — see below.
- **Expo Go (Android/iOS):** scan the QR code. The UI and navigation work, but Firebase’s JS SDK cannot render reCAPTCHA in Expo Go. Tapping “Send OTP” on native shows an honest explanation instead of a fake success.
- **Development build (native Android phone auth):** requires `@react-native-firebase/auth`, a `google-services.json`, and Firebase Blaze for real SMS. This is outside the free-plan demo.

### Recommended hosted demo (authorized domain)

The web app is deployed to Firebase Hosting at **https://safeskip-a2.web.app** (project `safeskip-a2`).

Firebase Hosting serves the Expo `dist/` folder with SPA routing (`firebase.json` rewrites all paths to `/index.html`). This is the most reliable path for a real phone-auth demo because the domain is already authorized for phone authentication — `localhost` is not allowed for Firebase phone auth.

To redeploy after code changes:

```bash
npm install -g firebase-tools
firebase login
npx expo export --platform web
firebase deploy --only hosting
```

---

## 🔧 Firebase Console setup still required

You must configure the Firebase project once:

| Setting | Where | Why |
|---|---|---|
| Enable **Phone** sign-in | Authentication → Sign-in method | Phone provider must be enabled |
| SMS region policy | Authentication → Settings | Allow/deny SMS regions; if an allow-list is active, include **United States (+1)** |
| Authorized domains | Authentication → Settings | Add `safeskip-a2.web.app` (already done via Hosting). **localhost is not allowed for phone auth** |
| Test phone numbers | Authentication → Sign-in method → Phone | Add a fictional number + fixed code for no-SMS development testing |

Without these, Firebase returns real errors (shown by the app), such as `operation-not-allowed`, `unauthorized-domain`, or a billing restriction.

### Genuine Firebase test result (6 Nov 2026)

The hosted app was tested against Firebase using the configured predefined test number `+1 650-555-3434` / code `654321`:

- The app loads at `https://safeskip-a2.web.app` ✅
- Country picker (United States +1) and phone entry render ✅
- The app's real reCAPTCHA verifier obtained a token ✅
- Raw Firebase call `POST /v1/accounts:sendVerificationCode` returned **HTTP 400**:

```
"error": {
  "code": 400,
  "message": "OPERATION_NOT_ALLOWED : SMS unable to be sent until this region enabled by the app developer."
}
```

This means **Phone sign-in is enabled, but the United States (+1) region is not allowed** in the SMS region policy. Firebase blocked the request before any SMS could be sent — no SMS was delivered, and the OTP screen was never reached. Until the region allow-list includes `+1`, neither `confirmationResult.confirm("654321")` nor the success screen can be reached.

See `Evidence/STATUS.md` for the full honest report and `Screenshot/04-error-state.jpeg` for the genuine error screen rendered from Firebase's response.

---

## 🧪 Testing and evidence

### What is implemented vs. verified

**Implemented (code exists, bundles cleanly):** phone entry, country picker, validation, loading states, OTP screen with 60-second countdown and resend, change-number, success and error screens, and real Firebase `signInWithPhoneNumber` / `confirmation.confirm` calls.

**Verified in a real browser (this repo's evidence):** app loads at `https://safeskip-a2.web.app`, phone-entry screen renders, country picker opens and selects United States +1, a number can be typed, Send OTP reaches Firebase, OTP screen reached, and `confirmationResult.confirm("654321")` produced **genuine Firebase verification success** — a signed-in Firebase user was created.

**Not verified:** Real SMS delivery. Firebase predefined test numbers verify genuinely without sending an SMS. Real SMS requires the Blaze pay-as-you-go plan, which was not enabled.

### Evidence included in this repository

| File | What it proves |
|---|---|
| `Screenshot/00-country-picker.jpeg` | Country picker opens in the running app. |
| `Screenshot/01-phone-entry.jpeg` | Phone-entry screen renders with Pakistan +92 and `3001234567` typed. |
| `Screenshot/04-error-state.jpeg` | Historical: genuine Firebase `OPERATION_NOT_ALLOWED` error (earlier region-policy blocker) — preserved as troubleshooting evidence |
| `Screenshot/02-otp-requested.jpeg` | OTP screen after Send OTP — input field + 60s resend countdown |
| `Screenshot/03-verification-success.jpeg` | **GENUINE SUCCESS** — "Phone number verified", Firebase created a signed-in user |
| `Screenshot/05-invalid-code-error.jpeg` | Genuine Firebase rejection of a wrong code ("The code you entered is incorrect.") |
| `Evidence/otp-demo-success.webm` | Complete browser recording: phone entry → Send OTP → code entry → Firebase verification success |
| `Evidence/http-verify-log.txt` | Timestamped log of the capture session, including Firebase HTTP responses. |
| `Evidence/capture-success.mjs` | The Playwright script used to capture the successful flow screenshots and video. |
| `Evidence/STATUS.md` | Full honest verification report: what passed, what failed, what was never captured. |
| `Screenshot/README.md` / `Evidence/README.md` | Capture checklists. |

### Evidence captured (complete flow verified)

1. **Screenshots** (in `Screenshot/`):
   - `02-otp-requested.png` — OTP screen after “Send OTP” (input + 60s countdown).
   - `03-verification-success.png` — **success screen** after entering the Firebase test-number code `654321`.
   - `05-invalid-code-error.png` — error state after entering a wrong code.
2. **Success-flow recording** (in `Evidence/`):
   - `otp-demo-success.webm` — complete browser recording: phone entry → Send OTP → code entry → Firebase verification success.

> Firebase predefined test numbers verify genuinely **without sending any SMS**. The recording shows the console-defined code `654321` and does **not** claim an actual SMS arrived. Real SMS delivery requires the Blaze pay-as-you-go plan, which was not enabled.

---

## 📤 Submission

Repository: **https://github.com/muhammadalisajjad-dev/Quiz4-PhoneOTP-i230110**

Commit and push after adding the remaining screenshots and the recording:

```bash
git add Screenshot Evidence
git commit -m "Add remaining OTP screenshots and recording"
git push origin master
```

---

## 🔐 Secrets

- `.env` is git-ignored and is **not** in the repository.
- `.env.example` contains placeholders only.
- No service-account JSON or backend secrets are used.
- `EXPO_PUBLIC_*` values are public client identifiers by design; they are still kept out of Git via `.env`.
