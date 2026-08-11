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

## What's defined so far

- **Spec-first development** — every project starts with a SPEC.md before
  any code is written.
- **Module-by-module build-out** — large projects are broken into modules,
  each implemented, tested, and merged independently rather than built in
  one large branch.
- **Docs-before-PR** — documentation is updated as part of the same change
  that adds the functionality, not after, and not as a separate follow-up.
- **Branch naming conventions** — defined in
  [`plugins/sdlc/standards/core.md`](plugins/sdlc/standards/core.md): seven
  prefixes, slug rules, branch-from-`origin/main`, and the rule for
  platform-assigned `claude/*` branches.
- **PR template** — [to be defined]
- **Documentation organization** — [to be defined: where docs live, what
  goes in README vs. a docs/ folder, required sections]

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
- How this standard applies retroactively to existing projects vs. only
  going forward

## Auditing existing projects

Before finalizing several of the sections above, I plan to review my
existing repos (starting with Durak Tracker and Chore Corral) with AI
assistance to identify:

- Practices I'm already following consistently, which should just get
  written down as-is
- Practices that vary project to project, where I need to pick one and
  standardize
- Gaps — things I'm not doing anywhere yet but want as part of the standard

This audit happens before each topic file is written, not after, so the
standard reflects real practice rather than aspiration.

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
  session by a `SessionStart` hook. It reloads on resume, clear, compact, and
  fork, so it survives context compaction.
- **Executable workflow** (`plugins/sdlc/skills/`) ships as namespaced skills
  invoked as `/sdlc:<name>`.

See [`docs/packaging.md`](docs/packaging.md) for why this is one plugin and what
would justify splitting it.

## Applying this to a new project

[To be written once the process is fully defined — a short checklist for
starting a new repo under this standard.]

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
