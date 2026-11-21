# Changelog

All notable changes to the `sdlc` plugin are recorded here. Versions refer to
[`plugins/sdlc/.claude-plugin/plugin.json`](plugins/sdlc/.claude-plugin/plugin.json).

## 0.8.2

- **ID-collision stopgap.** `documentation.md` now allows renumbering IDs that exist only on an
  unmerged branch (never ones on `main`) and requires a duplicate-ID check in CI. New
  [`scripts/check-duplicate-ids.mjs`](plugins/sdlc/scripts/check-duplicate-ids.mjs), a
  zero-dependency check to vendor. `/sdlc:ship` runs the check after syncing `origin/main` and
  renumbers only its own new IDs. The structural fix remains an open decision, now piloting in
  farm-explorer only: [`docs/open-decisions.md`](docs/open-decisions.md).

## 0.8.1

- **`/sdlc:ship` handles concurrent development and merge conflicts.** New "Concurrent
  development" section: sync `origin/main` at four points (after branching, before the PR,
  while waiting on CI, before merging) by merging, never rebasing, since the skill doesn't
  force-push. Conflicts are classed mechanical / generated / semantic, with no wholesale
  `ours`/`theirs` on hand-written code, `opus` for design-risk conflicts, and stop-and-ask when
  intent is unclear. Checks re-run after every sync, and a semantic resolution triggers a
  re-review. See [`plugins/sdlc/skills/ship/SKILL.md`](plugins/sdlc/skills/ship/SKILL.md).

## 0.8.0

- **`/sdlc:ship` now delegates to subagents to cut cost and parallelize.** The skill runs its
  orchestration on `model: sonnet` and hands bulk work to subagents with an explicit model:
  `Explore` on `haiku` for code mapping, `sonnet` for implementation slices, `haiku` for
  mechanical fixes, and no downgrade for design-risk work. Independent slices (disjoint files,
  interfaces fixed up front) fan out in parallel. Subagents never touch git, the PR or CI, and
  the main thread verifies their diff before moving on. See
  [`plugins/sdlc/skills/ship/SKILL.md`](plugins/sdlc/skills/ship/SKILL.md).
- **Design risk is explicit and routes to Opus.** Slices that touch auth/security, schema or
  persisted data, money, concurrency, public interfaces, or have no repo pattern to copy go to
  `opus`; when unsure, treat as risky; never `haiku`.
- **Review is chosen by diff risk.** Routine diffs use `code-review`; risky diffs get a direct
  `opus` reviewer subagent (the skill takes an effort level, not a model), plus `security-review`
  for security-related changes. A slice's own subagent never reviews its own work.

## 0.7.0

