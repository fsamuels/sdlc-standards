# Consumers

Every project known to have adopted this standard, so a breaking change here has a known
blast radius instead of surfacing only when a project owner happens to notice a new release.

| Project | Adopted | Layers taken | Notes |
| ------- | ------- | ------------- | ----- |
| [packagedeallabs-ship-it/carpooled](https://github.com/packagedeallabs-ship-it/carpooled) | 2026-08-12 | standards + skills | The repo this standard was extracted from; full adopter. Reported the auto-install and PR-gate-bypass gaps fixed in v0.4.0. |
| [fsamuels/durak-tracker](https://github.com/fsamuels/durak-tracker) | 2026-08-11 | `standards/core.md` only (branch lifecycle) | Narrower adopter by design — no `documentation.md`, no skills. |
| [fsamuels/chore-corral](https://github.com/fsamuels/chore-corral) | 2026-08-16 | standards + skills | Source of the executable skills layer (`new-branch`/`create-pr`), promoted from its own local implementation rather than designed from scratch. |
| [fsamuels/aerial-measurement-tool](https://github.com/fsamuels/aerial-measurement-tool) | 2026-08-30 | standards + skills | Missed on this table until the 2026-09-02 audit. |
| [fsamuels/timelapse-creator](https://github.com/fsamuels/timelapse-creator) | 2026-08-17 | standards + skills | Missed on this table until the 2026-09-02 audit; has its own `ci/`/`perf/` branch-prefix extensions and a local `.github/pull_request_template.md`. |
| [fsamuels/electric-fence-monitor](https://github.com/fsamuels/electric-fence-monitor) | 2026-09-02 | standards + skills | Previously had a local, undocumented branch convention (`bug/`, no milestone/test/refactor). Migrated to the standard's prefixes; kept `hardware/` as a local extension for schematic/PCB work. |
| [fsamuels/boglehead-analyzer](https://github.com/fsamuels/boglehead-analyzer) | 2026-09-02 | `standards/core.md` only (branch lifecycle) | Narrower adopter by design, matching durak-tracker — no `documentation.md`, no skills, no PR template. |

## Keeping this current

Add a row here when a project adopts — wiring `extraKnownMarketplaces` + `enabledPlugins` in
its own `.claude/settings.json` — before or alongside opening the adoption commit/PR. This
file exists only to know who to notify on a breaking change; don't let it drift into a status
report (that belongs in each project's own docs, and in this repo's [README](README.md) audit
log for what the adoption *proved*).

When shipping a change here that could affect existing adopters (a new enforcement hook, a
renamed skill, a changed default), check this list and consider a heads-up to each project
before or alongside the release — see [`docs/upgrading.md`](docs/upgrading.md) for the
self-contained prompt to hand each one.
