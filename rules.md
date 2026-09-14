# Project Rules

Standing rules for anyone (human or AI) working on ScalerOne. These come
directly from the project owner and apply until they're explicitly changed
here — don't infer exceptions from a single task's context.

## Repositories

This is a collaborative project with two remotes, and they are not
equivalent:

- **`origin` — [Hollenite/ScalerOne](https://github.com/Hollenite/ScalerOne)**
  — the collaborator's repo.
- **`deekush` — [DeeKush/ScalerOne](https://github.com/DeeKush/ScalerOne)**
  — the project owner's own repo.

Rules for working across them:

1. **Pull from both remotes whenever starting a work session**, before
   making changes. Fetch both, check whether either has moved since local
   `HEAD` last synced, and report what you find — don't just assume the
   local tree is current.
2. **Never push without being explicitly told to.** Committing locally is
   fine; pushing to either remote requires the owner to say so at the
   time, even if pushing was approved for a previous task. Approval does
   not carry forward.
3. **Never force-push, anywhere, under any circumstances.**
4. When a push is authorized: `origin` should generally receive a clean
   fast-forward. If `origin` has moved in a way that would make it not a
   fast-forward, stop and report what changed rather than merging or
   forcing blindly — that's the collaborator's concurrent work and it
   isn't safe to guess how to reconcile it. `deekush`'s `main` carries
   history and config (e.g. Firebase setup) that must never be overwritten
   or rebased over; work meant for that remote goes to a new, clearly
   named branch, never to `main`.

## Decision-making

5. **Don't choose on the project owner's behalf.** If a task involves a
   choice that wasn't explicitly specified — a tradeoff between two valid
   approaches, a library pick, a scope boundary that could reasonably go
   either way — ask before proceeding rather than picking the reasonable
   default and moving on. This applies even when an answer seems obvious;
   the point is the owner decides, not that the eventual answer is likely
   to differ.

## Scope

6. **Database work is currently out of scope.** Do not do provisioning,
   schema changes, migrations, or persistence-layer cutover work (e.g.
   moving Lost & Found off on-device SQLite onto the Mongo-backed API)
   unless separately and explicitly requested. Current active work is
   scoped to the image pipeline and the vector-matching ("matches")
   functionality.
7. **Auth stays dummy.** Google sign-in and phone OTP remain mocked
   (`123456` OTP, mock session) until a dedicated auth workstream is
   explicitly started. Don't wire real Firebase Auth as a side effect of
   other work, even if it would technically unblock something.

## Cost

8. **Build on free tiers by default.** Every external service this project
   depends on — hosting, database, storage, any API — should run on a free
   tier unless there's no viable free option for what's actually needed.
   When a real investment is eventually justified (the project has grown
   past what a free tier can reasonably support), it should be minimal and
   deliberate, not the starting assumption. When multiple free-tier
   options exist for the same job, don't default to whichever is most
   familiar or first considered — actually compare them (rate limits,
   reliability, what the free tier includes, any data-usage terms worth
   knowing about) and pick the one that best fits this project's specific
   need, then say why.

## Commits

9. **Commit messages must read as human-written, not AI-generated.**
   Short, plain subject lines in normal conventional-commit style (e.g.
   "Add local SQLite persistence for lost & found"). A body only when it
   adds real context, 2-4 lines max — never a changelog. No AI attribution
   footers of any kind on commits in this repo's actual history (the
   `Co-Authored-By` line some tooling adds by default should be omitted
   here — this project's own rule overrides that default).
10. **Group commits at a medium granularity.** Don't squash a work session
    into one giant commit, and don't split it into dozens of tiny ones.
    Group along natural feature/fix boundaries — each commit should be a
    coherent, reviewable unit of work.

---

*This file is a living record — add to it as new standing rules come up,
rather than letting them live only in chat history.*
