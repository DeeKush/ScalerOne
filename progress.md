# ScalerOne — Progress Tracker

**Status:** Lost & Found + JS Firebase web auth + fluid hub nav on **Expo SDK 54** (JavaScript)  
**Last updated:** 2026-09-14

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

## Image pipeline — Phase 1 (correctness fixes)

Working from [docs/lost-found-production-roadmap.md](./docs/lost-found-production-roadmap.md)
and [docs/image-pipeline-implementation-plan.md](./docs/image-pipeline-implementation-plan.md).
Rules for this work (free-tier-first, no DB changes, ask before deciding
tradeoffs) live in [rules.md](./rules.md).

| Task | Status |
|---|---|
| 1.1 Replace `Alert.alert` photo chooser + error states with inline UI | Done, verified live |
| 1.2 Thread the picker's real `mimeType` through instead of guessing | Done, verified live |
| 1.3 Client-side compression before upload (`expo-image-manipulator`) | Done, verified live |
| 2 Manual verification (local backend, in this sandbox) | Done — see below |
| 2 Manual verification (real device / camera / HEIC) | Still needed, outside this sandbox |
| 3 Failure/edge-case handling | Done — live-verified, one decision made |
| 4 Real Gemini-based structured autofill | Done — built and live-verified with a real key |

**1.2 and 1.3, done 2026-09-14:** `onPickedPhoto` now receives the picker's
real `assets[0].mimeType` (threaded through from both `pickFromCamera` and
`pickFromLibrary`) and passes it to `uploadImage` at submit time instead of
letting `mimeFromUri()` guess from the URI string — that function is now
documented as a fallback only. A new `src/lib/media/compressImage.js`
(`expo-image-manipulator`, resize to a 1600px longest edge + 0.7 JPEG
quality) runs before the photo is persisted, with a try/catch that falls
back to the original file if compression fails rather than blocking the
whole flow.

