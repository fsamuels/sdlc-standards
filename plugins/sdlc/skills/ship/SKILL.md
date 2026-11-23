---
name: ship
description: Take a feature description from idea to merged PR — branch, build, open the PR, run a code review on it, fix what matters, answer every comment, and merge once CI is green.
when_to_use: Only when the user types /sdlc:ship. Because it merges by default, it never starts on its own from a feature description.
disable-model-invocation: true
model: sonnet
argument-hint: [--no-merge] [--review low|medium|high] <feature description>
allowed-tools: Agent Bash(git *) Bash(gh pr *) Bash(gh run *) Bash(gh api repos/*) Bash(command -v gh) Bash(node *) Bash(npx *) Bash(npm run *) Bash(npm ci *) Bash(pnpm *) Bash(cat *)
---

# Ship

One command from a feature description to a merged PR, chaining this plugin's own skills
(`/sdlc:new-branch`, `/sdlc:create-pr`) with a code review and a fix loop. Generalized from a
chore-corral session (2026-11-13) that ran this exact sequence by hand — see the CHANGELOG
entry for 0.7.0.

The skill only runs when the user types `/sdlc:ship` (`disable-model-invocation: true`), so a
feature described in passing never triggers an auto-merge.

**Invoking this skill is the user's permission to push, open a PR, comment on it, and — unless
`--no-merge` is given — merge it.** That permission covers this one PR only.

## Cost and parallelism: who does what

The main thread is an orchestrator on a mid-tier model (`model: sonnet` above; a user can
override it per session). It keeps the decisions — what to build, how to triage review
findings, whether to merge — and delegates bulk work to subagents with an explicit `model`, so
tokens are spent at the cheapest tier that does the job and independent work runs in parallel.

| Work | Subagent | Model |
| --- | --- | --- |
| Reading code, mapping what a feature touches | `Explore` | `haiku` |
| Implementing one self-contained slice, with its tests | `general-purpose` | `sonnet` |
| Mechanical fixes: renames, lint/format, doc and changelog edits, simple review fixes | `general-purpose` | `haiku` |
| A slice with design risk (see below) | `general-purpose` | `opus` |

**Design risk means Opus.** A slice is design-risky if a mistake in it would be expensive or
silent, not merely visible in a test. Use `model: opus` for any slice that:

- changes auth, permissions, secrets handling, or anything security-sensitive;
- changes a database schema, runs a migration, or touches persisted data formats;
- handles money, billing, quotas, or other numbers users rely on being exact;
- involves concurrency, ordering, retries, caching, or transactional behavior;
- changes a public interface, API contract, or shared type that other code depends on;
- has no existing pattern in the repo to copy, so the approach itself is a judgment call.

When unsure whether a slice qualifies, treat it as risky. A wrongly-upgraded slice costs a few
tokens; a wrongly-downgraded one costs a bad merge. Never send risky work to `haiku`. The same
rule applies to the fix round: a review finding in risk territory goes to `opus` or stays in the
main thread.

Rules for every delegation:

- **Brief it fully.** A subagent starts cold: give the goal, the exact files it owns, the
  repo conventions it must follow, and what to return (a short summary, not file dumps).
- **Parallel only when disjoint.** Launch subagents in one message only if they touch
  different files and none needs another's output. Anything that shares a file, or builds on
  another slice's interface, runs sequentially or stays in the main thread.
- **Subagents don't touch git, the PR, or CI.** They edit files and run local checks.
  Branching, committing, pushing, review replies and merging stay in the main thread.
- **Verify, don't trust.** After subagents return, read the diff and run the repo's checks
  yourself before moving on. A subagent's "done" is a claim.
- **Don't delegate small work.** If the whole feature is a few lines in one or two files,
  do it inline — spawning costs more than it saves.

## Concurrent development and merge conflicts

Other people, other `/sdlc:ship` runs, and bots merge into `main` while this run is in flight,
so the branch can fall behind or conflict at any step. Handle it the same way everywhere:

**Sync points.** Fetch and integrate `origin/main` at four moments: right after branching
(step 2), before opening the PR (step 4), whenever the PR reports `behind` or `dirty` while
waiting on CI (step 7), and immediately before merging (step 8).

```
git fetch origin main
git merge origin/main        # no-op if already up to date
```

**Merge `origin/main` into the branch; don't rebase.** This skill never amends or force-pushes,
and a rebase of a pushed branch needs a force-push. A merge commit is a normal new commit.

**Resolving a conflict:**

- **Mechanical** — both sides changed adjacent lines, CHANGELOG or docs-map entries, import
  lists: resolve inline, keeping *both* sides' intent.
- **Generated files** (lockfiles, snapshots, build output): don't hand-merge. Take `main`'s
  version, then regenerate with the repo's own command.
- **Semantic** — both sides changed the same logic, or main changed an interface this branch
  uses: read the other change's commit and PR to learn what it was for, then resolve in the
  main thread or an `opus` subagent. Conflicts in design-risk territory (see above) are never
  delegated below `opus`.
- **Never** resolve by taking one side wholesale (`-X ours`/`-X theirs`, `checkout --ours`) on
  hand-written code, or by dropping someone else's change to make the merge go through.
- If you can't tell what the other side intended, **stop and ask** with both versions quoted.

**ID collisions.** If the project allocates sequential IDs (`F-`, `D-`, `C-`, `OQ-` — see
`documentation.md`), a clean textual merge can still leave two rows defining the same ID, or a
conflict on the last line of a shared table. After syncing, run the project's duplicate-ID check
(`scripts/check-duplicate-ids.mjs`, if vendored) or compare the IDs this branch added against
`origin/main`'s. For each collision, renumber **only the IDs this branch added**, to the next
free numbers, and update every reference to them in this branch's diff (docs, code comments,
the PR description). Never renumber an ID that is already on `main`, and keep a table conflict
by keeping both sides' rows. Note the renumbering in the PR description.

**After any merge from `main`:** re-run the repo's checks — a clean textual merge can still
break the build. If it pulled in changes to files this PR touches, or any resolved conflict was
semantic, treat the result as a new head: re-run the review (step 5) on the new diff and
re-answer affected threads. If the merge was a clean no-op for this PR's files, a green check
run is enough. Commit and push as a new commit.

**Within one run.** Parallel subagents own disjoint files, so they shouldn't conflict. If two
still edited the same file, the main thread reconciles it before checks, and tightens the next
slice split.

**Alongside other runs.** If another uncommitted change or branch checkout is already in the
working tree, don't ship from it — see the stop conditions below. A second `/sdlc:ship` on the
same repo belongs in its own `git worktree`.

## Arguments

- `--no-merge` — stop at a green, reviewed PR and report; don't merge.
- `--review <level>` — effort passed to the code review (default `medium`). Never `max` unless
  the user asked for it by name.
- Everything else is the feature description. If it's empty, ask for one.

## Steps

### 1. Understand the feature

Read the project's docs map (README) and the code the feature touches before deciding anything.
For a feature that spans many files, delegate the mapping to an `Explore` subagent
(`model: haiku`) and have it return the relevant files, existing patterns, and test layout.

**Clarify only when the description leaves a real choice open** — one that changes what you
build and that the code can't settle (e.g. "my time" vs. the whole team's; which page it goes
on). Ask 1–3 questions in a single AskUserQuestion call, each with a recommended option first,
then proceed. Don't ask about things with an obvious default; pick it and mention it in the PR.

### 2. Branch

Run `/sdlc:new-branch` inline with the type that fits the work (`feature`, `bugfix`, …) and a
slug from the description. On a platform-assigned `claude/*` branch, follow `core.md`'s rule for
those branches. It branches from the latest `origin/main`; if a long clarify step or build
follows, sync again per "Concurrent development" before step 4.

### 3. Build

- **Plan the split first.** List the slices of the change (e.g. data layer, API, UI, tests)
  and the files each owns. If they're disjoint and each stands alone, hand each to its own
  subagent (`sonnet`, or `haiku` for mechanical ones), launched together in one message. Define
  shared interfaces (types, function signatures) in the main thread *before* fanning out, so
  slices agree. If slices overlap or the change is small, build inline.
- Implement the change following the repo's existing patterns. Put logic in pure, testable
  functions where the codebase does. Add or update tests for the new behavior.
- When the subagents return, review the combined diff for seams and duplicated helpers, then
  run the repo's checks (format, lint, typecheck, test) in the main thread and fix failures
  before moving on.

### 4. Open the PR

Sync with `origin/main` first (see "Concurrent development"), then run `/sdlc:create-pr`. It updates docs, re-runs checks, pushes, and opens the PR. Note the PR
number.

### 5. Review the PR

Pick the reviewer by what the diff touches, using the same design-risk list as in "Cost and
parallelism":

- **No risk triggers:** run the `code-review` skill against the PR at the chosen level with
  `--comment`, so findings land as inline PR comments (e.g. `/code-review medium <PR#> --comment`).
- **Any risk trigger:** spawn a `general-purpose` subagent with `model: opus` to review the diff
  itself — read the PR diff and the surrounding code, look for correctness bugs, missed edge
  cases, and duplication, and return findings with file, line and rationale. Post each one as an
  inline PR comment from the main thread. The `code-review` skill takes an effort level, not a
  model, so wrapping it would not guarantee Opus does the reading.
- **Security-related diff** (auth, secrets, permissions, input handling): in addition, have that
  Opus subagent run `security-review` and post its findings the same way.

The reviewer should be a different model run than the one that wrote the code; never have a
slice's own subagent review its own work.

If `code-review` isn't available in this environment, review the diff yourself (or via the Opus
subagent above) and post each finding as an inline review comment with a GitHub MCP tool or `gh`.

### 6. Fix and answer

Read every review thread on the PR, including any from humans or bots that arrived meanwhile.
Sort the findings:

- **Fix:** anything that produces wrong output, loses data, or is a security issue; and
  anything small and safe to change (a filter, a sort key, a weak test, an extracted helper).
- **Answer instead:** a finding that's pre-existing across the codebase, needs a design
  decision, or is out of proportion to this PR. Reply on its thread with what you traced and
  why it's deferred; if it's worth doing later, say so in the PR description as a follow-up.

Then:

1. Make the fixes, with a test for each behavioral one. Independent fixes in different files
   can go to parallel subagents (`haiku` for the simple ones, `sonnet` otherwise); fixes to
   behavior with design risk stay in the main thread. Re-run the repo's checks.
2. Commit and push (a new commit — never amend or force-push).
3. Reply on **every** thread: "Fixed in `<sha>`: …" or the reason it's not changed.
4. Resolve the threads you fixed. Leave answered-but-unfixed threads open for the user.
5. If the fixes changed the PR's scope or behavior, update the PR description.

Do one review round. Run a second only if the fixes were large (new functions, changed
interfaces); stop when a round finds nothing new.

### 7. Wait for CI

Prefer an event over polling: if `subscribe_pr_activity` is available, subscribe and end the
turn; you'll be woken by CI results. Otherwise poll `gh pr checks <PR#>` at a sensible interval.

**If the PR goes `behind` or `dirty`** (a merge landed on `main`, or two PRs now conflict),
sync and resolve per "Concurrent development", push, and wait again; CI restarts on the new head.

**If CI fails:** find the root cause, fix it, push, and wait again. Re-run a job at most once.
Never skip, disable, or weaken a test to get green, and never push an empty commit to retrigger
CI. If you can't fix it after a real attempt, stop and report the failure with its log excerpt.

### 8. Merge

Sync with `origin/main` one last time. If that brings in anything, push and go back to step 7 —
the checks that matter are the ones on the head you're about to merge. Then merge only when
**all** of these hold on the current head SHA:

- every check is `success` (none pending, none failed),
- the PR is mergeable with no conflict (`mergeable_state` clean),
- every review thread has a reply, and no new comments arrived since you last read them.

Merge with a squash and delete the branch (`gh pr merge <PR#> --squash --delete-branch`), per
`core.md`'s merge rule, and pass the expected head SHA (`--match-head-commit`) so a late push
can't slip in. Squash is the standard regardless of how earlier PRs in the repo were merged. If
the repo rejects it because squash merging is disabled, run `configure-github-repo.sh --check`
(or `gh api repos/{owner}/{repo}`) and report which setting is wrong; don't fall back to a merge
commit. Before merging, make sure the PR title and description read well as a commit message on
`main`, because that's what the squash records. With `--no-merge`, skip this and
report the PR as ready.

### 9. Clean up and report

Unsubscribe from PR activity and cancel any scheduled check-ins. Remove this run's local branch
(`git branch -D <branch>`, since a squashed branch never counts as merged) and its worktree if it
had one, then `git fetch --prune`. Report to the user:

- what shipped (one or two sentences, user-facing),
- the merge commit or the PR link,
- review findings fixed vs. answered, with the deferred ones named,
- anything not verified (e.g. not checked in a browser).

## Stop and ask instead of continuing when

- the working tree has uncommitted changes you didn't make,
- a check fails and the cause isn't in this PR's diff,
- a human reviewer requests changes you'd have to guess at,
- a conflict's resolution depends on intent you can't determine from either side's commits,
- `main` keeps moving so fast that syncing re-triggers CI three times without a merge,
- the merge would need permissions or a bypass the session doesn't have.
