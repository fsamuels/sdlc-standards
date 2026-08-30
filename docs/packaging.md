# Packaging: why one plugin, and how to split it later

## Current shape

`sdlc-standards` is a Claude Code plugin marketplace hosting a single plugin, `sdlc`.

```
sdlc-standards/
├── .claude-plugin/
│   └── marketplace.json      # catalog: lists the plugins in this repo
└── plugins/
    └── sdlc/
        ├── .claude-plugin/
        │   └── plugin.json   # the plugin's own manifest
        ├── hooks/
        │   ├── hooks.json                # SessionStart + PreToolUse wiring
        │   └── check-docs-before-pr.mjs  # PreToolUse: blocks direct PR
        │                                 # creation when the diff skips the gate
        ├── scripts/
        │   └── ensure-installed.sh  # vendorable self-heal, see below
        ├── standards/        # layer 1 — principles prose
        └── skills/           # layer 2 — executable, stack-specific
```

The `SessionStart` hook globs `standards/*.md` rather than naming files, so a new topic
file ships by being added to the directory — there is no second place to remember to
edit. Files are concatenated in filename order; each carries its own `#` heading, so
order is presentation only. Keep each file single-topic and small, for the same reason
the standard asks projects to: focused context is what an AI assistant reads well.

The `PreToolUse` hook is a third thing again — not prose, not a skill, but a **backstop**.
`create-pr` is how a session is meant to satisfy the docs-before-PR gate, but a skill is
advisory: nothing stops a session from calling a PR-creation tool directly instead of
routing through it, which is exactly what happened in carpooled on 2026-08-21 (twice, in
the same session, on the same PR). The hook doesn't care which path was taken — it checks
the outcome, whether the diff going into the PR touches `docs/` or `README.md`, and blocks
the call if not. See [Enforcement](#enforcement-the-pretooluse-docs-before-pr-gate) below
for exactly what it covers and how to loosen it. Fails open whenever it can't be sure (no
`docs/` directory, not a git repo, no determinable base branch) — a false block teaches a
session to route around the hook, which is worse than an occasional miss.

`skills/` ships `new-branch` and `create-pr`, generalized from a real adopter's local
implementation (see the sdlc-standards README's audit 3) rather than designed from scratch.
`create-pr` detects whether `gh` is on `PATH` and falls back to a GitHub MCP tool
(`mcp__github__create_pull_request`) when it isn't — some Claude Code environments (the
web, other remote sessions) have no `gh` CLI at all.

A consuming project opts in with two keys in `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "sdlc-standards": {
      "source": { "source": "github", "repo": "fsamuels/sdlc-standards" }
    }
  },
  "enabledPlugins": { "sdlc@sdlc-standards": true }
}
```

Nothing is copied into the project. Skills resolve as `/sdlc:<name>`, and the
standards prose arrives via the `SessionStart` hook.

**One plugin is the right call while there is one stack and one author.** Every
consuming project wants all of it, so splitting would add manifests and version
numbers to maintain without giving anyone a choice they'd actually exercise.

## Known gap: intermittent auto-install failure

Observed in carpooled on a fresh Claude Code Web / remote session: the project's
`.claude/settings.json` declared `extraKnownMarketplaces` + `enabledPlugins` correctly, but
neither synced — `claude plugin list` showed nothing installed and `claude plugin
marketplace list` showed no marketplaces configured, until installed by hand:

```bash
claude plugin marketplace add fsamuels/sdlc-standards
claude plugin install sdlc@sdlc-standards
```

A second fresh session on the same project, same settings, loaded correctly with no manual
step. **This is intermittent, not deterministic** — it will pass a one-off test and then
fail in the field, which is worse than a failure that's always reproducible. Root cause not
found yet; treat this as a durable mitigation, not a fix.

**Mitigation: a self-healing `SessionStart` hook in the consuming project.** This has to
live in the *consuming project's own* `.claude/settings.json`, not in this plugin's
`hooks/hooks.json` — the whole failure mode is that the plugin isn't installed yet, so a
hook shipped inside it can't run early enough to fix it. Vendor a copy of
[`plugins/sdlc/scripts/ensure-installed.sh`](../plugins/sdlc/scripts/ensure-installed.sh)
into the consuming project (e.g. as `scripts/ensure-sdlc-plugin.sh`) rather than hand-rolling
one — the same reasoning as vendoring `check-links.mjs` in `standards/documentation.md`:
it's ~40 dependency-free lines, and a shared package would be overkill for something that
has to run before any plugin is available to provide it.

