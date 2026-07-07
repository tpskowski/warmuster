# Warmuster — Warmaster List Builder Plan

A clean, modern SPA for building Warmaster Revolution army lists. All data lives in the browser (localStorage + shareable URLs); the site deploys as a static build to Cloudflare Pages.

## Source material

- Rules: [Warmaster_Revolution_2.1.0_Rules.md](Warmaster_Revolution_2.1.0_Rules.md)
- Army lists: [WMR_Armies_2.26_army_lists.md](WMR_Armies_2.26_army_lists.md)
- Data schema and conversion pipeline: [schema.md](schema.md) — use that general format; adjust if needed.

## Architecture & reuse

Review `../dystopian-builder` and reuse its patterns wherever they fit; it already solves most of this app's problems:

- **Stack**: Vite + React 19 + TypeScript, plain CSS, Vitest + Testing Library. Static build works on Cloudflare Pages as-is.
- **Layout**: mirror its three-zone layout — saved-lists rail, unit catalog/builder in the center, detail inspector — adapted to Warmaster (armies instead of factions, units/characters/upgrades instead of battlegroups).
- **Storage**: `listRepository` pattern — localStorage persistence with auto-save on every change.
- **Sharing**: `shareCode` pattern — full list payload encoded in the URL hash as `prefix + base64url(deflate-raw(JSON))`, storing only stable IDs plus the data version; stats and points re-resolved from current app data on import. Define a Warmaster-specific prefix (e.g. `WMR1.`).
- **Data pipeline**: generation script converts raw Markdown into app JSON, plus a validation script wired into `npm test` (see schema.md for the full ingestion → curated normalization → JSON pipeline and version-diff report).
- **Info surfaces**: reuse its dialog/info-page patterns for privacy, changelog, roadmap, credits.

Diverge from dystopian-builder where Warmaster's requirements don't line up (unit cards, min/max-per-1000 validation, spells, curated special-rule normalization).

## Rule sets

- Rule-set switcher architecture from day one: rules data is registered per rule set, and a saved list records which rule set it was built against.
- Launch with **Warmaster Revolution** only. **Warmaster Revolution (Custom Units)** is deferred — the switcher and data model must support adding it later without schema changes (no data source for it exists yet).
- A list can be switched between rule sets; anything unsupported by the target rule set is removed, with a clear summary of what was dropped.

## Data

- Follow [schema.md](schema.md): Markdown tables → parsed intermediate data → persistent curated normalization → final app JSON. Raw `.md` files stay in the repo; regeneration is repeatable and curated normalization survives version updates.
- Version-diff report compares against the immediately previous version only.
- Schema is JSON, robust but hand-editable.
- Beyond unit tables, ingest per-army **spells** and army-wide **rules** (e.g. Undead) — these are first-class data used by the builder, print, and export.

## Builder features

1. Pick army, rule set, and points limit; add units, characters, and upgrades (mounts/chariots per `eligibleToUpgrade`).
2. Units display their basic stat line; special rules are long, so show them via hover/click (tooltip or expandable), not inline.
3. Army rules and available spells are visible in the builder for the selected army.
4. Auto-save to localStorage on every change; multiple saved lists.
5. Shareable link generation (URL-encoded list, no server).

## Validation

Warn-but-allow: validation problems show as clear errors/badges on the list, but never block saving or editing (friendly to drafts and house rules). Checks:

- **Min/max scale per full 1000 points** of the points limit (e.g. `2/-` at 2000 pts = minimum 4).
- Points total vs. points limit.
- Exactly one General; character max counts.
- Upgrade eligibility and upgrade max counts (`-/1` mounts etc.).
- Cross-unit substitution rules (e.g. "one unit of Crossbowmen per full 1000 points can be replaced by Handgunners while still counting for the Crossbowmen min/max") — represent these as structured validation data during curated normalization where practical; otherwise surface the rule text for manual judgment.
- Attachment-style units (e.g. Empire Skirmishers, `+1` unit size) validate against their parent-unit constraints.

## Print & export

Three output modes:

1. **Full print** — formatted army list with special rules, army rules, and spells included.
2. **Text export** — simple plain-text output for Discord, forums, etc.
3. **Unit cards** — see below.

### Unit cards

- All of a unit's stats and rules on one card; roughly **6 cards per page**; light on ink (no heavy fills).
- Auto-fit: if special rules run long, step the special-rule font size down; if still short on space, step other font sizes and spacing down.
- **Test requirement**: an automated test verifies the Giant from the Orcs army list fits on a card.
- Card format — shows exactly how the unit works:

  ```
  Name            Type            Unit Diagram
  Attacks: x      SPECIAL RULES (if any) or TYPE RULES
  Hits: x         SPECIAL RULES overflow or TYPE RULES
  Armour: x+      SPECIAL RULES overflow or TYPE RULES
  Command: x      SPECIAL RULES overflow or TYPE RULES
  Range: xcm      SPECIAL RULES overflow or TYPE RULES
  Speed: xcm      SPECIAL RULES overflow or TYPE RULES
  ```

- Rows with no value (Command, Range, and any other empty stat) are omitted entirely.
- If a unit has multiple special rules, or special rules plus type rules, put them on separate lines where possible.
- **Unit diagram**: rectangles reflecting the unit —
  - one rectangle per model in the unit (`unitSize`);
  - orientation follows `facing`: long-edge units draw horizontal rectangles, short-edge units draw vertical rectangles;
  - characters draw a single small circle.
- Include spell cards for wizards on the card sheet.

## UI & site

- Clean, compact, modern; works on desktop and mobile.
- Light and dark themes.
- Medieval-fantasy accent styling: gothic display font for headings/accents, readable body font.
- Display name: **Warmuster**.
- Home page links opening popups: **privacy, changelog, roadmap, credits**, plus a **feedback** link.
- Feedback link points to the Google Form: <https://docs.google.com/forms/d/e/1FAIpQLSdWJyFSI0gss_xQt4JmjLR_xswRuI3G8MvM1li24pAsES2B2w/viewform>

## Hosting

- Cloudflare Pages: pure static SPA build, no server dependencies; URL-hash sharing keeps everything client-side.
- Domain: **warmuster.net**.

## Milestones

- [x] **1. Scaffold + data pipeline** — Vite/React/TS project, conversion script per schema.md, generated JSON for all armies, data validation script, tests.
- [x] **2. Core builder** — army/rule-set/points selection, add units/characters/upgrades, stat lines with hover/click specials, localStorage auto-save, saved-list management.
- [x] **3. Validation** — warn-but-allow validator covering the checks above.
- [x] **4. Print & export** — full print, text export, unit cards with auto-fit + Giant test, spells and army rules included.
- [x] **5. Sharing + polish** — share links, themes, mobile pass, info popups, feedback link.
- [ ] **6. Later** — Custom Units rule set (needs a data source), rule-set switching UX for lists.
