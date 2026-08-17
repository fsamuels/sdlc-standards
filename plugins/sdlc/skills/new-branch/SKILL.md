---
name: new-branch
description: Create a new branch off the latest origin/main, named per the sdlc-standards branch lifecycle convention.
when_to_use: The user asks to start new work, mentions a milestone/feature/bugfix by name, or you're about to make changes while sitting on main or a stale/unrelated branch.
argument-hint: [feature|bugfix|docs|milestone|test|chore|refactor] [short description]
allowed-tools: Bash(git *)
---

# New branch

Create a branch off the latest `origin/main`, following the prefix convention in
[`standards/core.md`](../../standards/core.md):

`feature/`, `bugfix/`, `docs/`, `milestone/` (as `milestone/m<N>-<slug>`), `test/`, `chore/`,
`refactor/`. `<slug>` rules: lowercase, spaces/punctuation collapsed to single hyphens, no
leading/trailing hyphens, capped around 50 characters.

## Steps

1. **Parse `$ARGUMENTS`.** The first word, if it matches one of the seven prefixes above, is
   the type; the rest of the string is the description. If the first word isn't one of those,
   treat the whole string as the description and ask the user which type it is via
   AskUserQuestion.
   - If `$ARGUMENTS` is empty, ask the user for both the type and a short description before
     continuing.
   - **If type is `milestone` and no specific milestone number/name was given:** look for a
     milestone-tracking document. Check the project's README for a documentation map (a table
     of docs — `documentation.md` requires every project following this standard to keep one)
     and find the row that plans or tracks milestones (commonly named `MILESTONES.md`,
     `ROADMAP.md`, or similar). If found, read it for the next not-yet-started milestone
     heading and confirm the number/slug with the user before proceeding — don't guess
     silently. If no such document exists or none is obviously in progress, just ask the user
     directly for the milestone number and slug.

2. **Check for uncommitted changes**: run `git status --porcelain`. If it's non-empty, stop and
   tell the user what's uncommitted, and ask whether to proceed anyway, stash, or abort. Don't
   switch branches out from under uncommitted work without confirmation.

3. **Fetch the latest main**: `git fetch origin main`.

4. **Build the branch name** per the convention above.

5. **Create and switch to the branch off the fetched remote tip**, not the local main:

   ```
   git switch -c <branch-name> origin/main
   ```

6. **Confirm to the user**: report the branch name created and that it's based on the current
   tip of `origin/main` (include the short SHA from `git rev-parse --short origin/main`).
