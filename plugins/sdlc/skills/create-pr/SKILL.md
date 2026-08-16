---
name: create-pr
description: Bring project docs up to date with the current branch's changes per the docs-before-PR gate, run repo checks, then push and open a PR against main.
argument-hint: [optional extra context for the PR description]
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(gh pr create *) Bash(gh pr view *) Bash(node *) Bash(npx *) Bash(npm run *) Bash(npm ci *) Bash(pnpm *) Bash(cat *)
---

# Create PR

Prepare the current branch for review against the docs-before-PR gate in
[`standards/documentation.md`](../../standards/documentation.md): bring documentation up to
date, run checks, then push and open a PR. The goal is that once this PR merges, the project's
docs are **already accurate** — no separate doc-catchup pass needed later.

## Steps

1. **Sanity check.** Confirm the current branch isn't `main` (`git branch --show-current`); if
   it is, stop and tell the user to run `/sdlc:new-branch` first.

2. **Fetch and diff against main:**

   ```
   git fetch origin main
   git log origin/main..HEAD --oneline
   git diff origin/main...HEAD --stat
   git diff origin/main...HEAD
   ```

   Read the actual diff, not just the file list — doc updates need to reflect what really
   changed.

3. **Find the project's documentation map.** `documentation.md` requires every project on this
   standard to carry a table of its docs in the README. Read that table rather than assuming
   filenames — it varies project to project (some call the shipped-state doc `STATUS.md`,
   others `current-status.md` or `docs/project/current-state.md`; some have a `MILESTONES.md`,
   others a `ROADMAP.md` or neither). If the README has no such table, ask the user which docs
   exist before proceeding rather than guessing.

4. **Update documentation to match the changes.** For each doc in the map, check whether this
   diff plausibly affects it and edit only what's actually stale:
   - The doc that tracks current build state ("what shipped") should almost always be
     reviewed — it's the one the gate calls out by name in `documentation.md`.
   - A decisions/decision-log doc gets a new entry only if a genuinely non-obvious choice was
     made during implementation (not for routine/expected work). Follow the ID scheme and
     reversibility column described in `documentation.md` if the project has adopted it;
     otherwise match the doc's existing entry format.
   - Anything describing schema, architecture, or how pieces fit together gets updated if this
     change touched that.
   - The README itself if a command, script, or setup step changed, or if a new document was
     added (which must also be added to the map — an untracked doc is an incomplete change per
     `documentation.md`).
   - Don't pad these with restating the diff — only change what's now inaccurate or missing.

5. **Run the link checker, if the project has one.** `documentation.md` requires a link checker
   in CI for any project whose docs cross-reference each other (commonly
   `scripts/check-links.mjs`, wired into a `docs.yml` or similar workflow). If present, run it
   locally now — a doc update that breaks a link is not ready to open.

6. **Run repo checks**, adapting to whatever's actually configured (the project may still be
   pre-scaffold with no `package.json` — skip gracefully and note that in the summary rather
   than failing):
   - If `package.json` exists: check its `scripts` for `format`/`format:fix` and run it;
     otherwise if `prettier` is a dependency, run it directly with `--write .`.
   - Run `lint`, `typecheck`, and `build` scripts if present.
   - **If any check fails, stop.** Report the failure to the user and do not push or open a PR
     with a broken build.

7. **Commit.** Stage the doc updates and any files the formatter/linter auto-fixed, and create a
   new commit (never amend). Use a HEREDOC commit message describing what was brought up to
   date, per standard commit conventions.

8. **Push:** `git push -u origin HEAD`.

9. **Open the PR:**

   ```
   gh pr create --base main --title "<title>" --body "$(cat <<'EOF'
   ## Summary
   <bullets>

   ## Docs updated
   <list files touched in step 4, or "None needed">

   ## Checks
   <list what ran and passed, or "Skipped — no package.json yet">
   EOF
   )"
   ```

   Derive the title from the branch name/commits. Fold in any extra context from `$ARGUMENTS`
   if provided.

10. **Report the PR URL** back to the user.
