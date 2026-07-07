# Warmuster

A [Warmaster Revolution](https://wm-revolution.eu/) army list builder — clean, fast, and entirely client-side. Lists auto-save to browser local storage and can be shared via URL. Built for deployment on Cloudflare Pages at **warmuster.net**.

## Development

```sh
npm install
npm run dev            # dev server
npm test               # data validation + unit tests
npm run build          # production build (dist/)
```

## Data pipeline

Army data is generated from the Markdown source lists, per [schema.md](schema.md):

```sh
npm run generate:data  # WMR_Armies_*.md + data/curation/ -> src/data/generated/
npm run validate:data  # sanity-check the generated JSON
npm run generate:diff  # compare against data/previous/ snapshot (if present)
```

- `WMR_Armies_2.26_army_lists.md` — raw source tables (kept in the repo).
- `data/curation/` — persistent curated normalization (facing/flying/speed overrides, mount eligibility, split special rules). Reapplied on every conversion; entries carry a `source` hash so changed source text is flagged for review.
- `src/data/generated/` — final app JSON. Regenerated, never hand-edited.
- `reports/` — normalization and version-diff reports.

See [plan.md](plan.md) for the project plan and roadmap.

Warmuster is an unofficial, non-commercial fan project, not affiliated with or endorsed by Games Workshop.

## In-app information pages

The Privacy, Changelog, Roadmap, and Credits dialogs are maintained as Markdown files in `src/content/info/`. `InfoDialog.tsx` imports them as raw text and `MarkdownContent.tsx` renders headings, paragraphs, bullet lists, and external links. Update the Markdown files to change the dialog copy; no component edit is required.