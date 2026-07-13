# Archived bootstrap scripts

These scripts produced the **initial** `data/curation/` normalization data. They
are kept for reference and are **not** part of the regular data pipeline (see
the repo README). `data/curation/` is now the source of truth and is edited
directly.

The original one-time flow was:

1. `node scripts/archive/draft-curation.mjs`
   Applies conservative heuristics (flying, facing, movement, upgrade
   eligibility) to the parsed source lists and writes draft entries to
   `data/curation-draft/` (git-ignored) for human review.

2. Hand-review the drafts.

3. `node scripts/archive/finalize-curation.mjs`
   Promotes the reviewed drafts into `data/curation/`, applying the
   hand-corrections recorded in the script.

To re-bootstrap from a substantially changed source (e.g. a new rulebook
edition), run step 1, review, then merge by hand into `data/curation/` rather
than re-running the one-shot finalize.
