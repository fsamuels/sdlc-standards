# Pull Requests

Every pull request uses the template below. It is authoritative project
configuration, not a suggestion.

The template asks for **evidence, not affirmation**. Most PRs here are opened by
an AI assistant, and an assistant asked to confirm something will confirm it —
so a checkbox reading "tests pass" carries no information once a model is
filling in the body. Every section below instead asks for something that cannot
be produced without doing the work: a pasted command and its output, a link to
the commit that changed the docs, a named spec section.

## The template

```markdown
## What changed

<!-- Two or three sentences, in plain language. What does this PR make
     the software do that it did not do before? Not a list of files. -->

## Why

<!-- Link the driver: a spec section, milestone, or issue. If this PR is
     part of a module build-out, name the module and where it sits in the
     sequence. If there is no written driver, say so and explain the
     motivation here. -->

## Verification

<!-- Evidence that this works. Paste the commands actually run and their
     real output — test runs, a manual reproduction of the fixed bug,
     before/after numbers. "Tested locally" is not verification.

     If something could not be verified, say what and why. That is a
     legitimate answer; a fabricated one is not. -->

## Documentation

<!-- Documentation ships in the same PR as the change it describes.
     Link the doc files updated here. If this change genuinely needed no
     documentation, state why — an unexplained "n/a" does not clear the
     gate. -->

## Notes for review

<!-- Optional. Anything you want looked at closely: a decision you were
     unsure about, an approach you rejected, a follow-up deliberately
     left out of scope. Delete this section if empty. -->
```

## How the sections are used

**What changed** is written for a reader who has not seen the diff. A restated
list of touched files fails this section — the diff already says that.

**Why** connects the PR to the spec-first and module-by-module rules. Under
those rules a PR that cannot name its driver is usually a sign that work started
before the spec did.

**Verification** is the section that carries the weight, and the one most likely
to be filled with a comfortable summary instead of a fact. Paste real output. An
honest "not verified, because X" is more useful than a confident claim that the
reviewer then has to go and check.

**Documentation** is the docs-before-PR gate made checkable. The gate is not
"documentation exists somewhere" — it is that the documentation for this change
lands in this PR. A follow-up doc PR is the failure mode the rule exists to
prevent.

## Title and branch

The PR title is a single line in the imperative mood, describing the change:
`Add module scaffold`, not `Added module scaffold` or `module scaffold`.

The PR carries no "type" or "kind" field. The branch prefix already names the
kind of change, and GitHub shows the branch on every PR — repeating it in the
body creates a second place to be wrong. See `core.md` for the prefix table.

## Reserved sections

These sections are deliberately **not** in the template yet, because the
standards behind them are not written. Each one is listed in the "What's not
defined yet" section of the repo README, and each will be added here as the
corresponding standard lands — the heading text is fixed now so the shape is
visible and PRs do not have to be re-cut later.

| Heading             | Blocked on                                            |
| ------------------- | ----------------------------------------------------- |
| `## Testing`        | Testing requirements before merge — what must be tested vs. what may be skipped, and any coverage threshold. Until defined, test evidence goes under **Verification**. |
| `## Commits`        | Commit message conventions. Until defined, no commit-log expectation is enforced at PR time. |
| `## Risk`           | Definition of "done" and release practices — rollback story, migration steps, anything needing a deploy order. |

Adding a section here is a change to this file only. It propagates to every
project on the next session, with no per-project edit.

## Where this template comes from

This file is the single source of the template. It arrives in a session through
the plugin's `SessionStart` hook, so an assistant opening a PR has it in context
without the project needing a local copy.

Consuming projects should **not** commit a `.github/pull_request_template.md`.
A local copy is a fork of the standard that will drift, and it silently
overrides anything defined here.

The tradeoff is deliberate and worth knowing: GitHub's own "Compare & pull
request" form reads only repo-local template files, so a PR opened by hand in
the browser starts with an empty body. Fill it against this template, or open
the PR through the assistant. See `docs/pr-template.md` in the standards repo
for the alternatives that were considered and what would justify revisiting
this.
