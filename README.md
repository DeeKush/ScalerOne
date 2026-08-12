# Scaler Hub

React Native (Expo) campus hub — motion-first MVP.

**Expo SDK 54** (matches Play Store Expo Go **54.x**).  
**Flow:** Info → Auth (25/75) → Root hub with hierarchical floating nav.

## Quick start

```bash
cp .env.example .env
npm install --legacy-peer-deps
npx expo start -c
```

Scan the QR code with **Expo Go 54** from the Play Store / App Store. Mock auth is on by default when Firebase keys are empty.

### Expo Go version mismatch

Each Expo Go build supports **one** SDK. This project is **SDK 54**.

| Your Expo Go | Works with this project? |
|---|---|
| Play Store **54.0.x** | Yes |
| SDK 57 Expo Go (non-store / `eas go`) | No — upgrade the project instead |

If you previously saw “project is incompatible”, you were likely on an SDK 57 project with Expo Go 54 — that is fixed by this downgrade. Always restart Metro after SDK changes: `npx expo start -c`.

### If Expo Go hangs or “Something went wrong”

1. Stop Metro, then clear cache: `npx expo start -c`
2. Install native packages with `npx expo install <package>` (not plain `npm install`).
3. If Metro logs `Cannot find module 'babel-preset-expo'`, run:
   ```bash
   npx expo install babel-preset-expo
   npx expo start -c
   ```
4. If LAN fails: `npx expo start --tunnel -c`

### Android physical device (recommended when Expo Go fails)

Do **not** run `brew install adb` — there is no such formula. Use the Android SDK that Android Studio already installed.

1. Add SDK tools to your shell (`~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

Then `source ~/.zshrc`.

2. Verify:

```bash
echo $ANDROID_HOME
# should print: /Users/<you>/Library/Android/sdk
adb version
adb devices
```

3. On the phone: enable **Developer options → USB debugging**, plug in USB, accept the trust prompt. `adb devices` must show your device (not empty / not `unauthorized`).

4. Build and install a native debug app (not Expo Go):

```bash
npx expo run:android
```

5. Later sessions:

```bash
npx expo start --dev-client
```

Open the **Scaler Hub** app on the phone.

If the Auth screen red-screens with `androidClientId must be defined`, reload after pulling latest (mock auth supplies placeholder client IDs). For **real** Google sign-in, set `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (and related) in `.env` and set `EXPO_PUBLIC_USE_MOCK_AUTH=false`.

If Gradle still says `SDK location not found`, ensure `ANDROID_HOME` is set in the same terminal, or that `android/local.properties` contains:

```
sdk.dir=/Users/<you>/Library/Android/sdk
```

(`android/local.properties` is machine-local and must not be committed.)

### Dev demo path

1. Tap **Next** on Info (watch 25/75 auth morph).
2. Enter full name + phone, or tap **Dev: complete profile → Hub**.
3. Mock Google uses the email field (`@sst.scaler.com` or `@scaler.com`).
4. Mock OTP is **`123456`**.
5. On Hub, tap a module in the floating nav (pill highlight + Home returns to root).

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

**Phone OTP on Expo Go:** Firebase JS phone auth needs a native ApplicationVerifier. Use mock auth for Expo Go; use a dev client / `@react-native-firebase` for production phone linking, or send OTP via a Cloud Function + Twilio.

## Email identity

- `user@scaler.com` → Scaler Employee
- `ariyan.25bcs10115@sst.scaler.com` → batch **2025**, pass-out **2029**, roll **10115**, program **bcs**

## Scripts

```bash
npx expo start -c          # Metro + QR for Expo Go 54
npx expo start --tunnel -c # if LAN/QR fails
npx expo run:android       # physical Android / emulator (needs ANDROID_HOME)
npx expo start --dev-client
npm run ios
npm run android
npm run test:identity
```

## Docs

- [progress.md](./progress.md) — tracker
- [docs/decisions.md](./docs/decisions.md) — locked grill decisions

## Repository

Canonical remotes: [Hollenite/ScalerOne](https://github.com/Hollenite/ScalerOne) and [DeeKush/ScalerOne](https://github.com/DeeKush/ScalerOne).
