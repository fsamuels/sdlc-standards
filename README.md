# sdlc-standards

A documented, repeatable process for building software with AI-assisted
development tools — spec-first, module-by-module, with documentation and
process enforced at every step rather than left to convention.

This repo is the standard. Individual projects link back to it rather than
redefining these rules locally.

## Why this exists

AI coding tools make execution fast enough that process becomes the
bottleneck and the differentiator. Without a defined process, fast execution
just means fast inconsistency — branch names, doc structure, and PR
practices drift project to project (as they already have across a couple of
my own repos). This repo fixes the process in text so it survives tool
changes and stays consistent across every project going forward.

Documentation here is deliberately split into small, single-topic files
rather than one large document. AI tools work better with focused context,
and a standard meant to be fed back into an AI assistant should be
structured for that from the start.

## Status

Early draft. This documents the process as currently practiced; it will
expand as patterns get validated across more projects.

**One adopter so far:**
[carpooled](https://github.com/packagedeallabs-ship-it/carpooled), since
2026-08-12. Rules here are therefore validated as *workable*, not yet as
*general* — see [the audit](#auditing-existing-projects).

## What's defined so far

- **Spec-first development** — every project starts with a SPEC.md before
  any code is written.
- **Module-by-module build-out** — large projects are broken into modules,
  each implemented, tested, and merged independently rather than built in
  one large branch.
- **Docs-before-PR** — documentation is updated as part of the same change
  that adds the functionality, not after, and not as a separate follow-up.
  Now a concrete five-item gate in
  [`standards/documentation.md`](plugins/sdlc/standards/documentation.md#docs-before-pr).
- **Branch naming conventions** — defined in
  [`plugins/sdlc/standards/core.md`](plugins/sdlc/standards/core.md): seven
  prefixes, slug rules, branch-from-`origin/main`, and the rule for
  platform-assigned `claude/*` branches.
- **Documentation organization** — defined in
  [`plugins/sdlc/standards/documentation.md`](plugins/sdlc/standards/documentation.md):
  README-as-map, `docs/` split by audience, say-it-once,
  status-means-this-repo, the ID scheme as a linking API, the decision log
  with its rationale and reversibility columns, and a CI-enforced link
  checker.
- **PR template** — [to be defined. The docs-before-PR checklist is the
  content; what remains is the `.github/` file itself and whether the
  standard can ship one, given that a plugin cannot write into a consuming
  repo]

## What's not defined yet

- Commit message conventions
- Testing requirements before merge (coverage thresholds, what must be
  tested vs. what can be skipped)
- Code review expectations for solo/AI-paired work
- When to use notebooks/exploratory code vs. when to refactor into modules
- Versioning and release practices
- When AI writes code vs. when I write it, and what I always review by hand
- Dependency and library evaluation — how a new library gets introduced
  (relevant to the one-library-per-module approach used in
  boglehead-analyzer)
- Environment and secrets handling — `.env.example` conventions, what
  never gets committed
- Definition of "done" for a solo/portfolio project — README complete,
  tests passing, no open items in a status table

Three of these — testing requirements, code review expectations, and
definition of done — are live blockers rather than theoretical gaps.
Carpooled has them open as
[OQ-X1, OQ-X3 and OQ-X4](https://github.com/packagedeallabs-ship-it/carpooled/blob/main/docs/project/open-questions.md)
and is deliberately not answering them locally, which means this repo is now
on the critical path for another project. Answer them here first.

**One item left this list rather than getting written.** *How this standard
applies retroactively vs. only going forward* is settled by how adoption
actually went: **going forward only.** Carpooled's already-merged `claude/*`
branches were left alone, and no existing document was restructured to match
`standards/documentation.md` — it described what that repo already did. A
standard that requires a migration before it applies does not get adopted.

## Auditing existing projects

Before finalizing several of the sections above, I plan to review my
existing repos with AI assistance to identify:

- Practices I'm already following consistently, which should just get
  written down as-is
- Practices that vary project to project, where I need to pick one and
  standardize
- Gaps — things I'm not doing anywhere yet but want as part of the standard

This audit happens before each topic file is written, not after, so the
standard reflects real practice rather than aspiration.

### Audit 1 — carpooled, 2026-08-12

The first one, and it produced
[`standards/documentation.md`](plugins/sdlc/standards/documentation.md) more
or less wholesale. Carpooled had independently arrived at README-as-map,
`docs/` split by audience, say-it-once, an append-only ID scheme, and a
decision log with a reversibility column — across ~29 documents, with a
zero-dependency link checker enforcing it in CI. None of that was invented
here; it was written down and generalized.

**What the audit changed on the way up.** Two rules were promoted almost
verbatim because they had visibly *cost* something when broken, which is
better evidence than a rule that merely sounds right:

- *Status always means this repository.* Carpooled tracks three codebases —
  itself, a prototype, and a Lovable demo — and the ambiguity of "the demo"
  cost a wrong assumption about roughly six person-weeks of estimate.
- *Reversibility, sized before the debate.* Carpooled's decision log carries
  an explicit easy/costly/one-way column with the instruction to spend
  deliberation proportional to it.

**What the audit rejected.** Carpooled's `C-` prefix (contradictions between
source documents) is real and useful there, but it exists because that
project was assembled from five conflicting source specs. It went into the
standard as conditional rather than required.

**What adopting it proved about a rule already written.** The
platform-assigned branch rule in
[`core.md`](plugins/sdlc/standards/core.md) fired on the adoption change
itself: the session doing the work was handed a `claude/*` branch and moved
to `docs/adopt-sdlc-standard` cut from `origin/main`. The rule binds, and
the standing-permission wording is what let it bind without stopping to ask
— the first thing the standard asked for was the thing the change adopting
it had to do.

**What it exposed as missing.** Three gaps, now on the critical path:
testing requirements, code review expectations for AI-paired work, and
definition of done. Carpooled is blocked on all three and is not answering
them locally.

### Next

Durak Tracker and Chore Corral, as second and third data points — the ones
that test whether `documentation.md` is general or merely carpooled-shaped.
A rule that survives one repo is workable; a rule that survives three is a
standard.

## How the standard reaches a project

This repo is a Claude Code **plugin marketplace**, not a set of files to copy.
Projects reference it; nothing is duplicated, and updates propagate from here.

Add two keys to the project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "sdlc-standards": {
      "source": { "source": "github", "repo": "fsamuels/sdlc-standards" }
    }
  },
  "enabledPlugins": { "sdlc@sdlc-standards": true }
}
```

The plugin delivers the standard in two layers:

- **Principles prose** (`plugins/sdlc/standards/`) is injected into every
  session by a `SessionStart` hook. Every `*.md` in that directory is loaded,
  so a new topic file ships by existing. It reloads on resume, clear, compact,
  and fork, so it survives context compaction.
- **Executable workflow** (`plugins/sdlc/skills/`) — **planned, not built.**
  It will ship as namespaced skills invoked as `/sdlc:<name>`. Nothing
  executable exists yet, and the prose layer is deliberately written to stand
  on its own without it.

See [`docs/packaging.md`](docs/packaging.md) for why this is one plugin and what
would justify splitting it.

## Applying this to a project

Written from doing it once, on an existing repo. It should hold for a new
one too — a new repo is the same list with less to reconcile.

**1. Wire up the plugin.** Add the two keys above to `.claude/settings.json`
and commit it. Nothing is copied; nothing else is installed.

**2. Do not restructure anything yet.** The standard applies going forward.
Existing branches, merged PRs and current doc layout are left alone. If the
adoption change itself needs a migration, the standard is wrong, not the
repo.

**3. Point the project's own process doc at this one.** A `CONTRIBUTING.md`
should *link* to the standard for branch naming, the docs-before-PR gate and
documentation organization, and keep only what is genuinely local. Restating
a rule locally forks it.

**4. Record it as a decision.** If the project keeps a decision log — it
should — adoption gets a row, with the rationale and the reversibility. It
is an easy one to reverse: two keys.

**5. Reconcile, and push the differences upward.** Where the project already
does something the standard does not describe, that is a candidate for
promotion — write it up here. Where the standard says something the project
cannot follow, **open the disagreement here rather than writing a local
override.** A local override is precisely the drift this repo exists to
prevent, arriving one repo at a time.

**6. Route the project's process questions here.** Testing requirements,
review expectations and definition of done are not per-project questions.
If the project has them open, mark them as standard-level and leave them
open there rather than answering them twice, differently.

Steps 5 and 6 are the ones that make this a two-way arrangement. A project
that only consumes rules will quietly accumulate exceptions; a project that
sends findings back is what keeps the standard describing practice instead
of aspiration.

## Further reading

Background that's informing how this standard takes shape:

- [The New AI-Driven SDLC](https://circleci.com/blog/ai-sdlc/) — CircleCI's
  overview of how AI changes the traditional plan/build/test/deploy phases.
- [GitHub Spec Kit](https://github.com/github/spec-kit) — a five-phase
  gated pipeline (Constitution, Specify, Plan, Tasks, Implement) that maps
  closely to the spec-first/module-by-module approach used here.
- [Spec-Driven Development in 2026](https://dev.to/krlz/spec-driven-development-in-2026-what-it-is-the-tooling-and-how-teams-actually-use-it-2fk2) —
  a maturity model for spec rigor (spec-first, spec-anchored,
  spec-as-source); useful for deciding how strict this standard should be.
- [AI Coding Workflow Optimization: Best Practices in 2026](https://gogloby.com/insights/ai-coding-workflow-optimization/) —
  data on PR review becoming the bottleneck as AI speeds up code
  generation, relevant to the docs-before-PR gate.
