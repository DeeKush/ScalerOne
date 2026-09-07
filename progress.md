# ScalerOne — Progress Tracker

**Status:** Lost & Found + JS Firebase web auth + fluid hub nav on **Expo SDK 54** (JavaScript)  
**Last updated:** 2026-09-07

---

## Current phase

| Phase | Status |
|---|---|
| Grill / shared understanding | Done |
| 0–5 Motion MVP | Done (replaced by ID-card swipe-up) |
| JS conversion + folder cleanup | Done |
| ID-card onboarding (swipe → Google → flip → OTP) | Done |
| JS Firebase + expo-auth-session (web Google) | Done |
| Fluid hub nav / press motion / Submit OTP without send | Done |
| Standalone tester APK (`npm run apk`) | Done |
| **Lost & Found module** | **Done** |
| Marketplace module | Next |

---

## Lost & Found

The first real content module, and the template the other modules follow:
screens under `app/(hub)/lost-found/`, UI in `src/lostFound/`, data access in
`src/lib/lostFound/` behind a repo interface, React Query for server state,
Zustand for local UI state only.

| Feature | Status |
|---|---|
| Feed / browse (search, type tabs, category chips, empty state) | Done |
| Report an item (shared form, lost/found framing, photo + autofill) | Done |
| On-device SQLite persistence (replaces the in-memory mock repo) | Done |
| Item detail + claim + WhatsApp contact reveal | Done |
| Poster view: claims received, mark resolved | Done |
| My Posts: list own posts, edit, delete | Done |
| Reopen a resolved post (poster only) | Done |
| Real photo thumbnails on feed cards | Done |

## Hub shell

| Item | Status |
|---|---|
| Utility tile icons (4 of 6 modules) | Done |
| Every nav control goes somewhere deliberate | Done |
| Looping floating nav + SVG bump | Done |

Tile art lives in `assets/images/hub/` and is wired through `HUB_ART` in
`hubSections.js`. Room Swap and Photo Hub have no art yet and fall back to the
text glyph in `FloatingHubNav`'s `glyph()` map — add a PNG named after the
section id and an entry in `HUB_ART` to give them one.

Unbuilt modules land on `app/(hub)/section/[id].jsx`, which is now an explicit
"Coming soon" screen listing that module's planned actions. That is deliberate:
a control that looks tappable must never silently do nothing. When a module
gets built, give its section a `route` in `hubSections.js` (and routes on its
sub-actions) and it stops routing to the placeholder.

### Data layer

`src/lib/db/localDb.js` opens one shared SQLite database (`scalerone.db`) and is
reused by every future module — no Lost & Found specifics live there.
`src/lib/lostFound/index.js` picks the active repo from
`EXPO_PUBLIC_LOSTFOUND_BACKEND` (`local` default, `firestore` still stubbed), so
screens never import a backend directly.

Repo interface: `listItems` · `getItem` · `listClaimsForItem` · `createItem` ·
`updateItem` · `deleteItem` · `claimItem` · `resolveItem` · `reopenItem`.

Notes worth remembering:

- `updateItem` only writes content fields. `type`, `postedBy`, `status` and
  `createdAt` are structural/system fields and are deliberately not editable.
- `deleteItem` and `claimItem` each run in a single transaction, so a delete
  can never leave claim rows orphaned against a missing item.
- Schema creation and seeding run once per session behind a memoized promise;
  a failed init is not cached, so a transient failure doesn't poison the session.

### Web (dev only)

The app ships as an Android APK, but it runs on web for fast iteration. Two
things are required and are already configured in `metro.config.js`:
`assetExts` includes `wasm`, and the dev server sends COOP/COEP headers so the
page is cross-origin isolated — expo-sqlite's web backend needs
`SharedArrayBuffer`. Note `openDatabaseAsync` is used rather than
`openDatabaseSync`; the sync path fails on web.

Also worth knowing: `Alert.alert` is a **no-op** on react-native-web, so it must
never be the only way an error is surfaced. Failures render inline instead.

Google on web uses Firebase JS + `expo-auth-session`. Do not use
`@react-native-google-signin` in the browser (Play Services error).

---

## How to run

```bash
npm install
npm run web
```

Tester APK (no USB):

```bash
npm run apk
```

---

## Grill decisions

See [docs/decisions.md](./docs/decisions.md). Item 7 updated to swipe-up + flip.

---

## Blockers / follow-ups

- [ ] Figma edit seat for design sync
- [ ] Real Firebase project + Google client IDs
- [ ] Native phone OTP in the release APK (mock still default on web)
- [ ] Splash screen (deferred)
- [ ] Wire `firestoreRepo.js` once a Firebase project exists (all methods stubbed)
- [ ] Claims are one-directional for v1 — no accept/decline step
- [ ] Tile art for Room Swap and Photo Hub (the other four have icons)

### Backlog — deliberately deferred, not forgotten

- [ ] Pull-to-refresh on the feed
- [ ] Search across description and location, not just title
- [ ] Sharing a post outside the app
- [ ] Moderation / reporting a post
