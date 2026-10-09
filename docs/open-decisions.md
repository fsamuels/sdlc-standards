# Open decisions

Questions about changing the standard that are being explored but **not yet decided**. Nothing
here is a rule, and nothing here has changed `plugins/sdlc/standards/`. When one of these
settles, the outcome goes into the standard (and `CHANGELOG.md`), and the entry here is marked
resolved with a pointer to where it landed — not deleted.

Entries are keyed by a short slug rather than a number, partly because of
[the first entry below](#id-allocation-collides-across-parallel-branches).

| Entry | Raised | State |
| --- | --- | --- |
| [ID allocation collides across parallel branches](#id-allocation-collides-across-parallel-branches) | 2026-10-09 | Open — exploring options |
| [What, if anything, to borrow from the Open Knowledge Format](#what-if-anything-to-borrow-from-the-open-knowledge-format) | 2026-10-09 | Open — leaning "borrow ideas, don't conform" |

---

## ID allocation collides across parallel branches

### Problem

[`documentation.md`'s ID scheme](../plugins/sdlc/standards/documentation.md#ids-are-the-linking-api)
allocates IDs by "take the next free number" from a shared file. That assumes one writer at a
time. With two feature branches in flight, both take the same next number (`D-14`), and the
second to merge has to renumber — which the same section forbids ("never renumber").
Observed in practice, not hypothetical.

There are two distinct collisions, and a fix has to address both:

1. **Semantic** — two branches claim the same ID.
2. **Textual** — two branches append a row to the end of the same table, and git reports a
   conflict on adjacent lines even when the IDs differ.

### Options considered

| Option | Fixes semantic | Fixes textual | Proven where | Cost |
| --- | --- | --- | --- | --- |
| **A. Issue/PR number as the ID** | Yes — GitHub allocates centrally | Only if paired with one-file-per-record | Kubernetes KEPs (tracking-issue number), Rust RFCs (renamed to PR number) | Every item needs an issue first; ties the process to GitHub |
| **B. Date + slug** (`2026-10-09-auth-provider`) | Yes, short of same-slug-same-day | Only if paired with one-file-per-record | log4brains ADR filenames | Long IDs; "D-14" becomes "D-2026-10-09-auth-provider" |
| **C. One file per record** (e.g. MADR for decisions) | No — MADR's default `NNNN-` prefix still collides | Yes | MADR, Nygard ADRs, adr-tools | Splits single tables into directories; needs A or B for the ID |
| **D. `merge=union` in `.gitattributes`** for append-only tables | No | Yes, for appends | Built-in git | Unsafe on edited rows; only correct once IDs can't collide |
| **E. Path-as-identity** (OKF) | Yes | Yes | OKF v0.2 | Contradicts "cite an ID, not a path"; a rename breaks every reference |
| **F. Allocate at merge time** (placeholder on the branch, renumbered by automation on merge) | Yes | Partly | Rust RFCs (manual rename) | Needs tooling or a manual step; renumbering after the fact is what the rule forbids |

### Current leaning (not a decision)

Per ID kind, rather than one scheme for everything:

- **`F-` features** → GitHub issue numbers (A), *if* features are already tracked as issues.
- **`D-` decisions** → MADR files under `docs/decisions/` (C), named date + slug (B), with an
  added `reversibility` frontmatter field to keep that column's role. MADR's
  "Considered Options" and `status: superseded by …` already cover "record what was rejected"
  and the supersession chain.
- **`OQ-` / `C-`** → labelled GitHub issues (A); an open question's natural home.
- **`M` milestones** → unchanged. Planned up front, not allocated from parallel branches.
- Rules that survive any option: never reuse an ID, strike don't delete, supersede don't remove.

### Still to explore

- Other schemes not yet looked at (e.g. short random/hash IDs, Changesets-style fragment files,
  towncrier-style news fragments keyed by issue number).
- Whether depending on GitHub issues is acceptable for every adopter, or whether B everywhere
  is the safer, platform-neutral default.
- Which adopter pilots it. carpooled is the only one using the `F-/D-/C-/OQ-` scheme today
  ([`roadmap.md`](roadmap.md#the-gap-as-of-2026-09-02)), so migration cost is lowest now.
- Migration of existing carpooled IDs: keep old numeric IDs as aliases, or rewrite references.

### What would settle it

A pilot in one adopter running parallel branches for a few weeks with no renumbering, per this
repo's rule that a practice is written into the standard only after a project has run it
([`documentation.md` audit note](../plugins/sdlc/standards/documentation.md#audit-note)).

---

## What, if anything, to borrow from the Open Knowledge Format

### Context

Google's [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
(spec now at
[`GoogleCloudPlatform/open-knowledge-format`](https://github.com/GoogleCloudPlatform/open-knowledge-format),
v0.2 as of 2026-10-09) is a markdown-plus-YAML-frontmatter format for agent-readable knowledge
bundles: one concept per file, only `type` required, optional `index.md`/`log.md`, provenance
and lifecycle fields. It is a *file format* for data-catalog knowledge; this repo is a *process
standard* with gates. Most of the two don't overlap.

### Comparison

| Area | This standard | OKF v0.2 | Read |
| --- | --- | --- | --- |
| Granularity | Small single-topic files, for focused AI context | One concept per file | Same instinct |
| Navigation | One hand-maintained README doc map (description + change frequency) | Per-directory `index.md`, entries from each file's `description` | OKF's is generatable; ours is hand-maintained and can drift |
| History | `CHANGELOG.md`, README audit log | `log.md`, dated headings, newest first | Close enough; little to gain |
| Identity / links | Cite IDs, not paths | Path *is* identity; bundle-absolute `/…` links recommended | Conflict |
| Broken links | CI fails on them | Consumers MUST tolerate them | Not a conflict — producer discipline vs. consumer robustness |
| Lifecycle | "Documenting what is not real yet"; status means this repo | `status: draft \| stable \| deprecated` | OKF's is coarser; could sit alongside, not replace |
| Freshness | Change-frequency column (prose) | `generated.at`, `stale_after` | OKF's is machine-checkable |
| Provenance | "Who decided" column; audit notes in prose | `generated.by`, `verified[]`, actor prefixes (`human:<id>`, `<tool>/<version>`), derived trust tiers | OKF is clearly stronger |
| Decisions | Append-only log with rationale and reversibility | Nothing | Ours |

### Candidates to borrow

1. **`generated.by` / `verified` trust tiers** — distinguishes agent-written-unreviewed docs from
   human-reviewed ones. Most aligned with this standard's premise that review, not authorship,
   is the bottleneck. Could later back a check that surfaces unreviewed AI-authored docs.
2. **Frontmatter `description` + a generated or CI-checked doc map** — turns "adding a doc
   without its row is an incomplete change" into something checkable.
3. **`stale_after`** — an optional, checkable complement to the change-frequency column.

### Candidates to reject or adapt

- **Path-as-identity** — keep IDs (see the entry above for how IDs themselves may change).
- **Bundle-absolute `/…` links** — on GitHub, `/` resolves to the repo root, so with `docs/` as
  a bundle root these break in rendering and in `check-links.mjs`. Relative links (also valid
  OKF) only.
- **Full conformance** (`type` on every `.md`, reserved `index.md`/`log.md`) — the spec is
  pre-1.0 and already made breaking renames from v0.1 to v0.2 (`timestamp` → `generated.at`).
  Committing six adopters to it is costly to reverse.

### Still to decide

- Goal: interoperability with OKF tooling (needs conformance) vs. borrowing ideas (doesn't).
- Pilot location: this repo's own `standards/*.md`, one adopter, or not at all.
- Sequencing against [`roadmap.md`](roadmap.md): wait for the alignment pass to finish, or
  land frontmatter before step 4 (the `docs/` audience split) so it isn't redone.

### Current leaning (not a decision)

Borrow ideas, don't conform. The ID-collision question above is the more pressing problem, and
OKF is not the best-proven answer to it.
