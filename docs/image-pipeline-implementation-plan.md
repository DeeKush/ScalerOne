# Lost & Found — Image Pipeline: Implementation Plan

Turns [lost-found-production-roadmap.md](./lost-found-production-roadmap.md)
(what/why) and [image-pipeline-architecture.md](./image-pipeline-architecture.md)
(how it works today) into concrete, ordered engineering work: exact files,
exact functions, exact order. Scope and decisions already locked per
[rules.md](../rules.md) are treated as settled here, not reopened — this
plan does not touch item persistence, does not touch auth, and assumes the
single-provider Gemini decision from the architecture doc.

Two things surfaced while re-reading the code specifically to write this
plan, not previously documented — folded in below where they belong:

- `runAnalysis()` in `ReportItemForm.jsx` has no `catch` — only
  `try`/`finally`. The mock never throws, so this has been invisible, but
  a real network call to Gemini absolutely can fail, and today that
  failure would become a silent unhandled rejection with no user-visible
  effect at all (the analyzing spinner just clears). This has to be fixed
  as part of Phase 4, not after it.
- There are **four** remaining `Alert.alert` calls in that same file
  (lines ~128, ~139, ~154, ~167), all still no-ops on `react-native-web`
  per this project's standing lesson — camera-permission-denied,
  library-permission-denied, "could not save photo," and, most
  importantly, **the "Add a photo" chooser itself** (Take Photo / Choose
  from Library / Cancel). That last one is the entry point to the entire
  photo flow — on web, tapping "Add a photo" today likely does nothing
  visible at all. The file already has the right pattern to copy: the
  submit-failure path was already fixed this way (`submitError` state +
  a `submitErrorBox` rendered inline, with a comment explaining exactly
  why). These four just never got the same treatment.

---

## Prerequisites — the one thing only you can do

**A Google AI Studio account and a Gemini API key.** I can't create a
third-party account on your behalf. Once you have a key (aistudio.google.com,
free tier, no card required per the research you did last turn), it goes
into `server/.env` as `GEMINI_API_KEY` — never as an `EXPO_PUBLIC_*`
variable, matching how `HF_TOKEN` and `MONGODB_URL` are already handled.
Everything in Phase 4 is blocked on this key existing.

Everything in Phases 1–3 is not blocked on anything external and can start
immediately.

---

## Phase 1 — Fix the known correctness gaps

### 1.1 Replace the four `Alert.alert` calls with inline UI

File: `src/lostFound/ReportItemForm.jsx`. Pattern to follow: the existing
`submitError` state + `submitErrorBox` style, already proven to work on
web.

- **`onPressPhoto()` (the real priority)** — replace the 3-button native
  alert with an inline chooser rendered in the form itself: two
  always-visible pressables ("Take Photo" / "Choose from Library") shown
  when no photo is picked yet, or as a small row under the existing photo
  preview once one is. No native action sheet, no platform-conditional
  branching needed — plain `Pressable`s work identically on web and
  native.
- **Camera/library permission denied** — add a `photoError` state
  (mirrors `submitError`), set it in place of the `Alert.alert` calls,
  render it near the photo picker the same way `submitErrorBox` renders
  near the submit button.
- **"Could not save photo"** (`persistPickedPhoto` throwing) — same
  `photoError` state, same rendering.

### 1.2 Thread the picker's real mime type through

Files: `ReportItemForm.jsx`, `src/lib/media/uploadImage.js`.

- `ImagePicker.launchCameraAsync`/`launchImageLibraryAsync` results
  already include `assets[0].mimeType`. Capture it in `onPickedPhoto` and
  carry it alongside the uri (e.g. `photoMime` state next to `photoUri`).
- `uploadImage({ feature, uri, mime })` already accepts an explicit
  `mime` — pass the captured one through at the call site in
  `handleSubmit` instead of letting `uploadImage` fall back to guessing.
- In `uploadImage.js`, keep `mimeFromUri()` only as the last-resort
  fallback for the rare case a picked asset has no `mimeType` — don't
  delete it, just stop relying on it as the primary path.

### 1.3 Add client-side compression before upload

