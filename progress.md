# Scaler Hub — Progress Tracker

**Status:** Motion MVP on **Expo SDK 54** (Play Store Expo Go 54.x)  
**Source plan:** `/Users/ariyan/Downloads/scaler-hub-implementation-plan.md`  
**Last updated:** 2026-08-12

---

## Current phase

| Phase | Status |
|---|---|
| Grill / shared understanding | Done |
| 0–5 Motion MVP | Done |
| Expo Go native pin fix | Done |
| Downgrade SDK 57 → **54** | Done |

---

## How to run

```bash
npm install --legacy-peer-deps
npx expo start -c
```

Use **Expo Go 54.0.x** from the Play Store.

---

## Grill decisions

See [docs/decisions.md](docs/decisions.md). All 11 locked.

---

## Blockers / follow-ups

- [x] Expo Go crash from async-storage / gesture-handler v3 — pinned to SDK 57 (`2.2.0` / `~2.32.0`)
- [ ] Figma edit seat for design sync
- [ ] Real Firebase project + Google client IDs
- [ ] Native phone OTP (Expo Go limited) — use mock or dev client
- [ ] Splash screen (deferred)
- [ ] Real module CRUD (post-v1)