**Phase 2 — full local-backend chain verified live, 2026-09-14.** Initial
attempts hit a real wall: selecting a file through the picker requires
completing a real OS file-chooser dialog, and Chrome DevTools Protocol's
`Page.handleFileChooser` does not complete that selection for this picker's
`<input>` in headless mode (confirmed directly, not assumed — traced with
temporary debug logging that was then removed). Worked around it by
injecting a real `File` object straight into the picker's `<input>` via
`DataTransfer` + a genuine `change` event, bypassing the OS dialog
entirely. Combined with driving the *real* mock-auth flow (swipe → email →
"Continue with Google" → phone + OTP → submit — not the `__DEV__`-only
skip button, which doesn't exist in a production export), this reached the
real report screen fully authenticated and picked a real photo through the
real picker.

That surfaced two genuine, previously-unknown issues — exactly what live
verification is for:

- `persistPickedPhoto()` threw `this.validatePath is not a function` on
  **every** photo pick on web — `expo-file-system`'s `File`/`Paths`
  classes have no web implementation at all (confirmed by reading the
  package: no `.web.ts` for those classes, only native iOS/Android
  bindings). No photo had ever actually been persisted through the real
  picker path on web before; the project's own history only verified feed
  thumbnails via a hand-planted database seed. The inline error handling
  from Task 1.1 caught it and displayed it correctly — confirming that fix
  works under a real failure, not just a simulated one. **Fixed** by
  skipping the native-only copy-to-document-directory step on web
  (`Platform.OS === 'web'` returns the picked `blob:` URI directly, which
  already lives for the session).
- After that fix, submitting the form appeared to silently do nothing —
  no error, no navigation. Cause: the "Post Lost Item" button was below
  the fold and the test script's synthetic clicks were landing outside
  the actual viewport, hitting nothing. Not an app bug — a test-harness
  gap (fixed by scrolling the element into view before clicking). Worth
  recording because it looked exactly like a silent failure would.

With both resolved, the **entire chain was verified live, for real**: pick
a real photo → compress (confirmed via the rendered `<img>` reporting
1600×1600, matching `compressImage.js`'s target exactly) → persist → mock
autofill title/description → fill category/location → submit → item
appears in the real feed ("9 items", the new post first, "Just now") →
open its detail screen → same compressed photo renders there too, all
fields correct, poster name pulled correctly from the mock email identity.
This is on the `local` (SQLite) backend, in this sandbox — a real device,
a real camera, and a HEIC photo still need a human with actual hardware,
which is outside what this environment can do.

**Phase 3 — failure handling, live-verified, 2026-09-14.** Per the
roadmap: "confirm this by actually forcing a failure... not by re-reading
the code." Temporarily pointed `EXPO_PUBLIC_LOSTFOUND_BACKEND=api` at a
dead port (`EXPO_PUBLIC_API_URL=http://localhost:9999`) — a deliberate,
temporary local-only `.env` edit, reverted immediately after, never
committed — and ran the full report flow against it. Confirmed live: the
submit genuinely fails (no navigation happens), and `submitError`'s inline
box renders "Failed to fetch" exactly where it should, with a matching
`console.error` — the try/catch from the earlier "fix report submission
silently failing on web" work holds up under a real network failure, not
just the happy path.

One small, real observability gap surfaced along the way: the catch
block's log line is `console.error(\`[lost-found] ${isEditing ? 'updateItem' : 'createItem'} failed\`, err)` —
it always says "createItem failed" for a new post, even though the actual
failure could be in the `uploadImage` call just above it. Both raise the
same generic "Failed to fetch" either way, so a developer reading the
console can't tell which step broke without inspecting the stack. Minor,
not blocking, noted for whoever next touches this code.

**Decision point, resolved 2026-09-14:** traced (not live-tested — this
needs a real upload to actually succeed first, which needs real R2
credentials this sandbox doesn't have) whether a `createItem` failure
*after* a successful `uploadImage` can orphan an R2 object. Confirmed
structurally yes: `uploadImage()` runs, then `createItem.mutateAsync()`
runs, both inside the same try/catch, with nothing in the catch block
attempting to undo a just-completed upload if the step after it fails.
There's also currently no server route to even ask for that cleanup —
`deleteImageRecord()` exists server-side but is only called internally by
`routes/lostFound.js`'s own update/delete handlers, not exposed as a
callable endpoint. **Decision: accept it for now.** An orphaned image is
inert storage clutter, never shown to any user, not a security issue, and
likely rare in practice. No rollback mechanism built — revisit only if
this turns out to matter at real scale.

**Phase 4 — real Gemini-based structured autofill, built 2026-09-14.** No
Gemini key exists yet (confirmed: no `server/.env`, nothing in any env
file) — built per the implementation plan, verified everywhere possible
short of the actual Gemini call, which needs a real key.

- **`src/lib/media/uriToBase64.js`** (new) — the base64-reading helper
  extracted out of `uploadImage.js` so both the upload path and the new
  analysis path share one implementation instead of two copies.
- **`src/lib/lostFound/photoAnalyzer.js`** (rewritten) — `analyzePhoto()`
  now calls the real `/v1/lost-found/analyze-photo` endpoint whenever
  `EXPO_PUBLIC_API_URL` is configured, independent of which backend stores
  the item (fixes the gating bug the roadmap flagged — the old code only
  ever reached the real path for the unused `firestore` backend). Falls
  back to the canned mock only when no API URL is set at all.
- **`server/src/gemini.js`** (new) — the actual Gemini call. One
  `generateContent` request per photo, using `responseSchema` (with
  `suggestedCategory` constrained to an enum of the app's exact 7 category
  ids) so the model is structurally prevented from returning a category
  the form doesn't know how to display. Asks for `detectedText` in the
  same call — no separate OCR request, matching the architecture doc's
  decision. Model is `gemini-2.5-flash`, a plain constant, easy to change.
- **`server/src/routes/lostFound.js`** — new `POST /v1/lost-found/analyze-photo`
  route, behind the same `requireUser` middleware as every other route.
  Pure passthrough: nothing written to Mongo or R2, photo bytes discarded
  after the call. Derives `status` (`ok` / `low_confidence` / `failed`)
  from the average of the three confidence values — `>= 0.5` is a starting
  threshold, tunable once real results exist to tune it against. Any
  thrown error (missing key, network, rate limit, malformed response) is
  caught and returns the same honest `status: "failed"` shape a
  low-confidence result would, never a 500.
- **`ReportItemForm.jsx`** — fixed the bug flagged in the implementation
  plan: `runAnalysis` had no `catch` at all (harmless only because the
  mock never threw). Now catches real failures, sets a new
  `analysisFailed` state, and shows "Couldn't auto-fill from this photo —
  please fill the details in yourself" inline — the honest degrade the
  roadmap called for, not a stuck spinner. `detectedText`, when present,
  is appended to the description as a line ("Text visible on item: ...") —
  the proposed default from the architecture doc, still easy to change.
  The picker's real mime now threads through to analysis too, not just
  upload.

**Verified without a key:** clean `expo export --platform web`. Installed
the server's own dependencies for the first time (never done before in
this repo) and started it for real — confirms the app boots and the new
route registers without error. Hit it directly: no auth → 401 (middleware
correct); mock auth (`ALLOW_MOCK_AUTH=true` set in a throwaway,
never-committed `server/.env`, removed after) + empty body → the honest
`status: "failed"` shape; mock auth + a real image but no
`GEMINI_API_KEY` → same honest failure shape, with
`[gemini] analyze-photo failed GEMINI_API_KEY is not set` logged
server-side — exactly the real failure mode until a key is added.

**Real key added and the actual call verified live, 2026-09-14.** You
provided a Gemini API key (from Google Cloud Console, project
`722950641560`) — added to `server/.env` (gitignored, never committed;
**not** the root `.env`, since anything there is `EXPO_PUBLIC_*` and gets
baked directly into the web bundle/APK where anyone could extract it).
Two real, live-testing findings along the way, both fixed:

- The originally pinned model, `gemini-2.5-flash`, was already retired
  for new Google Cloud projects by the time this was first tested for
  real — a 404 said so outright, recommending a successor. Rather than
  re-pin to whatever's current today (and hit this exact problem again
  later), switched to `gemini-flash-lite-latest` — a Google-maintained
  alias, so it keeps pointing at a current, supported model on its own.
- The non-lite `gemini-flash-latest` alias returned a transient 503
  ("high demand") under live testing; the `-lite` tier succeeded cleanly
  on the same request. Lite fits Rule 8 (free-tier-first) better anyway
  for a bounded structured-extraction task like this one — cheaper, and
  apparently had spare capacity when the full model didn't.

With the fix in place, ran a real end-to-end call through the actual
`/v1/lost-found/analyze-photo` route (not a direct API test — the whole
server path) against a synthetic test photo (a hand-generated PNG: a
navy rectangle with a lighter square "front pocket" on a grey
background — not a real photo, since none was available, but real
pixels with real structure, not a blank image). Gemini's response:

```json
{
  "suggestedTitle": "Dark blue backpack with front pocket",
  "suggestedCategory": "clothing",
  "suggestedDescription": "A dark blue backpack featuring a lighter blue square front pocket. Simple design with no visible brands or logos.",
  "confidence": { "title": 0.9, "category": 0.8, "description": 0.85 },
  "detectedText": null,
  "status": "ok"
}
```

It correctly described the shape it was actually given — a backpack with
a front pocket, right colors — not a hallucinated guess. The enum
constraint held (`suggestedCategory` came back as one of the 7 valid
ids, though arguably a real backpack should land on `accessories` rather
than `clothing` — a debatable model judgment call, not a schema
violation). `status: "ok"` was correctly derived server-side from the
confidence average. `detectedText: null` is correct for an image with no
text in it — the positive case (a photo that actually contains readable
text, e.g. an ID card) still hasn't been exercised and needs a real
photo to test meaningfully.

**Still genuinely open:** real-world quality on an actual phone photo of
a real lost item — this synthetic test proves the pipeline works
end-to-end, not that suggestions will be great on messy real photos
(varied lighting, angles, clutter). Worth trying with a few real photos
before trusting this fully.

**1.1, done 2026-09-14:** `onPressPhoto()`'s 3-button `Alert.alert` — the
entry point to the entire photo flow — was a no-op on web per this
project's standing lesson, meaning tapping "Add a photo" in a browser
showed nothing at all. Replaced with two always-visible inline buttons
("Take Photo" / "Choose from Library") in `ReportItemForm.jsx`, plus a new
`photoError` state (mirroring the existing `submitError` pattern) for the
three other `Alert.alert` calls (camera permission denied, library
permission denied, "could not save photo"). Verified live, not just
compiled: ran the web build, swiped through onboarding via the dev-skip
path, opened the real report screen, confirmed "Take Photo" / "Choose from
Library" render, and clicked "Choose from Library" — the browser's real
native file chooser opened (`Page.fileChooserOpened` fired), confirming
the underlying `ImagePicker` call fires correctly. No console errors or
exceptions; only pre-existing framework warnings (Reanimated reduced-motion,
deprecated `shadow*`/`pointerEvents` props) unrelated to this change.

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
- [ ] Google client IDs — the Firebase project itself now exists
      (`scaler-one`, web config added to `.env` 2026-09-14) and is the one
      project for the whole ScalerOne app, Lost & Found included, not a
      separate concern. `EXPO_PUBLIC_USE_MOCK_AUTH` stays `true` on
      purpose — populating the config didn't change any runtime behavior;
      switching it off is a deliberate step for whenever the auth
      workstream actually starts, still needing
      `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` etc. (still empty) first.
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
