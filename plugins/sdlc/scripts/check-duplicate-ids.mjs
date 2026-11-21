#!/usr/bin/env node
// Fails if two table rows define the same ID (F-12, D-111, C-3, OQ-7) — the symptom of two
// branches both taking "the next free number". Zero dependencies; vendor it like check-links.
//
//   node scripts/check-duplicate-ids.mjs [dir-or-file ...]     (default: docs README.md)
//
// An ID is *defined* by the first cell of a table row; mentions elsewhere are references and
// are ignored. Struck-through rows still count: a retired ID is never reused.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ID = /^(?:F|D|C|OQ)-\d+$/;

function* markdownFiles(path) {
  if (!existsSync(path)) return;
  if (statSync(path).isFile()) {
    if (path.endsWith('.md')) yield path;
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    yield* markdownFiles(join(path, entry.name));
  }
}

export function findDuplicates(files) {
  const seen = new Map();
  const duplicates = [];
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (!line.trimStart().startsWith('|')) return;
      const first = line.split('|')[1]?.replace(/[~*`\s]/g, '');
      if (!first || !ID.test(first)) return;
      const where = `${file}:${i + 1}`;
      if (seen.has(first)) duplicates.push({ id: first, first: seen.get(first), again: where });
      else seen.set(first, where);
    });
  }
  return duplicates;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targets = process.argv.length > 2 ? process.argv.slice(2) : ['docs', 'README.md'];
  const duplicates = findDuplicates(targets.flatMap((t) => [...markdownFiles(t)]));
  for (const d of duplicates) console.error(`${d.id} defined twice: ${d.first} and ${d.again}`);
  if (duplicates.length) {
    console.error('\nTwo branches took the same ID. Renumber the one that has NOT merged yet.');
    process.exit(1);
  }
}
