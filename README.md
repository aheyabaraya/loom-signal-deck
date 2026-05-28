# Loom Signal Deck

Public-facing Loom introduction web prototype.

Internal project context:

- Internal repository/project name: `AURORA-M`
- Public group name: `Loom`
- Fan name: `Harne`

This is a standalone sub-repository under the IDOL workspace. It starts as a
static Vercel-ready site so deployment can happen before the final image assets
are locked.

## Local Preview

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Vercel

Linked Vercel project:

```text
yuminseoks-projects/loom-signal-deck
```

This site can be deployed as a static project from this folder:

```bash
vercel
```

Build command: none  
Output directory: `.`

The local `.vercel/` link directory is intentionally ignored by git.

## Source Planning

Relevant planning files in the parent IDOL workspace:

- `docs/interactive-idol-web/loom-introduction-blueprint.md`
- `docs/interactive-idol-web/site-structure.md`
- `docs/interactive-idol-web/idol-teaser-style-research.md`
- `drive-sync/tmp/2026-05-28-loom-member-teaser-gpt-handoff.md`
