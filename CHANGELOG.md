# Changelog

All notable changes to the `sdlc` plugin are recorded here. Versions refer to
[`plugins/sdlc/.claude-plugin/plugin.json`](plugins/sdlc/.claude-plugin/plugin.json).

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
