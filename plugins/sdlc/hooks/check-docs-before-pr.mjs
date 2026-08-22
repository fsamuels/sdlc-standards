#!/usr/bin/env node
/**
 * PreToolUse backstop for the docs-before-PR gate (`standards/documentation.md`).
 *
 * The `create-pr` skill is *how* a session is meant to satisfy the gate — it
 * reads the diff, updates the project's documentation map, then runs
 * `gh pr create` as its last step. But a skill is advisory: nothing stops a
 * session from skipping straight to a raw `gh pr create` Bash call, which is
 * exactly what happened twice in carpooled on 2026-08-21 (PRs #89 and #90 —
 * the second one exists only to backfill what this hook would have caught).
 *
 * This does not check *how* the PR was assembled, only the outcome: does the
 * diff going into `gh pr create` touch anything under `docs/` (or the root
 * `README.md`)? If not, and the PR body carries no explicit "None needed"
 * under a "Docs updated" section — the same escape hatch `create-pr`'s own PR
 * template already uses — the tool call is blocked before it runs.
 *
 * Fails open, deliberately, in every case where it can't be sure:
 * no `docs/` directory (standard not structurally adopted here), not a git
 * repo, no determinable base branch, nothing to diff. A false block is worse
 * than a missed one — it trains a session to route around the hook instead
 * of trusting it.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GH_PR_CREATE = /\bgh\s+pr\s+create\b/;
const DOCS_UPDATED_NONE_NEEDED = /docs updated[\s\S]{0,300}?none needed/i;

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

function main() {
  const input = readStdin();
  if (!input) return allow();

  const command = input.tool_input?.command ?? "";
  if (input.tool_name !== "Bash" || !GH_PR_CREATE.test(command)) return allow();

  const cwd = input.cwd ?? process.cwd();
  const repoRoot = git(["rev-parse", "--show-toplevel"], cwd);
  if (!repoRoot) return allow(); // not a git repo — nothing to enforce

  if (!existsSync(join(repoRoot, "docs"))) return allow(); // standard not structurally adopted

  let base = null;
  for (const candidate of ["origin/main", "origin/master"]) {
    if (git(["merge-base", "HEAD", candidate], repoRoot) !== null) {
      base = candidate;
      break;
    }
  }
  if (!base) return allow(); // can't determine what this PR is against

  const mergeBase = git(["merge-base", "HEAD", base], repoRoot);
  const diffOutput = git(["diff", "--name-only", mergeBase, "HEAD"], repoRoot);
  if (diffOutput === null) return allow();

  const changed = diffOutput.split("\n").filter(Boolean);
  if (changed.length === 0) return allow(); // nothing to check — gh will refuse this anyway

  const docsTouched = changed.some(
    (f) => f.startsWith("docs/") || /^readme\.md$/i.test(f),
  );
  if (docsTouched) return allow();

  if (DOCS_UPDATED_NONE_NEEDED.test(command)) return allow();

  block(changed);
}

function allow() {
  process.exit(0);
}

function block(changed) {
  process.stderr.write(
    [
      "docs-before-PR gate: this diff touches no file under docs/ or README.md.",
      "",
      `Changed files (${changed.length}): ${changed.slice(0, 10).join(", ")}${changed.length > 10 ? ", …" : ""}`,
      "",
      "standards/documentation.md requires documentation to be updated in the same",
      "change that adds the functionality — see the 'Docs-before-PR' checklist. Either:",
      "",
      "  1. Update the docs this change affects (the create-pr skill does this for",
      "     you — invoke it instead of calling `gh pr create` directly), or",
      '  2. If this change genuinely has no doc impact, say so explicitly in the PR',
      '     body under a "## Docs updated" heading containing the words "None needed".',
      "",
      "This blocks the tool call, not the intent — re-run once one of those is true.",
    ].join("\n"),
  );
  process.exit(2);
}

main();
