#!/usr/bin/env bash
# Self-heal for the sdlc plugin failing to auto-install from a project's
# extraKnownMarketplaces + enabledPlugins declaration in .claude/settings.json.
#
# Observed: an intermittent failure mode where a fresh Claude Code Web/remote
# session doesn't sync that declaration — `claude plugin list` shows nothing
# installed and `claude plugin marketplace list` shows no marketplaces
# configured, until installed by hand. A second fresh session on the same
# project can load correctly with no manual step, so this is not
# deterministic and cannot be relied on to fail loudly in testing.
#
# This is a project-level vendored copy, not something the sdlc plugin ships
# a live path to: the whole point is to run *before* the plugin exists on
# disk, so it cannot live inside plugins/sdlc/hooks/hooks.json. Copy this
# file into the consuming project (e.g. scripts/ensure-sdlc-plugin.sh) and
# wire it as a SessionStart hook in that project's own .claude/settings.json
# — see docs/packaging.md in fsamuels/sdlc-standards for the exact hook JSON.
#
# Safe to run every session: each step is a no-op if already satisfied.
set -euo pipefail

PLUGIN_ID="sdlc@sdlc-standards"
MARKETPLACE_NAME="sdlc-standards"
MARKETPLACE_REPO="fsamuels/sdlc-standards"

if ! command -v claude >/dev/null 2>&1; then
  # No CLI on PATH in this environment; nothing this script can do.
  exit 0
fi

if claude plugin list 2>/dev/null | grep -qF "$PLUGIN_ID"; then
  exit 0
fi

echo "sdlc-standards: $PLUGIN_ID missing from 'claude plugin list' at session start — self-healing" >&2

if ! claude plugin marketplace list 2>/dev/null | grep -qF "$MARKETPLACE_NAME"; then
  claude plugin marketplace add "$MARKETPLACE_REPO" >&2 || {
    echo "sdlc-standards: failed to add marketplace $MARKETPLACE_REPO — leaving plugin uninstalled" >&2
    exit 0
  }
fi

claude plugin install "$PLUGIN_ID" >&2 || {
  echo "sdlc-standards: failed to install $PLUGIN_ID — leaving plugin uninstalled" >&2
  exit 0
}

echo "sdlc-standards: installed $PLUGIN_ID" >&2
