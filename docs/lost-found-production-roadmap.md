# Lost & Found — Production Roadmap

**Scope, per project rules ([rules.md](../rules.md)):** the Lost & Found item
persistence model (on-device SQLite vs. the Mongo-backed API, schema,
migrations, provisioning) is **out of scope** and stays untouched. So does
real auth — Google sign-in and phone OTP remain dummy/mock. The existing
Mongo/Atlas/R2 infrastructure that the image pipeline and matches already
depend on (the `images` metadata collection, the `embedding` field on
items, the Atlas vector index) is treated as already-decided — this
roadmap builds on top of it as-is, it does not redesign it or make
provisioning decisions.

Active work is two workstreams:

1. **Image pipeline** — detailed below, this is the current focus.
2. **Matches (CLIP vector search)** — full functionality, roadmap to
   follow separately once the image pipeline work is defined.

---

## Workstream 1 — Image Pipeline

**Definition of the pipeline, stated explicitly so scope doesn't drift:**
capture (picker) → store (upload to R2 + metadata) → process (compression,
validation) → analyze (real inspection of the photo's content) → autofill
(surfacing that analysis to the student). All five stages are part of
"the image pipeline" — this is not just an upload-correctness workstream
that happens to also mention autofill as an aside.

The quality bar for the analyze/autofill stages specifically: results must
be as accurate as the chosen technology can support, and returned as a
well-defined **structured** result — distinct, named fields the form maps
onto directly — never a raw dump of whatever text or data got extracted
for the student to interpret themselves. Phase 4 below is where this is
addressed directly.

### Baseline: what's actually there today (verified against the code)

- **Picker:** `src/lostFound/ReportItemForm.jsx` supports both camera
  (`ImagePicker.launchCameraAsync`) and library
  (`ImagePicker.launchImageLibraryAsync`) capture.
- **Upload:** `src/lib/media/uploadImage.js` reads the picked file, converts
  it to base64 client-side (`uriToBase64`), and POSTs it as JSON to
  `/v1/images`. No compression or resizing happens before this.
- **Server:** `server/src/routes/images.js` decodes the base64, validates
  it (`assertImageBytes`/`extForMime` in `server/src/r2.js` — 2 MB cap,
  jpeg/png/webp only), uploads to R2 (`putR2Object`), and writes a metadata
  doc to the Mongo `images` collection (`_id`, `feature`, `ownerUid`,
  `r2Key`, `publicUrl`, `mime`, `byteSize`, `createdAt`).
- **Cleanup:** `updateItem`/`deleteItem` in `server/src/routes/lostFound.js`
  already call `deleteImageRecord` when a photo is replaced or an item is
  deleted, which removes both the R2 object and its Mongo metadata doc.
- **Rendering:** feed cards and the item detail screen already render
  `photoUrl` when present, falling back to a colour block otherwise.

### Real gaps found while reading this code (not yet fixed)

- **Mime detection is fragile.** `mimeFromUri()` in `uploadImage.js`
  guesses the type by checking whether the URI string contains `.png` or
  `.webp`, defaulting to `image/jpeg` otherwise. Web `blob:` URIs and some
  picker-returned URIs don't carry a real file extension, so a PNG or WEBP
  photo can silently get uploaded and stored with the wrong `Content-Type`.
  `expo-image-picker`'s result actually includes a real `mimeType` on the
  picked asset — that should be threaded through instead of re-derived
  from the URI string.
- **No compression before upload.** A modern phone camera photo is
  routinely 3–8 MB. The server's `MAX_BYTES` cap is 2 MB. As it stands,
  most real camera photos will be rejected outright rather than uploaded —
  this is very likely to be the single most common real-world failure once
  actual students use this.
- **No verified upload-progress or error UI.** It's not yet confirmed what
  `ReportItemForm.jsx` actually shows the user when an upload fails
  (permission denied, network failure, server rejection). Given the
  standing project lesson that `Alert.alert` is a no-op on
  `react-native-web`, any failure here must already be rendering inline —
  this needs to be confirmed by actually triggering each failure, not
  assumed from reading the happy path.
- **Never exercised end-to-end with a real file.** The photo-in-feed-card
  work was previously verified by hand-planting a data-URI seed directly
  in the database, specifically because the real picker path couldn't be
  automated. That means the real device → picker → upload → R2 → rendered
  thumbnail chain has likely never actually been run start to finish.
- **HEIC/HEIF is an open question.** Many iPhones capture photos in HEIC
  by default. It's not yet confirmed whether the picker converts this
  before the app ever sees it, or whether it would hit the server and get
  rejected as an unsupported type. This needs to be checked explicitly —
  it's a plausible real-world failure mode, not a hypothetical one.
- **The `GET /v1/images/:id` proxy route looks unused.** Items store the
  raw R2 public URL as `photoUrl` directly (matching the R2 URL pattern in
  `extractImageId`), not the `/v1/images/:id` proxy path. Worth confirming
  whether anything actually relies on that route before treating it as
  load-bearing.
- **Testing constraint, not a bug:** every mock-auth session sends the
  exact same identity (`Bearer mock:mock-user`, hardcoded in
  `src/lib/api/client.js`), so two "different" test users on two devices
  are currently indistinguishable to the server's ownership checks. This
  doesn't block basic upload testing, but it does limit testing anything
  involving two distinct owners (e.g. confirming person A can't delete
  person B's photo). Flagging this rather than proposing a fix, since
  touching the mock-auth identity shape is auth-adjacent — say the word if
  you want a simple way to vary the mock identity for testing purposes.

### Phase 1 — Fix the known correctness gaps

- Use the picker's real `mimeType` (available on the `ImagePicker` result
  asset) instead of guessing from the URI string, so the correct
  `Content-Type` reaches the server every time.
- Add client-side compression/resizing before the base64 conversion,
  targeting comfortably under the 2 MB server limit, so a normal phone
  photo doesn't fail by default.
- Confirm and, if missing, add a real inline UI state in
  `ReportItemForm.jsx` for: permission denied, picker cancelled, upload in
  progress, upload failed (network or server rejection) — rendered in the
  form itself, never dependent on `Alert.alert`.

### Phase 2 — Verify the full chain for real

- Run the actual flow on a real device/browser: pick or capture a real
  photo, submit a report, confirm the resulting item's `photoUrl` is a
  working R2 URL, and confirm it renders in both the feed card and the
  item detail screen.
- Repeat with a PNG and with a photo taken directly from the camera (not
  the gallery) specifically to catch the mime-detection issue for real.
- Verify the edit flow: replace an existing photo, then check the R2
  bucket directly to confirm the old object is actually gone, not just
  that the code path exists.
- Verify the delete flow the same way: delete an item with a photo, check
  the bucket, confirm the object is gone.
- Explicitly test a HEIC photo if an iPhone is available, to settle the
  open question above one way or the other.

### Phase 3 — Failure and edge-case handling

**Status, 2026-09-14 — done, both items resolved.** Full
account in `progress.md`'s Phase 3 entry; summarized here:

- Confirm what happens on a network failure mid-upload — does the user get
  a clear way to retry, or does the form appear to hang with no feedback?
  **Live-verified**, not just re-read: forced a real network failure
  (temporary `.env` pointing at a dead port, reverted immediately after,
  never committed) and watched the actual UI — `submitError` renders
  inline ("Failed to fetch"), the form stays editable, nothing hangs. Also
  found a minor, non-blocking gap: the error log always says "createItem
  failed" regardless of whether `uploadImage` or `createItem` was the one
  that actually threw.
- Trace the actual order of operations between `createItem`/`updateItem`
  and the image upload in `ReportItemForm.jsx`, and confirm there's no
  sequence that leaves an item with a broken `photoUrl`, or an orphaned R2
  object with no item pointing at it. **Traced (code-level — live-testing
  this needs a real upload to succeed first, which needs real R2
  credentials this sandbox doesn't have): confirmed yes, an orphan is
  structurally possible** — `uploadImage()` then `createItem.mutateAsync()`
  run in the same try/catch with no rollback if the second call fails
  after the first succeeds, and there's currently no server route to even
  ask for that cleanup (`deleteImageRecord()` exists but isn't exposed as
  a callable endpoint). **Decided: accept the harmless clutter, no
  rollback built.** An orphaned image is inert storage never shown to any
  user, not a security issue, and likely rare — revisit only if it turns
  out to matter at real scale.

### Phase 4 — Real image analysis and structured autofill

**Status, 2026-09-14 — built and live-verified with a real Gemini key.**
Full account in `progress.md`. Everything is implemented and working: the
server-side Gemini call with the enum-constrained schema, the
`analyze-photo` route deriving `status` and never returning a 500, the
client's backend-independent gating fix, and the form's missing error
handling. A real key was added and a real end-to-end call through the
actual route succeeded — correct structured JSON, sensible confidence
scores, `detectedText: null` correctly returned for an image with no
text. Along the way, live testing caught that the originally pinned model
(`gemini-2.5-flash`) was already retired for new projects — switched to
the self-updating `gemini-flash-lite-latest` alias instead, which also
turned out to have more spare capacity than the full `flash` alias during
testing (one live 503 on `flash`, none on `flash-lite`). Still open: real
photos, not the synthetic test image used to verify the pipeline — actual
quality on messy real-world photos (lighting, angles, clutter) hasn't
been assessed yet, and neither has the positive `detectedText` case (a
photo that actually contains readable text).

The pipeline isn't complete once the photo is stored — per the definition
above, "analyze" and "autofill" are the remaining two stages, and today
neither is real. `photoAnalyzer.js`'s `mockAnalyzePhoto()` returns one of
5 fixed canned guesses with no relationship to the actual photo (see
[image-pipeline-architecture.md](./image-pipeline-architecture.md), §6–7
for exactly how). Replacing it has to satisfy the two requirements above —
maximum accuracy, structured output — which breaks down into concrete
work:

- **Analysis technology — decided: a single free-tier provider, Google
  Gemini (Flash) via Google AI Studio.** One structured call returns
  `suggestedTitle` / `suggestedCategory` / `suggestedDescription` (with
  per-field confidence) and, in the same call, a best-effort `detectedText`
  for anything clearly readable in the photo — covering the ID-card/
  document case without a second integration. This revises the earlier
  "hybrid: LLM + dedicated OCR" framing per Rule 8 in
  [rules.md](../rules.md) (free-tier-first, minimal footprint): a modern
  multimodal model reading text out of a photo as part of one call is
  standard capability, not a gap that needs a second vendor to fill.
  Chosen over Hugging Face (already carrying this project's CLIP load on
  its own free, rate-limited tier — stacking a second feature onto the
  same quota risked contention) and over OpenAI/Anthropic (no standing
  free API tier, trial credits only).
- **Known free-tier limit, accepted rather than engineered around:**
  Gemini's free tier caps at roughly 10 requests/minute (project-wide, not
  per-student) and 250–1,500 requests/day depending on model/project age.
  Token cost per image (~300 tokens) is a non-issue against the 250K/minute
  token cap — the request-rate ceiling is the only real constraint, and at
  current pilot scale (dummy auth, one campus) it's comfortable. The one
  scenario that could hit it is a burst of simultaneous submissions (e.g.
  an in-person "post now" moment); the `status: "failed"` state below
  already degrades gracefully in that case, so no extra handling is needed
  just to survive a rate-limit rejection.
- **Data-handling decision, made deliberately, not defaulted into:**
  Google's own free-tier terms note that prompts/images may be used to
  improve their products, and specifically advise against uploading
  private or sensitive personal data. Lost & Found documents/ID-card
  photos can carry a student's name and roll number. Decision: send them
  through the same analysis path as any other photo for now, given auth
  is still dummy and this is a small pilot — revisit this specifically if
  the project moves toward real users/production auth at scale, rather
  than assuming the same tradeoff holds forever.
- **Define the exact structured schema** the analysis step returns, and
  how each field maps onto the form. In particular, `suggestedCategory`
  must resolve to one of the app's existing fixed category ids
  (`electronics`, `documents`, `clothing`, `accessories`, `books`, `keys`,
  `other`) — not a free-text label the UI has no slot for. "Structured"
  means the form can bind each field directly, with nothing left for the
  student to parse out of a paragraph.
- **Dedicated OCR is deferred, not cancelled.** If Gemini's built-in text
  reading proves insufficient for real ID-card photos in practice, add a
  dedicated OCR fallback then (e.g. Tesseract.js — free, self-hosted, no
  ongoing API cost) — the "later, minimal" expansion path Rule 8
  describes, not something to build alongside v1 on spec.
- **Define what a failed or low-confidence analysis looks like.** The
  current mock never fails — it always returns a confident-looking guess.
  A real integration needs an honest "couldn't confidently analyze this
  photo, please fill this in yourself" state, distinct from a real
  high-confidence result, rather than showing a possibly-wrong guess with
  the same visual weight as a right one.
- **Fix the backend gating bug while wiring this in.** `analyzePhoto()`
  only reaches the real path when `useLostFoundBackend() === 'firestore'`
  — a stub nobody runs. Whatever real implementation lands needs to
  actually execute under the backends in production (`local`/`api`), or
  it will be dead code the same way `realAnalyzePhoto()` is today.
- **Confirm the entry point works everywhere this needs to run.**
  `onPressPhoto()`'s `Alert.alert`-based Camera/Library choice is flagged
  in the architecture doc as a likely no-op on web — worth settling before
  investing in the analysis step behind it.

### Phase 5 — Verification checklist (run before calling this done)

- [ ] Upload succeeds for a real jpeg and a real png, on-device.
- [ ] Correct `Content-Type` reaches R2 for both (verified via the picker's
      real mime, not inferred from the URI).
- [ ] A photo larger than the pre-compression limit gets compressed and
      still uploads successfully.
- [ ] A genuinely unsupported file type is rejected with a visible inline
      error, not a silent failure.
- [ ] Editing an item's photo removes the old R2 object.
- [ ] Deleting an item with a photo removes its R2 object.
- [ ] Feed card and detail screen both render the real photo; the fallback
      colour block still renders correctly when `photoUrl` is empty.
- [ ] HEIC behavior confirmed one way or the other.
- [ ] Real analysis returns a well-formed, structured result — not raw or
      partial text — across a range of real test photos spanning multiple
      categories.
- [ ] A photo the analysis can't confidently handle produces the honest
      "please fill this in" state, not a wrong guess presented as if
      confident.
- [ ] Autofill still only fills fields the student hasn't already typed
      into — the existing non-destructive behavior is preserved.
- [ ] Real analysis actually executes under the currently active backend
      (`local`/`api`) — not silently gated behind the unused `firestore`
      branch the way it is today.

**Status, 2026-09-14:** the two checklist items that don't require R2/a
real device are confirmed — pick → compress → persist → autofill →
submit → render on both feed card and detail screen, all verified live in
a sandboxed browser session (see `progress.md`'s Phase 2 entry for the full
account, including two real bugs that verification surfaced and fixed).
Everything else on this list needs either the `api` backend with real R2
credentials, or an actual device/camera/HEIC photo — neither available in
this sandbox.

---

## Workstream 2 — Matches (vector search)

Not detailed yet — this follows once the image pipeline work above is
underway. It will cover: confirming the Atlas vector index actually exists
and is queryable, running the embed pipeline against real photos end to
end, verifying the match results render correctly in
`app/(hub)/lost-found/matches/`, and defining what a good/acceptable match
result actually looks like. Flagging now so it isn't lost: matches quality
depends directly on the image pipeline being correct first (a wrongly
compressed or mis-typed image will produce a bad or missing embedding), so
sequencing image pipeline before matches is deliberate, not incidental.

---

## Explicitly out of scope here

- Any change to how Lost & Found items are persisted (SQLite vs. the Mongo
  API, schema, migrations) — see [rules.md](../rules.md).
- Provisioning or configuring R2/Mongo infrastructure itself — this
  roadmap assumes credentials exist or will be supplied, and focuses on
  the pipeline's own correctness on top of that.
- Real Google/Firebase auth and real phone OTP.
- Marketplace and the other unbuilt hub modules.