Wire it into the consuming project's `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${CLAUDE_PROJECT_DIR}\"/scripts/ensure-sdlc-plugin.sh"
          }
        ]
      }
    ]
  }
}
```

The script is a no-op (exits immediately, no output) when the plugin is already installed,
so it's safe to run on every session start. When it isn't, it adds the marketplace and
installs the plugin, logging what it did to stderr. See
[`docs/upgrading.md`](upgrading.md) for the full self-contained prompt to add this to an
existing project.

## Enforcement: the PreToolUse docs-before-PR gate

[`plugins/sdlc/hooks/check-docs-before-pr.mjs`](../plugins/sdlc/hooks/check-docs-before-pr.mjs),
wired into `hooks.json` under two `PreToolUse` matchers, blocks a session from opening a PR
by a path that skips `/sdlc:create-pr` entirely:

- **`matcher: "Bash"`** — inspects the command; only acts when it matches `gh pr create`.
- **`matcher: "mcp__.*create_pull_request.*"`** — catches the MCP-only path (no `gh` CLI),
  e.g. `mcp__github__create_pull_request`.

**What it actually checks is the diff, not which path was used.** If the diff going into
the PR touches nothing under `docs/` or the root `README.md`, and the PR body/description
carries no `## Docs updated` heading containing "None needed", the call is denied with a
`hookSpecificOutput: { permissionDecision: "deny", permissionDecisionReason: "…" }` pointing
at `/sdlc:create-pr`. This is why it doesn't block `create-pr`'s own final step: by the time
that step runs, the diff already contains whatever doc updates the skill's earlier steps
made (or the skill's own PR body already states "None needed").

**Fails open, always,** when it can't be sure: no `docs/` directory in the repo (standard
not structurally adopted there), not a git repo, no determinable base branch (`origin/main`
or `origin/master`), or nothing in the diff yet. A project without `docs/` is entirely
unaffected by this hook.

**If it's ever too aggressive for a project's workflow** — a legitimate PR pattern this
gate keeps catching by mistake — the fix belongs in the script's fail-open conditions or the
override phrase convention, not in disabling the hook per project. Open the disagreement
here (see [the standard's own guidance on this](../README.md#applying-this-to-a-project))
rather than carrying a local override; a hook that a project routes around silently is worse
than one that's occasionally wrong in a visible, fixable way.

## When to split, and how

The marketplace catalog can list several plugins from this same repo — each entry
just points at a different `./plugins/<name>` directory. Splitting is a change to
`marketplace.json` plus moving directories; it does not require a new repo.

The cost is real and worth naming up front: each additional plugin is its own
manifest, its own `version` field to bump, and one more line in every consuming
project's `enabledPlugins`. A rename of a plugin breaks the `enabledPlugins` key
in every project that references it.

### Option A — split by layer

`sdlc-standards` (prose + hook) and `sdlc-workflow` (skills + enforcement hooks).

Split here when a project wants the principles without the tooling — most likely
when a repo is on a stack the skills don't understand, so `/sdlc:create-pr`'s
lint/typecheck/build assumptions don't hold, but the branch and documentation
rules still should. This is the two-layer model expressed as packaging.

### Option B — split by stack profile

`sdlc-core` plus per-stack profiles: `sdlc-ts-supabase`, `sdlc-python`, and so on.

Split here when a second stack arrives and the concrete commands diverge — the
moment a skill needs `if TypeScript … else …` branching inside it is the signal.
Until then a profile plugin would have exactly one member and no siblings to be
chosen against.

### Option C — split by audience

A public plugin and a private one, if any part of the standard ever becomes
client- or employer-specific.

Note that private marketplace repos require git credential setup on every machine
and in CI, which the current public repo avoids entirely. Don't take this on
without a concrete reason.

## Deciding

Prefer one plugin until a split resolves a problem you've actually hit. The
trigger for each option above is written as an observable event, not a
prediction — wait for the event.
