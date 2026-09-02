# Documentation reorganization roadmap

Scope for the second alignment pass, agreed with Forrest on 2026-09-02 after the branch/PR
pass (see `CHANGELOG.md`'s 0.5.0 entry and `CONSUMERS.md`). Where the first pass aligned
process (branch naming, the PR gate), this one aligns each adopter's actual documentation
against the four structural rules in
[`standards/documentation.md`](../plugins/sdlc/standards/documentation.md): the doc map's
change-frequency column, the decision log, the link checker, and the `docs/` audience split.

**This is a scoping document, not an execution log.** It records the gap as observed on
2026-09-02 and the agreed sequence; it does not get updated play-by-play as each project's
reorg lands — that belongs in each project's own docs and, if the reorg surfaces something
worth promoting or correcting here, in this repo's README audit log the way every other
finding has been.

## Why case-by-case, not a new required rule

All three topics below are already-stated rules in `documentation.md` — this pass is closing
non-compliance, not designing something new. But Forrest's call on 2026-09-02 was to leave
enforcement as-is (case-by-case, no new `PreToolUse` gate) rather than hardening any of them
into something the standard blocks on. The doc-map column already reads as non-optional
prose ("is not decoration") without a hook behind it; that stays true after this pass too.

## The gap, as of 2026-09-02

| Project | Doc-map change-frequency column | Decision log | Link checker in CI | `docs/` audience split |
| --- | --- | --- | --- | --- |
| carpooled | done (source of the rule) | done (source of the rule) | done (source of the rule) | done (source of the rule) |
| chore-corral | done | done | done | not done — past the ~5-file threshold, still flat |
| durak-tracker | **gap** — table has no third column | **gap** — open since audit 2 | **gap** — open since audit 2, despite cross-referencing docs | not done — borderline (5 files) |
| timelapse-creator | **gap** — table has no third column | has `docs/open-questions.md`, not a decision log (no ID/reversibility columns) | **gap** | not done — under threshold, correctly flat |
| electric-fence-monitor | **gap** — README has no doc table at all, only a bulleted list | **gap** | **gap** | not done — past the ~5-file threshold, still flat |
| aerial-measurement-tool | N/A — spec-only, `docs/` doesn't exist yet (created at M1 per its own README) | N/A | N/A | N/A |

Not in scope: the `F-`/`D-`/`C-`/`OQ-` ID scheme. It remains carpooled-only across every
adopter, which is exactly what `documentation.md`'s own audit note predicts for a rule
validated by one repo — not a gap, and not part of this reorg unless a second project
independently reaches for it.

## Sequencing

Agreed order, cheapest and least design-dependent first:

1. **Doc-map change-frequency column** — durak-tracker, timelapse-creator,
   electric-fence-monitor. A one-line-per-doc edit to an existing README table (or, for
   electric-fence-monitor, turning its bulleted doc list into a table first). No design
   decisions pending; do this whenever convenient per project.
2. **Link checker** — durak-tracker (oldest open gap, called out in audit 2 and still open),
   timelapse-creator, electric-fence-monitor. Copy
   [`carpooled/scripts/check-links.mjs`](https://github.com/packagedeallabs-ship-it/carpooled/blob/main/scripts/check-links.mjs)
   per `documentation.md`'s existing vendoring guidance; wire into each project's CI.
3. **Decision log** — durak-tracker, timelapse-creator (upgrade `open-questions.md` or add
   alongside it), electric-fence-monitor. More design work than 1–2: needs the
   ID/rationale/reversibility columns `documentation.md` specifies, and a judgment call per
   project on which past choices are worth backfilling versus starting the log from here
   forward.
4. **`docs/` audience split** — chore-corral, electric-fence-monitor (both past the
   threshold), durak-tracker (borderline — Forrest's call whether 5 files justifies it).
   Sequenced last on purpose: it's the biggest structural change, and doing 1–3 first means
   the new decision log and link-checker wiring land directly in the post-split layout
   instead of being redone.

## Out of scope

- aerial-measurement-tool and payroll-processor — the former has no `docs/` yet by design,
  the latter hasn't adopted the standard at all (see `sdlc-standards-phase-plan` memory).
- Any change to what `documentation.md` requires. This roadmap works from the rules as
  written; a rule that turns out to be wrong during the reorg is a separate finding, written
  up in README's audit log the way every other one has been — not silently reinterpreted
  here.
