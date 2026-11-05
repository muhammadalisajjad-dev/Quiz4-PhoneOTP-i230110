# Quiz 4 — Phone OTP Verification (React Native / Expo)

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

## 🔎 Actual verification status (5 Nov 2026)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ passed |
| `npx expo export --platform web` | ✅ passed (807 modules bundled) |
| Browser run at `http://localhost:8081` | ✅ phone-entry UI renders |
| Send OTP against `safeskip-a2` | ❌ Firebase returned **`auth/configuration-not-found`** |
| Real SMS sent | **No** — Firebase Auth is not initialised for this project, and Spark cannot send SMS |
| OTP success screen captured | **No** — OTP screen never reached |
| Browser recording | ✅ `Evidence/otp-demo.webm` — real flow ending in the Firebase error |
| Billing/Blaze enabled | **No** |

`auth/configuration-not-found` means Firebase Authentication has not been initialised for the `safeskip-a2` project (or the web API key/project pair does not match). This is a Firebase Console action — see the setup table below. It is not an app-code failure.

Full report: **[`Evidence/STATUS.md`](Evidence/STATUS.md)**.

Captured screenshots in `Screenshot/`:

- `00-country-picker.jpeg` — genuine country picker UI.
- `01-phone-entry.jpeg` — genuine phone-entry screen.
- `04-error-state.jpeg` — genuine Firebase error state (`Authentication is not configured`).

Screenshots for the OTP entry and success screens must be captured after Firebase Authentication is enabled and a test number is configured; see `Screenshot/README.md`.

---

## ✨ Features

- Phone number entry with a country picker (Pakistan +92 is the default).
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
└── README.md
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
cp .env.example .env
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

Firebase Hosting gives you the already-authorized domain `safeskip-a2.web.app`:

```bash
npm install -g firebase-tools
firebase login
npx expo export --platform web

# first time only
firebase init hosting
#   public directory: dist
#   single-page app: yes
#   do not overwrite index.html

firebase deploy --only hosting
```

Open `https://safeskip-a2.web.app` and complete Firebase Console setup (below). This is the most reliable path for a real phone-auth demo because the domain is already authorized.

---

## 🔧 Firebase Console setup still required

You must configure the Firebase project once:

| Setting | Where | Why |
|---|---|---|
| Enable **Phone** sign-in | Authentication → Sign-in method | Phone provider must be enabled |
| SMS region policy | Authentication → Settings | Allow/deny SMS regions; if a region allow-list is active, include Pakistan (+92) |
| Authorized domains | Authentication → Settings | Add the domain hosting the web build. **localhost is not allowed for phone auth** |
| Test phone numbers | Authentication → Sign-in method → Phone | Add a fictional number + fixed code for no-SMS development testing |

Without these, Firebase returns real errors (shown by the app), such as `operation-not-allowed`, `unauthorized-domain`, or a billing restriction.

---

## 🧪 Testing and evidence

### What is implemented vs. verified

**Implemented (code exists, bundles cleanly):** phone entry, country picker, validation, loading states, OTP screen with 60-second countdown and resend, change-number, success and error screens, and real Firebase `signInWithPhoneNumber` / `confirmation.confirm` calls.

**Verified in a real browser (this repo's evidence):** app boots, phone-entry screen renders, country picker opens and selects, a number can be typed, Send OTP reaches Firebase, and Firebase returns a real `CONFIGURATION_NOT_FOUND` error.

**Not verified:** OTP entry, code confirmation, and success. They cannot be reached until Firebase Authentication is initialised. No screenshot, SMS, or recording claims otherwise.

### Evidence included in this repository

| File | What it proves |
|---|---|
| `Screenshot/00-country-picker.jpeg` | Country picker opens in the running app. |
| `Screenshot/01-phone-entry.jpeg` | Phone-entry screen renders with Pakistan +92 and `3001234567` typed. |
| `Screenshot/04-error-state.jpeg` | Real Firebase response after Send OTP: `Firebase Authentication is not configured for this project.` |
| `Evidence/otp-demo.webm` | 26-second continuous Playwright recording of the real browser flow: open app → country picker → type number → Send OTP → actual Firebase error. |
| `Evidence/runtime-log.txt` | Timestamped log of the session, including Firebase HTTP responses. |
| `Evidence/capture-demo.mjs` | The Playwright script used to produce the screenshots and video. |
| `Evidence/STATUS.md` | Full honest verification report: what passed, what failed, what was never captured. |
| `Screenshot/README.md` / `Evidence/README.md` | Capture checklists. |

Reproduce the capture:

```bash
npm i --no-save playwright-core
npx playwright-core install ffmpeg
npx expo start --web --port 8081   # in another terminal
node Evidence/capture-demo.mjs
```

### Evidence still to capture (requires Firebase Console setup)

1. **Screenshots** (save into `Screenshot/`):
   - `02-otp-requested.png` — OTP screen after “Send OTP” (input + 60s countdown).
   - `03-verification-success.png` — success screen after entering the **Firebase test-number code**.
   - `05-invalid-code-error.png` — error state after entering a wrong code.
2. **Success-flow recording** (save as `Evidence/otp-demo-success.webm`):
   - Enter phone number → tap **Send OTP**.
   - Show the code source (SMS if Blaze is enabled, or the console test-number code).
   - Enter it → verification succeeds.

> If you use a Firebase test number, the recording must show the console-configured code and should not claim an actual SMS arrived. No OTP success, SMS receipt, or verification result in this repo is fabricated — anything missing is documented as missing.

### Why these are not captured yet

Firebase Authentication is not initialised for `safeskip-a2`, so every Send OTP attempt returns `auth/configuration-not-found`. Nothing reaches the OTP screen. See `Evidence/STATUS.md` for the exact steps that unblock this.

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
