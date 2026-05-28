# Loom Signal Deck

Public-facing Loom introduction site.

This repo starts as a static, Vercel-ready site. It does not require a database
or backend service for the current version.

## Local Preview

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Vercel

This site can be deployed as a static project:

```bash
vercel
```

Build command: none  
Output directory: `.`

The local `.vercel/` link directory is intentionally ignored by git.

## Asset Slots

The first release uses layout placeholders for the 13 member teaser zones.
Final teaser images can be added later without changing the page structure.
