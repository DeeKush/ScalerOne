# ScalerOne

React Native (Expo SDK 54) campus hub — JavaScript. Auth uses **React Native Firebase** (native Google Sign-In + phone OTP). **Expo Go is not supported.** Native Firebase + Google Sign-In cannot run in Expo Go, and `npm start` without `--dev-client` is the wrong loop.

**Flow:** swipe-up ID card → Google → card fills and flips → phone OTP → hub.

## Daily test (USB + Metro) — use this for login

Install the native **dev client** once over USB, then iterate JS (including Google / phone login) without a 12–20 minute APK:

```bash
cp .env.example .env   # Web client ID is already the scalerone-746d8 type-3 client
npm install
npx expo run:android   # first time / after native plugin or icon changes
npm start              # expo start --dev-client
```

Keep the phone on USB (or the same Wi-Fi as Metro). Unplug or quit Metro and this debug install will not run. That is expected.

Launcher **name** and **icon** live in native bits. Changing `app.json` name/icon needs `npx expo run:android` again (or `npm run apk`). JS-only login fixes do not.

## Tester APK (sideload, no Metro)

You need Android SDK (`ANDROID_HOME`, usually `~/Library/Android/sdk`) and `google-services.json` at the project root (Firebase Console → Android app `com.scaler.hub`). Package name stays `com.scaler.hub`.

```bash
npm run apk            # arm64 preview → dist/ScalerOne-preview.apk
npm run apk -- --clean # force expo prebuild
```

Send **`dist/ScalerOne-preview.apk`** (Drive, WhatsApp, AirDrop). On the phone: open the file → Install → allow unknown sources if asked → open **ScalerOne**.

`npm run apk` skips `expo prebuild` when `android/` is already there and native inputs are unchanged. It patches Gradle to ~4g heap / 1g metaspace (Expo regenerates `android/gradle.properties`) and builds **arm64-v8a only**. The script prints the **SHA-1 of the keystore that signs this APK** (`android/app/debug.keystore` for assembleRelease) and of the APK itself.

This is a **release** APK with JS bundled inside. It keeps working after you unplug USB. Use it when you cannot keep Metro around — not for daily login debugging.

## Theme (Academic Blue)

| Token | Value |
|---|---|
| Background | `#F7F9FC` |
| Accent | `#4A90E2` |
| Text | `#1B2430` |
| Muted | `#D8DADF` |

## Firebase setup

1. Firebase project **scalerone-746d8**; enable **Google** and **Phone** under [Authentication → Sign-in method](https://console.firebase.google.com/project/scalerone-746d8/authentication/providers). MCP cannot turn Phone on. `auth/operation-not-allowed` after Google means Phone is still off. SMS usually needs **Blaze** billing (this project currently has billing off).
2. Android app package **`com.scaler.hub`**. Download `google-services.json` to the project root (gitignored).
3. **Create the default Firestore database** if it does not exist: Firebase Console → Firestore Database → Create database. Database ID must be the nameless **`(default)`** (pick a region, e.g. `asia-south1`). The app cannot invent a live database. `firestore/unavailable` after Google sign-in almost always means this step was skipped, or the device cannot reach Google.
4. Web OAuth client in Google Cloud = `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (must match the type 3 client inside `google-services.json`).
5. Register the app SHA-1/SHA-256 printed by `npm run apk` on the Firebase Android app.
6. Deploy rules (after the database exists):

```bash
npx -y firebase-tools deploy --only firestore:rules
```

Use `firebase-tools` (the CLI). `npx firebase` installs the JS SDK, which has no `deploy` command.

7. Optional domain gate:

```bash
cd functions && npm install && npm run build
# firebase deploy --only functions:assertScalerEmail
```

Set `EXPO_PUBLIC_FUNCTIONS_URL` to the functions base URL.

## Email identity

- `user@scaler.com` → Scaler Employee
- `ariyan.25bcs10115@sst.scaler.com` → batch **2025**, pass-out **2029**, roll **10115**, program **bcs**, student ID **25bcs10115**

## Scripts

```bash
npm start               # Metro for the native dev client (not Expo Go)
npx expo run:android    # USB debug client (needs Metro afterwards)
npm run apk             # standalone Android APK → dist/ScalerOne-preview.apk
npm run test:identity
```

## Docs

- [progress.md](./progress.md) — tracker
- [docs/decisions.md](./docs/decisions.md) — locked grill decisions

## Repository

Canonical remotes: [Hollenite/ScalerOne](https://github.com/Hollenite/ScalerOne) and [DeeKush/ScalerOne](https://github.com/DeeKush/ScalerOne).
