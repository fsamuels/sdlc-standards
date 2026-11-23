#!/usr/bin/env bash
# Configure (or check) the GitHub repo settings the SDLC standard requires:
# squash-merge only, PR title/body as the squash commit message, and branches
# deleted automatically on merge. Needs `gh` and admin rights on the repo.
#
#   configure-github-repo.sh           apply the settings to the repo in the current directory
#   configure-github-repo.sh --check   read-only; exit 1 and list mismatches
set -euo pipefail

command -v gh >/dev/null || { echo "gh CLI not found" >&2; exit 2; }

want='{"allow_squash_merge":true,"allow_merge_commit":false,"allow_rebase_merge":false,"delete_branch_on_merge":true,"squash_merge_commit_title":"PR_TITLE","squash_merge_commit_message":"PR_BODY"}'

if [ "${1:-}" = "--check" ]; then
  have=$(gh api 'repos/{owner}/{repo}')
  mismatches=$(jq -rn --argjson want "$want" --argjson have "$have" \
    '$want | to_entries[] | select($have[.key] != .value) | "\(.key): is \($have[.key]), want \(.value)"')
  if [ -n "$mismatches" ]; then
    echo "Repo settings differ from the SDLC standard:" >&2
    echo "$mismatches" >&2
    echo "Fix with: configure-github-repo.sh (needs admin)" >&2
    exit 1
  fi
  echo "Repo settings match the SDLC standard."
  exit 0
fi

echo "$want" | gh api -X PATCH 'repos/{owner}/{repo}' --input - --jq '"squash-only, branches auto-deleted: " + (.allow_squash_merge and (.allow_merge_commit|not) and (.allow_rebase_merge|not) and .delete_branch_on_merge | tostring)'
