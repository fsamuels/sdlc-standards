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

Early draft. This documents the process as currently practiced; it expands as
patterns get validated across more projects.

**Three adopters so far:** [carpooled](https://github.com/packagedeallabs-ship-it/carpooled)
(since 2026-08-12, the repo the standard was extracted from),
[durak-tracker](https://github.com/fsamuels/durak-tracker) (since 2026-08-11,
branch-lifecycle rules only), and [chore-corral](https://github.com/fsamuels/chore-corral)
(2026-08-16, also the source of the first executable skills layer). Rules here are therefore
validated across three independent projects, not just one — see
[the audit](#auditing-existing-projects) for what each confirmed, changed, or contributed
upward.

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
- **Executable workflow** — `/sdlc:new-branch` and `/sdlc:create-pr`, in
  [`plugins/sdlc/skills/`](plugins/sdlc/skills/), generalized from
  chore-corral's proven local skills (see
  [audit 3](#audit-3--chore-corral-2026-08-16)) rather than designed from
  scratch.
- **Docs-before-PR, enforced.** `create-pr` is advisory — a session can skip
  it and call a PR-creation tool directly, which happened in carpooled on
  2026-08-21 (see [audit 4](#audit-4--carpooled-2026-08-21)). A `PreToolUse`
  hook,
  [`plugins/sdlc/hooks/check-docs-before-pr.mjs`](plugins/sdlc/hooks/check-docs-before-pr.mjs),
  now blocks both paths a session can reach for it by — `gh pr create` over
  Bash, and any MCP tool matching `*create_pull_request*` for environments
  with no `gh` CLI — when the diff touches nothing under `docs/` or
  `README.md`. See [audit 5](#audit-5--carpooled-2026-08-30).
- **`create-pr` works without a `gh` CLI.** Detects whether `gh` is on
  `PATH` and falls back to a GitHub MCP tool
  (`mcp__github__create_pull_request`) when it isn't, rather than assuming
  every environment has it — see audit 5.
- **Auto-install self-heal.** A vendorable
  [`ensure-installed.sh`](plugins/sdlc/scripts/ensure-installed.sh) script
  mitigates an intermittent failure where a project's plugin declaration
  doesn't sync on a fresh session — see audit 5 and
  [`docs/packaging.md`](docs/packaging.md#known-gap-intermittent-auto-install-failure).
- **PR template** — a generalized `Summary` / `Docs updated` / `Checks` template in
  [`plugins/sdlc/templates/pull_request_template.md`](plugins/sdlc/templates/pull_request_template.md),
  extracted from two adopters that had each already built one, for a project to vendor into
  its own `.github/pull_request_template.md` (a plugin cannot write there directly). See
  [`standards/documentation.md`](plugins/sdlc/standards/documentation.md#the-pr-template).

## What's not defined yet

- **Documentation reorganization across adopters** — not an open design question, unlike the
  rest of this list. `standards/documentation.md`'s rules are settled; several adopters just
  don't comply yet. Scoped by topic and sequenced in
  [`docs/roadmap.md`](docs/roadmap.md).
- Commit message conventions
- Testing requirements before merge (coverage thresholds, what must be
  tested vs. what can be skipped) — **and there is now a candidate answer
  waiting, from a repo that ran it.** See [audit 1](#audit-1--carpooled-2026-08-12)
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

**Two of these are live blockers rather than theoretical gaps.** Carpooled
has day-to-day tooling and code review expectations open as
[OQ-X1 and OQ-X3](https://github.com/packagedeallabs-ship-it/carpooled/blob/main/docs/project/open-questions.md)
and is deliberately not answering them locally, which puts this repo on the
critical path for another project. Answer them here first.

**Testing and definition-of-done were on that list and came off it the same
week, which is the more useful story.** Carpooled answered its own version
(OQ-X4) rather than waiting — a runner, a stated line, and a suite behind
it. That is not the drift this standard exists to prevent; it is the only
kind of evidence this standard accepts. The answer is now a promotion
candidate, and the rule it produced is written down below.

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

**What it exposed as missing.** Two gaps, now on the critical path: day-to-day
tooling, and code review expectations for AI-paired work. Carpooled is blocked
on both and is not answering either locally.

**And one correction, which arrived within the week and is the most useful
thing the audit produced.** The adoption change initially routed *three*
questions upward, testing and definition-of-done among them. Carpooled then
answered its own version outright — a runner, a stated line (pure logic, RLS
policies, auth state transitions; presentational components exempt), and a
suite behind it — while the adoption PR was still open.

That was the right call, and it means "route process questions upward" was
too blunt as originally written. **The rule that replaced it:**

> Answer it locally when you have run it and can show the evidence. Route it
> upward when you are about to guess.

Guessing separately in each repo is the drift this standard exists to stop.
A repo that has *run* something is not drifting — it is producing the only
input that makes a rule here worth writing. Carpooled's testing line is a
promotion candidate on the same path the documentation conventions took, and
this correction is now step 6 of the adoption checklist.

### Audit 2 — Durak Tracker, 2026-08-11

The second adopter, and a narrower test than carpooled's on purpose: Durak Tracker took only the
branch-lifecycle rules in [`core.md`](plugins/sdlc/standards/core.md) — wiring the plugin and
pointing `CLAUDE.md`'s branch-naming section at it — and left `documentation.md` alone. Its docs
(`docs/architecture.md`, `docs/current-status.md`, `docs/roadmap.md`, `docs/oauth-setup.md`)
stayed flat, with no ID scheme, no reversibility column, and no decision log at all.

**What this proved.** The two-layer split in [`packaging.md`](docs/packaging.md) isn't only a
hypothetical unbundling — a real adopter took `core.md` without `documentation.md` and nothing
broke. A project can adopt the branch rules on their own and route the rest upward or defer it,
rather than being forced to take the whole standard at once.

**What it left open**, until this round: no decision log, and no link checker despite docs that
already cross-reference each other (`CLAUDE.md` links `docs/architecture.md#metrics`). Both
landed in a documentation-normalization follow-up alongside chore-corral's adoption (audit 3)
rather than being answered twice, independently, in each repo.

### Audit 3 — Chore Corral, 2026-08-16

The third adopter, and the first to arrive with more automation than the standard itself had.
Chore Corral had already built `/new-branch` and `/create-pr` as local Claude Code skills —
branch creation with an uncommitted-work guard, and a docs-before-PR gate that updates its status
doc, runs format/lint/typecheck/build, then pushes and opens the PR — before this repo had any
executable layer at all. [`packaging.md`](docs/packaging.md) had flagged skills as "planned, not
built"; chore-corral had, in effect, already built the concrete version.

**What the audit promoted.** Both skills, generalized and merged into
[`plugins/sdlc/skills/`](plugins/sdlc/skills/) as `/sdlc:new-branch` and `/sdlc:create-pr` — this
standard's first executable layer, sourced from a repo that had run it rather than designed from
a blank page. The generalization that mattered: chore-corral's `create-pr` hardcoded its own doc
filenames (`STATUS.md`, `MILESTONES.md`, …); the shared version instead reads the project's
README documentation map — a table `documentation.md` already requires every adopter to keep —
so the same skill works for a project with entirely different doc names (durak-tracker's
`current-status.md`, carpooled's `docs/project/current-state.md`).

**What the audit surfaced as a real discrepancy, not a preference.** Chore-corral's branch
prefixes were `milestone/feature/fix/docs` — four, with `fix/` where `core.md` says `bugfix/`.
Resolved by adopting the standard's set outright, matching durak-tracker's precedent of dropping
a local closed set rather than carrying a variant forward: `fix/` is retired going forward,
existing `fix/*` branches and merged history are left alone.

**What's still open.** The skills layer is now proven on two Node/pnpm projects
(chore-corral, and durak-tracker as the second consumer) but not on anything structurally
different — a project on another language or with no package manager at all would be the real
test of whether the doc-map-lookup generalization holds, or is itself
carpooled-and-chore-corral-shaped in a different way than the filename-hardcoding it replaced.

### Audit 4 — carpooled, 2026-08-21

Not a new adopter — carpooled catching the standard in a failure mode the first three audits
hadn't hit. A session built and merged [PR #89](https://github.com/packagedeallabs-ship-it/carpooled/pull/89)
(address autocomplete) by calling `gh pr create` directly, never invoking `/sdlc:create-pr` —
the skill existed (audit 3, five days earlier) but nothing required routing through it, and the
session's own general-purpose PR-creation habits were the path of least resistance. Documentation
was added afterward, in [PR #90](https://github.com/packagedeallabs-ship-it/carpooled/pull/90),
exactly the "follow-up documentation PR" `documentation.md`'s own Docs-before-PR section says
this gate exists to prevent.

**What the audit exposed.** A skill is advisory. `when_to_use` makes `create-pr` *likely* to fire
when a session means to open a PR, but nothing stops a direct tool call from skipping it — and a
long session with its own built-in ideas about how to open a PR will reach for those first unless
something more concrete stops it.

**What the audit promoted.** A `PreToolUse` hook,
[`plugins/sdlc/hooks/check-docs-before-pr.mjs`](plugins/sdlc/hooks/check-docs-before-pr.mjs),
wired alongside the existing `SessionStart` hook. It doesn't check whether `create-pr` ran — it
checks the outcome: does the diff going into `gh pr create` touch `docs/` or `README.md`? If not,
and the PR body carries no explicit "None needed" under a `## Docs updated` heading — the same
escape hatch `create-pr`'s own PR template already uses — the tool call is blocked before it
runs, with the reason written to the session so it can fix the diff and retry rather than being
left to guess why the command failed.

**Deliberately fails open.** No `docs/` directory, not a git repo, no determinable base branch —
any of these skip enforcement rather than guessing. A hook that blocks incorrectly teaches a
session to route around it, which is a worse outcome than the gap this audit is closing.

### Audit 5 — carpooled, 2026-08-30

Three more gaps, all hit in the same round of real use, none of them about what the standard
says — about distribution and enforcement.

**Gap A — the plugin didn't auto-install.** A fresh Claude Code Web / remote session on
carpooled had the correct `extraKnownMarketplaces` + `enabledPlugins` declaration in
`.claude/settings.json`, but `claude plugin list` showed nothing installed and `claude plugin
marketplace list` showed no marketplaces configured, until installed by hand. A second fresh
session on the same project, unchanged settings, loaded correctly with no manual step —
**intermittent, not deterministic**, which is the worse failure shape: it passes a one-off
check and then fails in the field. Root cause not found. Mitigated, not fixed: a vendorable
[`ensure-installed.sh`](plugins/sdlc/scripts/ensure-installed.sh) that a consuming project
copies in and wires as its own `SessionStart` hook — it has to live outside this plugin,
since the failure is that the plugin isn't there yet to run a hook of its own. See
[`docs/packaging.md`](docs/packaging.md#known-gap-intermittent-auto-install-failure).

**Gap B — audit 4's enforcement only covered half the exit.** `check-docs-before-pr.mjs`
blocked `gh pr create`, but Claude Code on the web and other remote sessions frequently have
no `gh` CLI at all — only GitHub MCP tools. A session in that environment could still open an
undocumented PR through `mcp__github__create_pull_request` and the audit-4 hook would never
see it. Widened the same matcher-and-diff-check design (not a separate mechanism) to also
match any MCP tool name containing `create_pull_request`, reading the override phrase from
the MCP call's `body` field instead of a shell command string. Verified against nine
synthetic `PreToolUse` payloads piped into the script directly (both call shapes, times
allow/deny/override) before wiring it in.

**Gap C — `create-pr`'s own last step assumed `gh`.** Same root problem as gap B, one layer
up: the skill's step 9 hardcoded `gh pr create`. It now checks for `gh` on `PATH` first and
falls back to the MCP tool when absent, falling back further to reporting a compare URL if
neither exists. `new-branch` was audited too — it only ever shells out to `git`, so it needed
no change.

**What ties the three together.** None of them touch what `standards/documentation.md` or
`core.md` ask a project to do — the gaps are in getting the plugin onto disk and in making
its enforcement match the actual set of tools an environment has, not in the standard being
wrong. Consistent with [audit 1's finding](#audit-1--carpooled-2026-08-12): carpooled
surfaces gaps by running the standard somewhere new, not by disagreeing with it.

See [`CHANGELOG.md`](CHANGELOG.md)'s 0.4.0 entry for the shipped diff, and
[`docs/upgrading.md`](docs/upgrading.md) for the prompt other adopters can use to pick this
up. [`CONSUMERS.md`](CONSUMERS.md) now tracks every known adopter, added in this same round,
so a future breaking change has a known blast radius instead of relying on each owner
noticing a new release.

### Next

The `docs/` split by audience (`product/`/`technical/`/`project/`, as carpooled has it) is still
a promotion candidate rather than a rule: carpooled is the only adopter that has it, chore-corral
is past the roughly-five-file threshold this standard names as the trigger, and durak-tracker is
borderline. Deferred to its own change in each repo rather than bundled into adoption, per
[step 2](#applying-this-to-a-project) — but it's the next thing likely to get written down here
once a second adopter actually does it.

A non-Node/pnpm stack adopting the skills layer is the next real test of whether
`/sdlc:create-pr`'s doc-map lookup generalized cleanly or only moved the carpooled/chore-corral
shape somewhere less obvious.

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
- **Executable workflow** (`plugins/sdlc/skills/`) — `/sdlc:new-branch` and
  `/sdlc:create-pr`, namespaced skills invoked as `/sdlc:<name>`. The prose
  layer is deliberately written to stand on its own without them; the skills
  are convenience on top, not a dependency.
- **Enforcement** (`plugins/sdlc/hooks/`) — a `PreToolUse` hook that backstops
  the docs-before-PR gate: it blocks `gh pr create` and any
  `*create_pull_request*` MCP tool call whose diff skips `docs/`/`README.md`,
  regardless of whether `/sdlc:create-pr` was used to get there. This is a
  third thing again, not prose and not a skill — see
  [`docs/packaging.md#enforcement-the-pretooluse-docs-before-pr-gate`](docs/packaging.md#enforcement-the-pretooluse-docs-before-pr-gate)
  for exactly what it covers.

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

**6. Sort the project's process questions by whether you have evidence.**
Testing requirements, review expectations and definition of done are not
per-project questions, so a project that is about to *guess* at one should
mark it standard-level and leave it open here rather than answering it
twice, differently. **But a project that has actually run something should
answer it, then send the answer up.** The two cases look identical in a
backlog and are opposites in practice:

> Answer it locally when you have run it and can show the evidence. Route it
> upward when you are about to guess.

Carpooled got this wrong in its own adoption change and corrected it within
the week — it marked its testing question standard-level, then answered it
properly with a suite behind it. The corrected version is the rule above.

Steps 5 and 6 are what make this a two-way arrangement. A project that only
consumes rules will quietly accumulate exceptions; a project that only
routes questions upward stalls waiting on a repo with no evidence to answer
from. What keeps the standard describing practice rather than aspiration is
the traffic going both directions.

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
