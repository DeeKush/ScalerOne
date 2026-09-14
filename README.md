# ScalerOne

React Native (Expo SDK 54) campus hub — JavaScript. Auth uses the **Firebase JS SDK** + `expo-auth-session` so Google works in the **web preview**. Native `@react-native-google-signin` is not used (it shows a Play Services error in the browser).

**Flow:** swipe-up ID card → Google → card fills and flips → phone OTP → hub. Lost & Found is the first live module.

## Web preview

```bash
cp .env.example .env
npm install
npm run web
```

Default `.env` uses **mock auth**. Continue with a Scaler email, then Submit OTP with **`123456`** (Send OTP is optional).

For real Google on web: fill `EXPO_PUBLIC_FIREBASE_*` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, set `EXPO_PUBLIC_USE_MOCK_AUTH=false`.

## Tester APK (sideload, no Metro)

```bash
npm run apk
```

Install `dist/ScalerHub-preview.apk` (or `ScalerOne-preview.apk` if the build script copies that name). Package stays `com.scaler.hub`.

## Dev demo path

1. Swipe the ID card up.
2. Mock Google uses the email field (`@sst.scaler.com` or `@scaler.com`).
3. Front fills, then the card flips.
4. Enter a 10-digit number and OTP **`123456`**, then **Submit OTP** (Send is optional).
5. Or tap **Dev: skip to Hub**.

## Theme (Academic Blue)

| Token | Value |
|---|---|
| Background | `#F7F9FC` |
| Accent | `#4A90E2` |
| Text | `#1B2430` |
| Muted | `#D8DADF` |

## Firebase setup

1. Create a Firebase project; enable **Google** (and **Phone** if you will use native SMS).
2. Add a web app; copy config into `.env` (`EXPO_PUBLIC_FIREBASE_*`).
3. Create OAuth client IDs → `EXPO_PUBLIC_GOOGLE_*`.
4. Set `EXPO_PUBLIC_USE_MOCK_AUTH=false`.
5. Optional domain gate: deploy `assertScalerEmail` and set `EXPO_PUBLIC_FUNCTIONS_URL`.

**Phone OTP on web:** Firebase JS phone auth needs a native ApplicationVerifier. Use mock auth in the browser. Lost & Found uses on-device SQLite (`EXPO_PUBLIC_LOSTFOUND_BACKEND=local`).

## Email identity

- `user@scaler.com` → Scaler Employee
- `ariyan.25bcs10115@sst.scaler.com` → batch **2025**, pass-out **2029**, roll **10115**, program **bcs**, student ID **25bcs10115**

## Scripts

```bash
npm run web                 # browser preview
npm start                   # Metro (expo start)
npm run apk                 # standalone Android APK
npx expo run:android        # USB debug
npm run test:identity
```

## Docs

- [progress.md](./progress.md) — tracker
- [docs/decisions.md](./docs/decisions.md) — locked grill decisions

## Repository

Canonical remotes: [Hollenite/ScalerOne](https://github.com/Hollenite/ScalerOne) and [DeeKush/ScalerOne](https://github.com/DeeKush/ScalerOne).
