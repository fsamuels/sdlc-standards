# Documentation Standard

Where documentation lives, how it is organized, and the gate it has to pass before a PR
merges. Authoritative project configuration, not suggestions.

This file was written from a repo that already worked this way rather than from first
principles — see the audit note at the end for what that means for how firmly to hold it.

## Where documentation lives

`README.md` at the root, and everything else under `docs/`.

**The README's job is orientation, not content.** It says what the project is, how to run
it, and where every other document is. When a topic in it grows past a few paragraphs, it
moves to `docs/` and the README keeps a link.

**`docs/` is many small single-topic files, not one large one.** Two reasons, and the
second is the one that will not be obvious:

1. Two people editing different topics do not collide.
2. **AI assistants work better with focused context.** A standard meant to be fed back
   into an AI assistant should be structured for that from the start, and so should the
   project docs it governs. A 1,100-line README is one file an assistant either loads
   entirely or not at all.

Group by audience, not by format. The grouping that has held up:

| Directory | Holds |
| ------------------- | ------------------------------------------------------------ |
| `docs/product/` | What is being built and why — problem, features, roadmap |
| `docs/technical/` | How it is built — architecture, data model, algorithms |
| `docs/project/` | Where things stand — decisions, open questions, current state |

Small projects can stay flat under `docs/`. Split when a directory passes roughly five
files, not before.

## The documentation map

**The README carries a table of every document, with a one-line description of its
contents and how often it changes.** The change frequency is not decoration — it tells a
reader whether they are looking at a settled document or a live one, and it tells a
writer where new content is expected to land.

A map that is not maintained is worse than no map, because it is believed. Adding a
document and not adding its row is an incomplete change.

## Two rules that outrank the map

**Say it once.** If something belongs in two documents, put it in the more specific one
and link from the other. Duplication is how two files start disagreeing with each other,
and the disagreement is discovered months later by someone acting on the stale copy.

This rule applies across repo boundaries too: a project that adopts this standard links
to it rather than restating it. A restatement is a fork the moment either side changes.

**Status always means this repository.** Prototypes, demos, and design mockups are
different codebases. Document each in exactly one file, keep it apart from the product and
technical docs, and **never record it as progress.** Name the artifact you mean — "the
demo" is ambiguous the moment a second one exists, and the ambiguity is expensive: in the
project this rule came from, it cost a wrong assumption about roughly six person-weeks of
estimate.

## IDs are the linking API

Documents get reorganized; paths break. **Cite an ID, not a file path** — from tickets,
from commit messages, from other documents.

Allocation rules:

- **Always append.** Take the next free number.
- **Never renumber**, and **never reuse a retired one.** A dangling `F-42` in a
  six-month-old ticket should still resolve to the right thing.
- **Strike, don't delete.** If an item is dropped, strike the row and say why. The record
  of a decision reversed is worth more than a clean table.

The prefixes that have proven useful:

| Prefix | Means |
| ------ | ---------------------------------------------------------------- |
| `F-` | A catalogued feature |
| `D-` | A decision that has been made |
| `C-` | A contradiction between source documents, still unresolved |
| `OQ-` | An open question |
| `M` | A development milestone |

`C-` and `OQ-` earn their place on any project assembled from more than one source
document or spec, which most are. A `C-` becomes a `D-` when it is settled — mark the
contradiction resolved and point it at the decision rather than deleting the row.

## The decision log

**A decision is not made until it is in the decision log.** One table, append-only, in
`docs/project/decisions.md`.

Each row carries: the ID, the date, the decision, **the rationale**, **how reversible it
is**, and who decided. The last two columns are the ones people skip and the ones that
pay off.

- **Rationale** is what makes the row useful in six months, when the decision looks wrong
  and nobody remembers the constraint that forced it. Record what was rejected, not only
  what was chosen.
- **Reversibility** — *easy* (change in a day), *costly* (weeks of rework), or *one-way*
  (effectively permanent). **Spend deliberation time proportional to reversibility, not to
  how interesting the argument is.** This is the column that stops a two-hour debate about
  something that could be changed in an afternoon.

Superseding a decision does not remove it. Mark the old row superseded, point it at the
new one, and say what survived — decisions get partly overturned more often than wholly.

## Link integrity is enforced, not hoped for

Heavily cross-referenced docs break silently: renaming a heading changes its anchor and
every link pointing at it dies with no error anywhere.

**A project whose docs cross-reference each other runs a link checker in CI, on every
pull request.** Every relative link and every heading anchor must resolve. It must be
runnable locally too — a check that only exists in CI gets discovered after the push.

There is a zero-dependency implementation to copy in
[`carpooled/scripts/check-links.mjs`](https://github.com/packagedeallabs-ship-it/carpooled/blob/main/scripts/check-links.mjs);
it is about 100 lines of Node and needs no packages. Copying it is the exception to
say-it-once — it is code, not prose, and vendoring 100 dependency-free lines beats a
shared package here.

## Docs-before-PR

**Documentation is updated in the same change that adds the functionality.** Not after,
and not as a follow-up PR.

A pull request is not ready to open until all of these are true:

- [ ] Every document the change affects is updated **in this PR** — including the
      decision log, if a call was made.
- [ ] New documents are in the README's documentation map.
- [ ] The link checker passes locally.
- [ ] Nothing is stated in two places; the second place links to the first.
- [ ] Status claims describe this repository, and nothing else.

**Why this is a gate and not a habit.** AI-assisted development moves code fast enough
that review, not authorship, is the bottleneck — and a reviewer reading undocumented code
is the slowest possible review. The follow-up documentation PR is the one that never gets
opened; the change lands, the context evaporates, and the docs describe a system that
stopped existing three merges ago.

## Documenting what is not real yet

Projects accumulate scaffolds, shells, and ported screens that look finished. **Say
plainly which is which, in the document where the reader will actually be.**

The distinction worth spelling out is not "done vs. not done" but *in what way* something
is unfinished — a static mockup, a real code path over fixture data, and real logic with
nothing persisting behind it are three different states, and only the first is obvious
from looking at it. A reader who mistakes any of them for progress plans against a
schedule that does not exist.

## Audit note

**Every rule above is in production in at least one repo** — they were extracted from
[`packagedeallabs-ship-it/carpooled`](https://github.com/packagedeallabs-ship-it/carpooled),
which independently arrived at all of them across ~29 documents and then adopted this
standard, rather than being invented here and imposed.

That is the intended direction: write down what demonstrably works, then generalize.
Practices that vary between projects, or that no project does yet, do not belong in this
file until one has actually run them.

**Where that leaves confidence.** The rules with one adopter are validated as *workable*,
not as *general* — the second adopter is what tests generality, and where a rule is more
carpooled-shaped than it looks, it should be loosened here rather than worked around
there.
