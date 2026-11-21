---
name: ship
description: Take a feature description from idea to merged PR — branch, build, open the PR, run a code review on it, fix what matters, answer every comment, and merge once CI is green.
when_to_use: Only when the user types /sdlc:ship. Because it merges by default, it never starts on its own from a feature description.
disable-model-invocation: true
argument-hint: [--no-merge] [--review low|medium|high] <feature description>
allowed-tools: Bash(git *) Bash(gh pr *) Bash(gh run *) Bash(command -v gh) Bash(node *) Bash(npx *) Bash(npm run *) Bash(npm ci *) Bash(pnpm *) Bash(cat *)
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

## Arguments

- `--no-merge` — stop at a green, reviewed PR and report; don't merge.
- `--review <level>` — effort passed to the code review (default `medium`). Never `max` unless
  the user asked for it by name.
- Everything else is the feature description. If it's empty, ask for one.

## Steps

### 1. Understand the feature

Read the project's docs map (README) and the code the feature touches before deciding anything.

**Clarify only when the description leaves a real choice open** — one that changes what you
build and that the code can't settle (e.g. "my time" vs. the whole team's; which page it goes
on). Ask 1–3 questions in a single AskUserQuestion call, each with a recommended option first,
then proceed. Don't ask about things with an obvious default; pick it and mention it in the PR.

### 2. Branch

Run `/sdlc:new-branch` inline with the type that fits the work (`feature`, `bugfix`, …) and a
slug from the description. On a platform-assigned `claude/*` branch, follow `core.md`'s rule for
those branches.

### 3. Build

- Implement the change following the repo's existing patterns. Put logic in pure, testable
  functions where the codebase does.
- Add or update tests for the new behavior.
- Run the repo's checks (format, lint, typecheck, test) and fix failures before moving on.

### 4. Open the PR

Run `/sdlc:create-pr`. It updates docs, re-runs checks, pushes, and opens the PR. Note the PR
number.

### 5. Review the PR

Run the `code-review` skill against the PR at the chosen level with `--comment`, so findings
land as inline PR comments (e.g. `/code-review medium <PR#> --comment`).

If `code-review` isn't available in this environment, review the diff yourself for correctness
bugs, missed edge cases, and duplication, and post each finding as an inline review comment
with a GitHub MCP tool or `gh`.

### 6. Fix and answer

Read every review thread on the PR, including any from humans or bots that arrived meanwhile.
Sort the findings:

- **Fix:** anything that produces wrong output, loses data, or is a security issue; and
  anything small and safe to change (a filter, a sort key, a weak test, an extracted helper).
- **Answer instead:** a finding that's pre-existing across the codebase, needs a design
  decision, or is out of proportion to this PR. Reply on its thread with what you traced and
  why it's deferred; if it's worth doing later, say so in the PR description as a follow-up.

Then:

1. Make the fixes, with a test for each behavioral one. Re-run the repo's checks.
2. Commit and push (a new commit — never amend or force-push).
3. Reply on **every** thread: "Fixed in `<sha>`: …" or the reason it's not changed.
4. Resolve the threads you fixed. Leave answered-but-unfixed threads open for the user.
5. If the fixes changed the PR's scope or behavior, update the PR description.

Do one review round. Run a second only if the fixes were large (new functions, changed
interfaces); stop when a round finds nothing new.

### 7. Wait for CI

Prefer an event over polling: if `subscribe_pr_activity` is available, subscribe and end the
turn; you'll be woken by CI results. Otherwise poll `gh pr checks <PR#>` at a sensible interval.

**If CI fails:** find the root cause, fix it, push, and wait again. Re-run a job at most once.
Never skip, disable, or weaken a test to get green, and never push an empty commit to retrigger
CI. If you can't fix it after a real attempt, stop and report the failure with its log excerpt.

### 8. Merge

Merge only when **all** of these hold on the current head SHA:

- every check is `success` (none pending, none failed),
- the PR is mergeable with no conflict (`mergeable_state` clean),
- every review thread has a reply, and no new comments arrived since you last read them.

Use the repo's usual merge method (look at recent merges on `main`; default to a merge commit)
and pass the expected head SHA so a late push can't slip in. With `--no-merge`, skip this and
report the PR as ready.

### 9. Clean up and report

Unsubscribe from PR activity and cancel any scheduled check-ins. Report to the user:

- what shipped (one or two sentences, user-facing),
- the merge commit or the PR link,
- review findings fixed vs. answered, with the deferred ones named,
- anything not verified (e.g. not checked in a browser).

## Stop and ask instead of continuing when

- the working tree has uncommitted changes you didn't make,
- a check fails and the cause isn't in this PR's diff,
- a human reviewer requests changes you'd have to guess at,
- the merge would need permissions or a bypass the session doesn't have.
