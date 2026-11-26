#!/usr/bin/env node
/**
 * PreToolUse hook: local sessions work in a linked `git worktree`, never in the primary
 * checkout (`standards/core.md`, "Local sessions: one worktree each").
 *
 * Blocks file edits (Edit / Write / NotebookEdit) whose target is inside a repository's
 * primary checkout, and Bash `git` commands that change the working tree or index there
 * (commit, add, switch, checkout, merge, rebase, reset, stash, …). The deny message says how
 * to create a worktree. Read-only git, `git fetch`, `git push`, `git branch`, and
 * `git worktree …` are untouched — creating the worktree has to be possible from the primary
 * checkout.
 *
 * A checkout is "primary" when `git rev-parse --git-dir` equals `--git-common-dir`; a linked
 * worktree's git dir is a subdirectory of the common one.
 *
 * Fails open whenever it can't be sure, like the docs-before-PR hook: not a git repo, a path
 * outside any repo (memory files, scratch dirs), a remote session (`CLAUDE_CODE_REMOTE` —
 * ephemeral clone, nothing to share), a command that `cd`s or uses `git -C` (the real target
 * isn't the session's cwd), or an explicit opt-out via `SDLC_ALLOW_PRIMARY_CHECKOUT=1`.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";

const EDIT_TOOLS = new Set(["Edit", "Write", "NotebookEdit", "MultiEdit"]);
const MUTATING_GIT =
  /(^|[;&|(]\s*|\bthen\s+|\bdo\s+)git\s+(commit|add|rm|mv|switch|checkout|restore|merge|rebase|reset|stash|cherry-pick|revert|pull|apply|am|clean)\b/;
const CD_OR_DASH_C = /(^|[;&|(]\s*)cd\s|\bgit\s+(-C|--git-dir|--work-tree)\b/;

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

function existingDir(path) {
  let dir = dirname(path);
  while (!existsSync(dir)) {
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return dir;
}

/** The primary checkout's root for the repo containing `dir`, or null if `dir` is in a linked worktree / not a repo. */
export function primaryCheckoutRoot(dir) {
  const out = git(["rev-parse", "--show-toplevel", "--git-dir", "--git-common-dir"], dir);
  if (!out) return null;
  const [top, gitDir, common] = out.split("\n");
  if (!top || !gitDir || !common) return null;
  try {
    const same = realpathSync(resolve(dir, gitDir)) === realpathSync(resolve(dir, common));
    return same ? top : null;
  } catch {
    return null;
  }
}

function main() {
  const input = readStdin();
  if (!input) return allow();
  if (process.env.CLAUDE_CODE_REMOTE || process.env.SDLC_ALLOW_PRIMARY_CHECKOUT === "1") return allow();

  const cwd = input.cwd ?? process.cwd();
  let dir = cwd;
  let what;

  if (EDIT_TOOLS.has(input.tool_name)) {
    const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
    if (!target) return allow();
    dir = existingDir(resolve(cwd, target));
    if (!dir) return allow();
    what = `edit ${target}`;
  } else if (input.tool_name === "Bash") {
    const command = input.tool_input?.command ?? "";
    if (!MUTATING_GIT.test(command) || CD_OR_DASH_C.test(command)) return allow();
    what = "run a git command that changes the working tree";
  } else {
    return allow();
  }

  const root = primaryCheckoutRoot(dir);
  if (!root) return allow();
  block(what, root);
}

function allow() {
  process.exit(0);
}

function block(what, root) {
  const repo = root.split("/").pop();
  const reason = [
    `Worktree required: this session tried to ${what} in the primary checkout (${root}).`,
    "standards/core.md requires every local session to work in its own git worktree, so",
    "concurrent agents never share a working tree.",
    "Create one from the latest main and work there:",
    `git fetch origin main && git worktree add -b <prefix>/<slug> ../${repo}-<slug> origin/main`,
    "(then use the EnterWorktree tool, or run commands with that directory as the cwd).",
    "/sdlc:new-branch does this for you. For a genuine one-off in the primary checkout,",
    "the user can set SDLC_ALLOW_PRIMARY_CHECKOUT=1.",
  ].join(" ");

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
