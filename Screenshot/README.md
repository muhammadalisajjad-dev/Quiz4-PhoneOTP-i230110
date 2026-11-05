# Screenshot evidence — capture checklist

The app is implemented and verified to bundle (web export succeeds, TypeScript passes). Screenshots must be taken on a running instance of this app by the student, because this workspace cannot access the Firebase Console or the student's phone.

## Already captured (genuine, from the running app)

| File | What it shows |
|---|---|
| `00-country-picker.jpeg` | Country picker modal open on the phone-entry screen. |
| `01-phone-entry.jpeg` | Phone-entry screen, Pakistan +92, placeholder number visible. |
| `04-error-state.jpeg` | Real Firebase error after tapping Send OTP: `auth/configuration-not-found` (Firebase Authentication not initialised for `safeskip-a2`). |

## Still to capture (requires Firebase Console access)

1. `02-otp-requested.png` — OTP screen immediately after tapping **Send OTP** (6-digit input, 60-second resend countdown).
2. `03-verification-success.png` — success screen after entering the correct Firebase code.
3. `05-invalid-code-error.png` — error state after entering a wrong 6-digit code (auth/invalid-verification-code).

To unlock these, initialise Firebase Authentication, enable the **Phone** provider, and add a **test phone number + code** in the Firebase Console (see the main README). Then run the web build and repeat the flow.

## Honesty requirement

- If you use a **Firebase predefined test number**, no SMS is delivered. The screenshot/recording must show the code defined in the Firebase Console, and the success message must not claim an SMS arrived.
- If you enable **Blaze** and send a real SMS, capture the SMS notification as `05-sms-received.png`.

## How to run and capture

```bash
npm install
cp .env.example .env       # fill in the Firebase web app config
npx expo start --web       # open the browser demo (recommended for reCAPTCHA)
```

For the Android phone, run `npx expo start` and open the project in **Expo Go**. The UI works natively; Firebase reCAPTCHA requires the web build or a development build (see main README).

Add this folder to the repository after capturing:

```bash
git add Screenshot
git commit -m "Add OTP flow screenshots"
git push origin master
```