Files: `ReportItemForm.jsx` (or a new small helper,
`src/lib/media/compressImage.js`, to keep the form component from
growing another responsibility).

- Add `expo-image-manipulator` (an Expo-maintained, on-device library —
  no external service, no API key, fits Rule 8 trivially since it's not a
  network dependency at all).
- In `onPickedPhoto`, before `persistPickedPhoto`/`runAnalysis`, resize to
  a sane max dimension (e.g. longest side ~1600px — comfortably enough
  detail for both the feed thumbnail and Gemini's analysis) and compress
  to roughly quality 0.6–0.7, targeting well under the server's 2 MB cap
  with real margin, not right up against it.
- This one change fixes the single most likely real-world failure named
  in the roadmap: an un-compressed modern phone photo routinely exceeding
  2 MB and being rejected outright.

**Phase 1 exit check:** on web, tapping "Add a photo" actually opens a
working chooser; a large real photo from a real camera uploads
successfully; a wrong-type file shows a real inline error, not silence.

---

## Phase 2 — Verify the full chain for real

No new code — this is the manual verification pass the roadmap already
specifies (§Phase 2 there), run against the Phase 1 fixes:

1. Real photo, web browser: pick from library, submit, confirm the item's
   `photoUrl` is a working R2 URL and renders in the feed.
2. Real photo, camera capture (not gallery) on an actual Android device,
   to catch anything the emulator/web path wouldn't.
3. A PNG specifically, to confirm the real-mimeType fix actually reaches
   R2 with the correct `Content-Type` (check the R2 object's metadata,
   not just that it renders — browsers are lenient about mislabeled
   images, so "it displays" doesn't prove the fix worked).
4. Edit an item's photo, confirm the old R2 object is gone from the
   bucket. Delete an item with a photo, same check.
5. A HEIC photo if an iPhone is available, to settle that open question
   one way or the other.

---

## Phase 3 — Failure and edge-case handling

Mostly already fine, verify rather than build:

- `handleSubmit`'s try/catch already surfaces upload and item-creation
  failures inline via `submitError` — confirm this by actually forcing a
  failure (e.g. temporarily point `EXPO_PUBLIC_API_URL` at a dead port)
  and watching the real UI, not by re-reading the code.
- Trace whether a submit that fails *after* a successful image upload
  (upload succeeds, `createItem` then fails) leaves an orphaned R2 object
  — per the architecture doc, this is structurally possible today. Decide
  then whether that's acceptable for now (an orphan is harmless clutter,
  not a correctness bug affecting any user) or worth a rollback call —
  flagging this as a decision point rather than picking silently, since
  it's new scope (a cleanup mechanism) beyond what's already planned.

---

## Phase 4 — Real, structured, accurate autofill (Gemini)

This is the largest phase. Broken into server work, then client work,
in the order they need to happen (server first — nothing on the client
can call an endpoint that doesn't exist yet).

### 4.1 Server: Gemini client module

New file: `server/src/gemini.js`, styled like the existing `clip.js` —
plain `fetch` against Google's REST endpoint, no new SDK dependency (this
project already avoids heavy SDKs where a direct HTTP call is simple
enough — `clip.js` does the same against Hugging Face).

Responsibilities:

- Read `GEMINI_API_KEY` from `process.env` (server-only, never
  `EXPO_PUBLIC_*`).
- `analyzePhoto({ bytes, mime })` — sends the image plus a prompt
  describing the task, using Gemini's structured-output mode
  (`responseMimeType: "application/json"` with a `responseSchema`) so the
  model is constrained to return exactly the shape below, not free text
  to parse afterward. This is what makes "structured, not a raw dump" a
  guarantee of the API contract, not a hope about model behavior.
- The `responseSchema` constrains `suggestedCategory` to an **enum** of
  the app's exact fixed category ids (`electronics`, `documents`,
  `clothing`, `accessories`, `books`, `keys`, `other`) — Gemini physically
  cannot return a category the form doesn't know how to display.
- The same prompt asks for `detectedText`: any clearly readable text in
  the photo, or `null` — this is the "no separate OCR service" decision
  from the architecture doc, implemented as one instruction in the same
  prompt, not a second call.
