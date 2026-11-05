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
- **Expo Go (Android/iOS):** scan the QR code. The UI and navigation work, but Firebase’s JS SDK cannot render reCAPTCHA in Expo Go. Tapping “Send OTP” on native shows an honest explanation instead of a fake success.
- **Development build (native Android phone auth):** requires `@react-native-firebase/auth`, a `google-services.json`, and Firebase Blaze for real SMS. This is outside the free-plan demo.

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

### What works now

- Full screen flow, validation, loading states, countdown, resend, change-number, success and error screens.
- Firebase phone-auth request and code confirmation **on the web build** (works with test numbers and, on Blaze, real SMS).
- Honest errors instead of fake results on unsupported runtimes.

### Evidence you must capture on your Android phone / browser

1. **Screenshots** (put them in `Screenshots/`):
   - Phone entry with `+92 300 1234567`.
   - OTP screen after “Send OTP” (input + countdown).
   - Success screen after entering the **Firebase test-number code**.
   - Error state after entering a wrong code.
2. **Screen recording** (put it in `Evidence/`):
   - Enter phone number → tap **Send OTP**.
   - Show the received code (SMS if Blaze is enabled, or the console test-number code).
   - Enter it → verification succeeds.

> If you use a Firebase test number, the recording must show the console-configured code and should not claim an actual SMS arrived.

---

## 📤 Submission

Repository: **https://github.com/muhammadalisajjad-dev/Quiz4-PhoneOTP-i230110**

Commit and push after adding screenshots and the recording:

```bash
git add Screenshots Evidence
git commit -m "Add OTP demo screenshots and recording"
git push origin master
```

---

## 🔐 Secrets

- `.env` is git-ignored and is **not** in the repository.
- `.env.example` contains placeholders only.
- No service-account JSON or backend secrets are used.
- `EXPO_PUBLIC_*` values are public client identifiers by design; they are still kept out of Git via `.env`.
