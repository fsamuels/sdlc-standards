# Upgrading an existing project to v0.4.0

For a project that already adopted the `sdlc` plugin (has `extraKnownMarketplaces` +
`enabledPlugins` in its own `.claude/settings.json`) and wants the fixes in
[`CHANGELOG.md`](../CHANGELOG.md)'s 0.4.0 entry: the auto-install self-heal, the
`PreToolUse` docs-before-PR enforcement, and `create-pr`'s `gh`/MCP detection.

The last two ship automatically once the marketplace re-syncs — nothing to change in the
consuming project for those. The self-heal hook is opt-in per project, since it has to live
in the consuming project's own settings rather than inside the plugin (see
[`docs/packaging.md`](packaging.md#known-gap-intermittent-auto-install-failure) for why).

## Self-contained prompt

Hand this to a fresh Claude Code session working in the consuming project (a session that
did **not** just do the work below — the point of the second step is to confirm it works
from a session that had no part in setting it up):

> This project consumes the `sdlc` plugin from `fsamuels/sdlc-standards`
> (`extraKnownMarketplaces`/`enabledPlugins` in `.claude/settings.json`). A new plugin
> version (0.4.0) adds a mitigation for an intermittent auto-install failure. Do the
> following:
>
> 1. Refresh the marketplace and confirm the plugin is on 0.4.0 or later:
>    `claude plugin marketplace update sdlc-standards` (or `claude plugin marketplace add
>    fsamuels/sdlc-standards` if it isn't configured at all), then `claude plugin list` to
>    confirm `sdlc@sdlc-standards` is installed.
> 2. Fetch
>    [`plugins/sdlc/scripts/ensure-installed.sh`](https://github.com/fsamuels/sdlc-standards/blob/main/plugins/sdlc/scripts/ensure-installed.sh)
>    from `fsamuels/sdlc-standards` and vendor a copy into this project as
>    `scripts/ensure-sdlc-plugin.sh` (create the `scripts/` directory if it doesn't exist).
>    Make it executable.
> 3. Add a `SessionStart` hook to this project's own `.claude/settings.json` that runs it —
>    see the exact JSON in
>    [`docs/packaging.md`](https://github.com/fsamuels/sdlc-standards/blob/main/docs/packaging.md#known-gap-intermittent-auto-install-failure)
>    in that repo. Merge it with any `SessionStart` hooks already present rather than
>    replacing them.
> 4. Commit these changes (this project's own branch-naming and docs-before-PR conventions
>    apply, per the standard already in effect).
> 5. Tell me what you changed and stop — **do not** try to verify the hook fired in this
>    same session. It only matters on the *next* fresh session, which I'll check myself.
>
> Do not modify anything under `plugins/` in `fsamuels/sdlc-standards` itself — that repo is
> the standard, this project only consumes it.

## Verifying it landed, in a separate fresh session

Start a **new** Claude Code session on the project (not the one that made the change
above) and confirm, in order:

1. **The plugin loads.** Ask it to run `/sdlc:create-pr` with no other context — it should
   recognize the skill (even if it then reports there's nothing to do, e.g. you're on
   `main` with a clean tree). If the skill isn't found, the self-heal hook didn't fire or
   the marketplace still isn't syncing; check the hook's stderr output at session start.
2. **`/create-pr` is invocable by name**, not just present — say "create a PR for this"
   without the literal slash command and confirm the skill triggers (`when_to_use` should
   make this fire; if it doesn't, that's a separate regression worth reporting upstream).
3. **The enforcement gate actually blocks a direct call.** On a throwaway branch with an
   uncommitted code-only change (no docs), ask the session to run `gh pr create` directly
   (or, if there's no `gh` CLI, call the GitHub MCP `create_pull_request` tool directly) —
   explicitly telling it to skip `/sdlc:create-pr`. Confirm the call is denied with a
   message pointing at `/sdlc:create-pr`, not silently allowed. Then confirm the same call
   succeeds once either `/sdlc:create-pr` has updated docs in the diff, or the PR body
   states "None needed" under a `## Docs updated` heading.

Report back with a clear pass/fail on all three — a plugin that loads but doesn't actually
gate anything is the same failure mode this release exists to close.
