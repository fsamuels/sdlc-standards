---
name: new-branch
description: Create a new branch off the latest origin/main, named per the sdlc-standards branch lifecycle convention.
when_to_use: The user asks to start new work, mentions a milestone/feature/bugfix by name, or you're about to make changes while sitting on main or a stale/unrelated branch.
argument-hint: [feature|bugfix|docs|milestone|test|chore|refactor] [short description]
allowed-tools: Bash(git *) EnterWorktree
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

2. **Find out where you are.** Compare `git rev-parse --git-dir` with
   `git rev-parse --git-common-dir`: different means a linked worktree, the same means the
   primary checkout. Local sessions never work in the primary checkout (`core.md`, "Local
   sessions: one worktree each"), so:
   - **Primary checkout:** go to step 3 and create a new worktree. The primary checkout's own
     uncommitted changes aren't touched, so there's nothing to stash.
   - **Already in a linked worktree:** run `git status --porcelain`. If it's non-empty, stop and
     tell the user what's uncommitted, and ask whether to proceed anyway, stash, or abort.
     Otherwise switch this worktree to the new branch (step 5, second form).

3. **Fetch the latest main**: `git fetch origin main`.

4. **Build the branch name** per the convention above.

5. **Create the branch off the fetched remote tip**, not the local main.

   From the primary checkout, in a new sibling worktree (the directory is `../<repo>-<slug>`,
   where `<repo>` is the primary checkout's folder name and `<slug>` is the branch name after
   the prefix):

   ```
   git worktree add -b <branch-name> ../<repo>-<slug> origin/main
   ```

   Then work from that directory: use the `EnterWorktree` tool with its path, or use it as the
   working directory (`git -C` or `cd`) for every command, since the shell can reset between
   calls. If you're already in a linked worktree (step 2):

   ```
   git switch -c <branch-name> origin/main
   ```

6. **Confirm to the user**: report the branch name created, the worktree directory, and that
   it's based on the current tip of `origin/main` (include the short SHA from
   `git rev-parse --short origin/main`).
