# PR template: distribution options and why plugin-only

## The problem

A pull request template is shared text that has to reach many repositories. The
question is not what the template says but how it arrives, and GitHub offers no
single mechanism that covers every way a PR gets opened.

There are two distinct paths a PR body can come from, and they do not overlap:

- **The web "Compare & pull request" form** pre-fills the body from a template
  file *in that repository* — `.github/pull_request_template.md`, or the same
  file at the repo root or in `docs/`. It must be on the default branch.
- **The API**, which covers `gh pr create` and every PR opened by an AI
  assistant, sends whatever body the caller supplies. GitHub does not apply a
  template to it. The template only matters here if the caller reads the
  template first and fills it in.

Almost every PR in these projects is opened through the second path.

## Options considered

### Option A — GitHub default community health files

A public repository named `.github` under the account supplies default files to
every repository owned by that account that lacks its own. `PULL_REQUEST_TEMPLATE.md`
is supported, and this works for personal accounts, not only organizations. A
repo-local file overrides the default.

Three constraints shaped the decision:

- The `.github` repository must be **public**. Private `.github` repositories do
  not serve defaults, and issue and PR templates specifically require public.
- It covers only repositories **owned by that account**. Anything contributed to
  an org elsewhere inherits nothing.
- It populates **the web form only** — the path least used here.

It is also a second repository, which puts the PR section of the standard
somewhere other than the standards repo.

### Option B — plugin-delivered (chosen)

The template lives in `plugins/sdlc/standards/pull-requests.md` and is injected
into every session by the `SessionStart` hook, alongside the branch rules. An
assistant opening a PR has the template in context already.

This covers the API path — the one that matters — and matches how the rest of
the standard already travels: nothing is copied into consuming projects, and an
edit here reaches every project on its next session with no version bump and no
per-project change.

Its blind spot is the exact inverse of Option A: a PR opened by hand in the
browser gets an empty body.

### Option C — vendored per repository

Copy `.github/pull_request_template.md` into each project, refreshed by a skill
or a workflow. This is the only option that works in repositories owned by
someone else, and it covers both paths.

It is also duplication, which this repo exists to avoid. Copies drift, and
because a repo-local file overrides everything else, a stale copy silently wins
over the standard.

### Option D — CI enforcement

A reusable workflow in this repo that fails a PR whose body is missing required
sections. This is orthogonal to distribution — it can sit on top of any option
above, and converts the template from a prompt into a gate.

Deferred, not rejected. A required check is worth adding when a PR actually
merges with the gate unmet; adding it first would be a control for a problem not
yet observed.

## Decision

**Option B, plugin-only.** The template reaches the path that opens nearly every
PR, and the standard stays in one file in one repository.

The accepted cost is the empty body on browser-opened PRs. That is a real gap,
and the fallback is manual: fill the body against the template, or open the PR
through the assistant.

## When to revisit

Each trigger below is an observable event, not a prediction. Wait for the event.

- **A browser-opened PR ships with an empty or improvised body.** Add Option A —
  a public `fsamuels/.github` repository whose `PULL_REQUEST_TEMPLATE.md` mirrors
  `plugins/sdlc/standards/pull-requests.md`. Mirroring is duplication, so it
  needs this trigger to justify it, and the copy must be kept in sync by hand or
  by a workflow in this repo.
- **Work starts in a repository owned by someone else**, where neither the
  account-level default nor a project's plugin settings apply. That is the case
  Option C exists for, scoped to that repository alone.
- **A PR merges with the Documentation or Verification section unfilled.** Add
  Option D for that project, and only then.
