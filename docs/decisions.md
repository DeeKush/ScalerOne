# ScalerOne — Locked decisions (grill 2026-08-12)

1. **Auth gate:** Google (`@sst.scaler.com` | `@scaler.com`) + full name + phone OTP (all required).
2. **Backend:** Firebase Auth + Firestore (React Native Firebase native SDK) + Cloud Function domain assert. No Expo Go / mock auth.
3. **MVP:** Motion demo; modules are placeholders.
4. **Nav:** Hierarchical modules (LF, Marketplace, Transport Pool, Room Swap, Photo Hub, Split Money).
5. **Home:** Pops to root dashboard; nav morphs to root strip.
6. **Theme:** Academic Blue — bg `#F7F9FC`, accent `#4A90E2`, text `#1B2430`.
7. **Auth motion:** Swipe up (aleqsio template). ID-card front is the hero. Google sits at the bottom after the card shrinks. Google fills the front; the card 3D-flips to the back; then phone OTP.
8. **No Flutter** — degrade blur/loop in RN if needed. App source is JavaScript.
9. **Entry:** Info → Auth → Root; splash later.
10. **Email identity:** `@scaler.com` → Employee; SST `name.YY{program}{roll}` → batch/roll/pass-out (+4).
11. **Active nav:** Pill highlight (no bump).