- Returns:
  ```json
  {
    "suggestedTitle": "string",
    "suggestedCategory": "one of the 7 fixed ids",
    "suggestedDescription": "string",
    "confidence": { "title": 0.0, "category": 0.0, "description": 0.0 },
    "detectedText": "string | null"
  }
  ```
- Does **not** compute `status` itself — that's derived by the route (4.2)
  from confidence + whether the call succeeded at all, kept out of the
  prompt so it isn't something the model has to get right.

### 4.2 Server: the analyze route

New route in `server/src/routes/lostFound.js` (colocated with the
category list it depends on, rather than the generic `images.js`, since
the category enum is Lost & Found–specific):

`POST /v1/lost-found/analyze-photo`, behind `requireUser` like every other
route here:

- Accepts `{ mime, base64 }` — the raw picked photo, **not yet uploaded to
  R2**, matching today's timing exactly (analysis fires the moment a
  photo is picked, before the student has even decided to submit; nothing
  changes about when this happens, only what powers it).
- Decodes the base64, calls `gemini.js`'s `analyzePhoto`.
- Wraps the call: on success, derives `status`:
  - `"ok"` if every confidence value is reasonably high (a starting
    threshold like 0.5 average is a reasonable default to ship with and
    tune later against real results — flagging this as a tunable, not a
    firm number).
  - `"low_confidence"` otherwise.
  - On any thrown error (network failure, rate limit, malformed response)
    catch it and return `{ status: "failed" }` with everything else
    `null` — a rate-limit rejection and a real analysis failure look
    identical to the client, which is exactly right, since the client's
    job in both cases is the same: degrade honestly.
- Nothing is written to Mongo or R2 by this route — it's a pure
  passthrough, the photo bytes are discarded after the call. Keeps this
  phase entirely outside the "no database work" boundary in
  [rules.md](../rules.md), not just in spirit but literally.

### 4.3 Server: wire it in

`server/src/app.js` — no change needed if `registerLostFoundRoutes`
already registers all of `lostFound.js`'s routes (it does); the new route
just needs to exist in that file.

`server/.env` — add `GEMINI_API_KEY` (see Prerequisites).

### 4.4 Client: call the new endpoint

Update `src/lib/lostFound/photoAnalyzer.js`:

- Replace the `useLostFoundBackend() === 'firestore'` branch entirely —
  per the roadmap's flagged gating bug, that condition would never run
  under production backends anyway. New logic: attempt the real call
  whenever `EXPO_PUBLIC_API_URL` is configured (i.e. whenever the server
  is reachable at all, independent of which backend stores the item
  itself) — analysis is a genuinely separate concern from where the item
  ends up persisted, and coupling it to the item backend was the bug, not
  a feature. Fall back to the mock only when no API URL is configured at
  all (e.g. a pure offline/local-only dev setup) — this preserves a
  working dev experience without a server running, while making the real
  path the default whenever one exists.
- The call itself: base64-encode the local photo URI (the existing
  `uriToBase64` helper in `uploadImage.js` already does exactly this —
  worth extracting it into a small shared util both files import, rather
  than duplicating it) and `apiFetch('/v1/lost-found/analyze-photo', ...)`.

### 4.5 Client: fix the missing error handling and consume the real shape

`ReportItemForm.jsx`'s `runAnalysis`:

- Add the missing `catch` (see the bug noted at the top of this plan) —
  on any thrown error, or on a `status: "failed"` response, set a new
  `analysisFailed` state and show an honest inline message ("Couldn't
  auto-fill from this photo — please fill it in") instead of leaving the
  student looking at a spinner that silently clears with nothing to show
  for it.
- On `status: "low_confidence"`, still autofill (same non-destructive
  "only fill empty fields" behavior already in place) but keep the
  existing "Auto-filled from your photo — review and edit" note, which
  already tells the student to double-check it — no new UI needed for
  this case specifically, the existing copy already covers it honestly.
- **`detectedText` placement — a proposed default, easy to change:** when
  present, append it to `suggestedDescription` as a distinct line (e.g.
  "Text visible on item: <detectedText>") rather than creating a whole new
  form field for it. Reasoning: it's most useful as context for whoever
  reads the post, not as something the student edits directly, and adding
  a new field for what's likely a rare case (mostly the documents/ID-card
  category) adds form complexity for something that won't show up on most
  posts. Flagging this as the default I'd build, not a locked decision —
  say so if you'd rather it show up differently.

