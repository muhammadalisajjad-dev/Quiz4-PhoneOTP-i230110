# Screen-recording evidence — capture checklist

Record one continuous video that shows the complete OTP process:

1. Open the app on the phone (Expo Go) or in the browser (`npx expo start --web`).
2. Type the phone number (e.g. `+92 300 1234567`).
3. Tap **Send OTP**.
4. Show the received code:
   - Real SMS if the Firebase project is on Blaze, or
   - the code configured for the Firebase predefined test number.
5. Type the code into the OTP screen.
6. Tap **Verify OTP** and show the success screen.
7. Optionally show one wrong-code attempt and its error message.

Save the video here as:

```
Evidence/otp-demo.mp4
```

## Honesty requirement

- A Firebase predefined test number does **not** send an SMS. In that case, show the code configured in the Firebase Console and state that it is a test number.
- Do not edit the video or fabricate an SMS notification.

## Upload

```bash
git add Evidence
git commit -m "Add OTP screen recording"
git push origin master
```
