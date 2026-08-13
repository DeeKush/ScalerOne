# Scaler Hub — Progress Tracker

**Status:** ID-card onboarding on **Expo SDK 54** (JavaScript)  
**Last updated:** 2026-08-13

---

## Current phase

| Phase | Status |
|---|---|
| Grill / shared understanding | Done |
| 0–5 Motion MVP | Done (replaced by ID-card swipe-up) |
| JS conversion + folder cleanup | Done |
| ID-card onboarding (swipe → Google → flip → OTP) | Done |
| Standalone tester APK (`npm run apk`) | Done |

---

## How to run

Tester APK (no USB):

```bash
npm install
npm run apk
```

Install `dist/ScalerHub-preview.apk` on the phone.

Debug:

```bash
npx expo start -c
```

---

## Grill decisions

See [docs/decisions.md](docs/decisions.md). Item 7 updated to swipe-up + flip.

---

## Blockers / follow-ups

- [ ] Figma edit seat for design sync
- [ ] Real Firebase project + Google client IDs
- [ ] Native phone OTP in the release APK (mock still default)
- [ ] Splash screen (deferred)
- [ ] Real module CRUD (post-v1)