**Phase 4 exit check:** picking a real photo of a real object produces a
title/category/description that's actually about that object, not a
canned guess; a photo of a printed page or ID card surfaces its visible
text; killing network access mid-analysis produces the honest failure
state, not silence; the whole thing works under `EXPO_PUBLIC_LOSTFOUND_BACKEND=local`
just as much as `=api`, since analysis no longer cares which one is active.

---

## Phase 5 — Verification checklist

Run the full checklist already specified in the roadmap's Phase 5 —
unchanged by this plan, just repeated here as the definition of "done":
upload correctness (jpeg/png, correct `Content-Type`, compression,
rejection handling), edit/delete cleanup, feed/detail rendering and
fallback, HEIC behavior, and the four analysis-specific items (structured
non-dump result, honest failure state, non-destructive autofill preserved,
real analysis actually running under the active backend).

---

## Build order (what depends on what)

```
Phase 1 (independent, start immediately)
   1.1 inline UI  ─┐
   1.2 real mime   ├─→ Phase 2 (manual verification of Phase 1)
   1.3 compression ─┘

Phase 3 (independent of Phase 1/4, can run any time)

Phase 4 (blocked on the Gemini API key existing)
   4.1 server: gemini.js
   4.2 server: analyze-photo route   ─→ 4.3 wire in / env
                                          │
                                          ▼
   4.4 client: call the endpoint  ─→ 4.5 client: error handling + result mapping
                                          │
                                          ▼
                                     Phase 5 (full checklist, everything together)
```

1.1–1.3 have no dependency on Phase 4 and should land first regardless —
they fix real, currently-live problems (the web photo-picker entry point
being broken is the most urgent single item in this whole plan, since it
blocks the baseline feature, not just the enhancement). Phase 4 can start
in parallel once the API key exists, but its client-side pieces (4.4, 4.5)
depend on its own server pieces (4.1–4.3) existing first.

---

## Files touched, summarized

| File | Change |
|---|---|
| `src/lostFound/ReportItemForm.jsx` | Inline photo-source chooser + error states (1.1); capture real mime (1.2); trigger compression (1.3); fix `runAnalysis` error handling + consume real result shape (4.5) |
| `src/lib/media/uploadImage.js` | Accept/prefer real mime over guessing (1.2); extract shared base64 helper (4.4) |
| `src/lib/media/compressImage.js` *(new)* | Resize/compress helper using `expo-image-manipulator` (1.3) |
| `src/lib/lostFound/photoAnalyzer.js` | Replace mock-vs-firestore branching with real-call-vs-no-server-configured (4.4) |
| `server/src/gemini.js` *(new)* | Gemini REST call + structured schema (4.1) |
| `server/src/routes/lostFound.js` | New `POST /v1/lost-found/analyze-photo` route (4.2) |
| `server/.env` | Add `GEMINI_API_KEY` (prerequisite) |
| `package.json` (root) | Add `expo-image-manipulator` dependency (1.3) |

---

## Status, 2026-09-14 — all four phases built

Phases 1–4 are all implemented; see `progress.md` for the detailed,
dated account of each. Where things actually stand, resolving the three
open items this section used to list:

1. **The Gemini API key** — provisioned and live-verified, 2026-09-14 (see
   `progress.md`). Real end-to-end call through the actual route
   succeeded. Caught and fixed a real issue along the way: the originally
   pinned model was already retired for new projects, so this now uses
   `gemini-flash-lite-latest`, a self-updating alias, instead of a pinned
   version.
2. **The `detectedText` placement default** — went with the proposed
   default (appended to the description as a line). The negative case
   (no text in the photo) is confirmed correct; the positive case (a
   photo that actually has readable text) still needs a real test photo
   to judge.
3. **Order of attack** — ended up doing all four phases in sequence,
   Phase 1 first as suggested, verifying live at each step where the
   sandbox allowed it.
