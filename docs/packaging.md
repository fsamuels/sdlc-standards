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
        │   └── hooks.json    # SessionStart: injects standards/*.md
        ├── standards/        # layer 1 — principles prose, one file per topic
        └── skills/           # layer 2 — executable, stack-specific
```

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