- **New skill: `/sdlc:ship`** —
  [`plugins/sdlc/skills/ship/SKILL.md`](plugins/sdlc/skills/ship/SKILL.md). Takes a feature
  description to a merged PR: optional clarifying questions, `/sdlc:new-branch`, build and
  test, `/sdlc:create-pr`, a `code-review` pass posted as inline PR comments, a fix round
  (fix what's wrong or cheap, answer the rest on its thread), wait for CI, then merge on green
  unless `--no-merge` is passed. Generalized from a chore-corral session (2026-11-13, PR #142)
  that ran this sequence by hand. It sets `disable-model-invocation: true`, so it runs only when
  the user types `/sdlc:ship`. Because it merges by default, it never starts on its own.

## 0.6.0

Prompted by [carpooled#118](https://github.com/packagedeallabs-ship-it/carpooled/pull/118),
which independently reinvented the 0.4.0 self-heal script after carpooled never actually
vendored it — and by the time it did, the silent failure had already let
[carpooled#116](https://github.com/packagedeallabs-ship-it/carpooled/pull/116) merge with
the docs-before-PR gate never running, undetected for weeks.

- **Vendoring the self-heal script is now step 1 of adoption, not an optional step 7
  added reactively.** The auto-install failure is silent — no error, nothing to notice —
  so there is no reliable way to detect it without the hook already in place. See
  [`README.md`](README.md#applying-this-to-a-project) and
  [`docs/packaging.md`](docs/packaging.md#known-gap-intermittent-auto-install-failure).
- **`ensure-installed.sh` now warns after a successful install** that its skills aren't
  necessarily usable in the same session — verified against Claude Code's actual behavior
  (skills enumerate at session start; `/reload-plugins` can refresh mid-session). Also
  reflected in `docs/upgrading.md`'s verification steps.

## 0.5.0

A consistency audit across every known consumer (2026-09-02), ahead of a documentation
reorganization pass. No behavior change to the hooks or skills — this closes gaps in the
standard's own bookkeeping and fills in the one item `README.md` had marked undefined.

- **PR template, generalized.** Adds
  [`plugins/sdlc/templates/pull_request_template.md`](plugins/sdlc/templates/pull_request_template.md)
  — `Summary` / `Docs updated` / `Checks`, matching the body `create-pr` already generates —
  extracted from two adopters (chore-corral, timelapse-creator) that had each independently
  built their own version. See
  [`standards/documentation.md`](plugins/sdlc/standards/documentation.md#the-pr-template) for
  how a project vendors it.
- **`CONSUMERS.md` was missing two known adopters** — aerial-measurement-tool (2026-08-30) and
  timelapse-creator (2026-08-17) both had the plugin wired but no row, defeating the file's
  purpose of tracking blast radius for a breaking change.
- **README's "how the standard reaches a project" section didn't mention the enforcement
  hook.** It described two layers (prose, skills); the `PreToolUse` docs-before-PR gate is a
  third, distinct thing per `docs/packaging.md`, and is now named as one in the README too.

## 0.4.0

Fixes three gaps surfaced by [packagedeallabs-ship-it/carpooled](https://github.com/packagedeallabs-ship-it/carpooled)
using v0.3.0 in a real Claude Code Web / remote session. See [`CONSUMERS.md`](CONSUMERS.md)
for every project this affects.

- **Auto-install self-heal.** Adds
  [`plugins/sdlc/scripts/ensure-installed.sh`](plugins/sdlc/scripts/ensure-installed.sh), a
  vendorable script a consuming project copies into its own repo and wires as a `SessionStart`
  hook in its own `.claude/settings.json`. Mitigates an observed intermittent failure where a
  fresh remote session's `extraKnownMarketplaces` + `enabledPlugins` declaration doesn't sync —
  `claude plugin list` shows nothing installed until installed by hand. Root cause not yet
  found; this is a durable workaround, not a fix upstream. See
  [`docs/packaging.md`](docs/packaging.md#known-gap-intermittent-auto-install-failure).
- **PreToolUse enforcement of the docs-before-PR gate.** `plugins/sdlc/hooks/hooks.json` now
  blocks direct PR-creation calls — `gh pr create` over Bash, and any MCP tool matching
  `*create_pull_request*` — with a `permissionDecision: "deny"` pointing at `/sdlc:create-pr`.
  Previously nothing stopped an agent from calling a PR-creation tool directly and skipping the
  gate entirely. See [`docs/packaging.md`](docs/packaging.md#enforcement-the-pretooluse-docs-before-pr-gate)
  for what it blocks and how to loosen it if it's ever too aggressive.
- **`create-pr` no longer assumes `gh`.** Step 9 now detects whether the `gh` CLI is present
  and falls back to a GitHub MCP tool (e.g. `mcp__github__create_pull_request`) when it isn't —
  some Claude Code environments (the web, other remote sessions) have no `gh` CLI at all. Falls
  back further to reporting a compare URL if neither is available. `new-branch` was audited and
  does not shell out to `gh` anywhere, so it needed no change.

## 0.3.0

Adds the executable skills layer — `/sdlc:new-branch` and `/sdlc:create-pr` — generalized from
chore-corral's local implementation. See the README's audit 3 for what was promoted and why.

## 0.2.0

Adds `standards/documentation.md`: README-as-map, `docs/` split by audience, the ID scheme,
the decision log, and the docs-before-PR gate as a five-item checklist. Extracted from
carpooled's audit (audit 1).

## 0.1.0

Initial plugin: `standards/core.md` (branch lifecycle) delivered via a `SessionStart` hook, and
the marketplace skeleton.
