# Changelog

All notable changes to the `sdlc` plugin are recorded here. Versions refer to
[`plugins/sdlc/.claude-plugin/plugin.json`](plugins/sdlc/.claude-plugin/plugin.json). What
earns a minor vs a patch is defined in [`docs/packaging.md`](docs/packaging.md#versioning).

## 0.11.0

- **`/sdlc:ship` verifies the deploy.** New step 9, after the merge: finds the deployment
  GitHub recorded for the squash commit (deployments API and check runs), waits for a terminal
  state, and reports the environment and URL, a failure with its log link, "no deployment
  detected", or a timeout. It never reverts or pushes a fix on its own after a failed deploy,
  and it never claims a deploy it couldn't see. It doesn't run deploy commands: it assumes
  merging to `main` deploys, as Vercel-style projects do. The skill's description now says
  "from a feature description to a verified deploy", and step 9's old clean-up and report is
  step 10. Minor under the versioning policy: new skill behavior.

## 0.10.0

- **Local sessions must use a worktree, and it's enforced.** New "Local sessions: one worktree
  each" section in `core.md` (replacing the "concurrent agents" draft): every local session
  works in its own sibling `git worktree`, even when only one is running; remote sessions are
  exempt. New `PreToolUse` hook
  [`hooks/require-worktree.mjs`](plugins/sdlc/hooks/require-worktree.mjs) denies file edits and
  working-tree-changing git commands in the primary checkout, with the command to run instead;
  `SDLC_ALLOW_PRIMARY_CHECKOUT=1` opts out. `/sdlc:new-branch` creates the worktree
  (`git worktree add -b … ../<repo>-<slug> origin/main`) from the primary checkout, or switches
  branch inside a worktree you're already in. `/sdlc:ship` therefore works entirely in its own
  worktree, removes it after the merge, and warns about open PRs touching the same files.
  README gains "Running several agents at once". Minor: new rule, new hook, changed skills.
  **Adopters will see edits in their primary checkout start being blocked**, which is the
  point; the deny message explains why.

## 0.9.0

- **Merge standard: squash, then delete the branch.** New "Merging" section in `core.md`:
  every PR lands on `main` as one squash commit (PR title and body as the message) and its
  branch is deleted on merge; merge commits and rebase merges are out. New
  [`scripts/configure-github-repo.sh`](plugins/sdlc/scripts/configure-github-repo.sh) sets the
  GitHub repo to match (squash-only, `PR_TITLE`/`PR_BODY`, auto-delete head branches) and
  `--check` reports drift read-only. `/sdlc:ship` now merges with
  `--squash --delete-branch`, replacing "use the repo's usual method, default to a merge
  commit", and cleans up its local branch and worktree. `/sdlc:create-pr` reminds that the PR
  title and description become the commit message. Adopters run the script once (step 1 of
  adoption). Minor under the [versioning policy](docs/packaging.md#versioning): new rule, new
  script, changed skill behavior.

## 0.8.3

- **Versioning policy written down**, in [`docs/packaging.md`](docs/packaging.md#versioning).
  Minor vs patch is decided by adopter impact (new or changed behavior, rules, scripts, skills
  or standards text is a minor; wording and link fixes are a patch), and a PR bumps the version
  itself. Prompted by 0.8.1 and 0.8.2 being patches when, under this policy, both were minors.
  Releases keep the numbers they were given.

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
