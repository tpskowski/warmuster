// Dev tool: drafts curation entries from the parsed intermediate data by
// applying conservative heuristics (flying, facing changes, movement changes,
// upgrade eligibility). Output goes to data/curation-draft/ for human review;
// reviewed entries are moved into data/curation/ which is the persistent,
// version-controlled normalization data. This tool never writes to
// data/curation/ itself.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashText, parseArmyLists, normalizeRow, extractSpecialName } from "../generate-army-json.mjs";

// This script lives in scripts/archive/, so the repo root is three levels up.
const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const markdown = fs.readFileSync(
  path.join(root, "data", "source", "WMR_Armies_2.26_army_lists.md"),
  "utf8",
);
const parsed = parseArmyLists(markdown);

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z‘'"“(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const GENERIC_ELIGIBILITY = [
  [/\bgenerals?\b/i, (u) => u.type === "General"],
  [/\bheroe?s?\b/i, (u) => u.type === "Hero"],
  [/\bwizards?\b/i, (u) => u.type === "Wizard"],
  [/\bany character\b/i, (u) => u.category === "character"],
];

function draftArmy(army) {
  const units = army.rows.map((row) => ({ row, unit: normalizeRow(row, army.army) }));
  const characters = units.filter((x) => x.unit.category === "character").map((x) => x.unit);
  const drafts = {};

  for (const { row, unit } of units) {
    if (!row.rawSpecial) continue;
    const { body } = extractSpecialName(row.rawSpecial);
    if (!body) continue;
    const allSentences = sentences(body);
    const overrides = {};
    const notesSentences = [];
    let eligibleToUpgrade;

    const flying = /\b(can fly|flies|flying)\b/i.test(body) && !/cannot fly/i.test(body);
    if (flying) {
      overrides.subType = "Flying";
      if (unit.category === "unit") {
        overrides.speed = 60;
        overrides.halfPace = 10;
      }
    }

    // Facing change: monsters based like infantry etc.
    if (/long edge/i.test(body) && unit.facing === "short") {
      overrides.facing = "long";
    }

    // Movement changes: "increasing ... to 100cm", "moves up to 20cm",
    // "move from 60 to 100cm", "movement reduction to 30cm". Only trust a
    // sentence that talks about moving, not shooting ranges.
    for (const sentence of allSentences) {
      if (/range|shoot|sight|spell/i.test(sentence)) continue;
      if (!/mov/i.test(sentence)) continue;
      const move = sentence.match(
        /(?:from \d+ ?(?:cm)? ?to|increas\w+\D{0,30}?to|reduc\w+\D{0,30}?to|moves? up to)\s*(\d+)\s?cm/i,
      );
      if (move) {
        overrides.speed = Number(move[1]);
        break;
      }
    }

    // Upgrade eligibility for mounts/bonuses.
    if (unit.category === "upgrade") {
      const targets = new Set();
      // Only trust positively-phrased eligibility sentences.
      const scope = allSentences
        .slice(0, 3)
        .filter((s) => !/\b(cannot|can't|can‘t|not be)\b/i.test(s))
        .join(" ");
      for (const [pattern, match] of GENERIC_ELIGIBILITY) {
        if (pattern.test(scope)) {
          for (const c of characters.filter(match)) targets.add(c.unitId);
        }
      }
      for (const c of characters) {
        const name = c.troop.replace(/[‘’']/g, "");
        if (new RegExp(`\\b${name}s?\\b`, "i").test(scope)) targets.add(c.unitId);
      }
      if (targets.size > 0) eligibleToUpgrade = [...targets].sort();
    }

    // Move absorbed sentences to notes: fly/facing/movement wording.
    const remaining = [];
    for (const sentence of allSentences) {
      const absorbed =
        (flying && /\b(fly|flies|flying)\b/i.test(sentence) && sentence.length < 220) ||
        (overrides.facing && /long edge/i.test(sentence)) ||
        (overrides.speed != null && /\d+\s?cm/i.test(sentence) && /(increas|reduc|moves? up to|move)/i.test(sentence) && sentence.length < 220);
      if (absorbed) notesSentences.push(sentence);
      else remaining.push(sentence);
    }

    if (Object.keys(overrides).length === 0 && !eligibleToUpgrade) continue;

    const entry = { source: hashText(row.rawSpecial) };
    if (Object.keys(overrides).length > 0) entry.overrides = overrides;
    if (eligibleToUpgrade) entry.eligibleToUpgrade = eligibleToUpgrade;
    if (notesSentences.length > 0) {
      entry.specials = remaining.length > 0 ? [remaining.join(" ")] : [];
      entry.notes = notesSentences.join(" ");
    }
    drafts[unit.unitId] = entry;
  }
  return drafts;
}

const outDir = path.join(root, "data", "curation-draft");
fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const army of parsed) {
  const drafts = draftArmy(army);
  const count = Object.keys(drafts).length;
  if (count === 0) continue;
  total += count;
  fs.writeFileSync(path.join(outDir, `${army.army}.json`), JSON.stringify(drafts, null, 2));
}
console.log(`Drafted ${total} curation entries -> data/curation-draft/`);
