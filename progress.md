# ScalerOne — Progress Tracker

**Status:** Native Firebase Auth on **Expo SDK 54** (JavaScript)  
**Last updated:** 2026-08-17

---

## Current phase

| Phase | Status |
|---|---|
| Grill / shared understanding | Done |
| 0–5 Motion MVP | Done (replaced by ID-card swipe-up) |
| JS conversion + folder cleanup | Done |
| ID-card onboarding (swipe → Google → flip → OTP) | Done |
| Native Google + phone OTP (RN Firebase) | Done (needs `google-services.json` + SHA-1 + Firestore) |
| Standalone tester APK (`npm run apk`) | Done (arm64; rebuild after native modules / icons) |
| Product rename to ScalerOne | Done (package `com.scaler.hub` unchanged) |

---

## How to run

Place `google-services.json` at the repo root. `.env` already uses the scalerone-746d8 Web client ID.

**Daily login test** (no 20-minute APK):

```bash
npm install
npx expo run:android
npm start
```

Expo Go is not supported. `npm start` is `expo start --dev-client`.

Sideload without Metro: `npm run apk` → `dist/ScalerOne-preview.apk`.

---

## Grill decisions

See [docs/decisions.md](docs/decisions.md). Item 7 updated to swipe-up + flip. Item 2 is native RN Firebase (no mock).

---

## Blockers / follow-ups

- [ ] Create the default Firestore database on **scalerone-746d8** (ID `(default)`). Google OAuth can succeed while `getDoc`/`setDoc` still return `firestore/unavailable`.
- [ ] Deploy `firestore.rules` after the database exists
- [ ] Register SHA-1/SHA-256 from `npm run apk` in Firebase if Google Sign-In reports DEVELOPER_ERROR
- [ ] Figma edit seat for design sync
- [ ] Real module CRUD (post-v1)
