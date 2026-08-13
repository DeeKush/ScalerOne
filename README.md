# Scaler Hub

React Native (Expo SDK 54) campus hub — JavaScript. Android testers install a standalone APK; the phone does not need USB or Metro.

**Flow:** swipe-up ID card → Google → card fills and flips → phone OTP → hub.

## Tester APK (recommended)

On a machine with Android SDK (`ANDROID_HOME`, usually `~/Library/Android/sdk`):

```bash
cp .env.example .env
npm install
npm run apk
```

That writes **`dist/ScalerHub-preview.apk`**. Send the file (Drive, WhatsApp, AirDrop). On the phone: open the file → Install → allow unknown sources if asked → open **Scaler Hub**.

This is a **release** APK with JS bundled inside. It keeps working after you unplug USB and after you quit Metro.

## Dev (optional)

```bash
cp .env.example .env
npm install
npx expo start -c
```

Expo Go 54, or USB debug:

```bash
npx expo run:android
```

Debug USB builds talk to Metro. Unplug the cable (or stop Metro) and that install will not run. Use `npm run apk` for a shareable tester build.

### Dev demo path

1. Swipe the ID card up.
2. Mock Google uses the email field (`@sst.scaler.com` or `@scaler.com`).
3. Front fills (name + student ID from the email), then the card flips.
4. Send OTP; mock code is **`123456`**.
5. Or tap **Dev: complete profile → Hub**.

## Theme (Academic Blue)

| Token | Value |
|---|---|
| Background | `#F7F9FC` |
| Accent | `#4A90E2` |
| Text | `#1B2430` |
| Muted | `#D8DADF` |

## Firebase setup

1. Create a Firebase project; enable **Google** and **Phone** auth.
2. Add a web app; copy config into `.env` (`EXPO_PUBLIC_FIREBASE_*`).
3. Create OAuth client IDs (Google Cloud) for Expo / iOS / Android / Web → `EXPO_PUBLIC_GOOGLE_*`.
4. Set `EXPO_PUBLIC_USE_MOCK_AUTH=false`.
5. Deploy domain gate:

```bash
cd functions && npm install && npm run build
# firebase deploy --only functions:assertScalerEmail
```

Set `EXPO_PUBLIC_FUNCTIONS_URL` to the functions base URL.

**Phone OTP on Expo Go:** Firebase JS phone auth needs a native ApplicationVerifier. Use mock auth for Expo Go; use a release APK / dev client for production phone linking.

## Email identity

- `user@scaler.com` → Scaler Employee
- `ariyan.25bcs10115@sst.scaler.com` → batch **2025**, pass-out **2029**, roll **10115**, program **bcs**, student ID **25bcs10115**

## Scripts

```bash
npm run apk                 # standalone Android APK → dist/ScalerHub-preview.apk
npx expo start -c           # Metro (debug only)
npx expo run:android        # USB debug (needs Metro)
npm run test:identity
```

## Docs

- [progress.md](./progress.md) — tracker
- [docs/decisions.md](./docs/decisions.md) — locked grill decisions

## Repository

Canonical remotes: [Hollenite/ScalerOne](https://github.com/Hollenite/ScalerOne) and [DeeKush/ScalerOne](https://github.com/DeeKush/ScalerOne).
