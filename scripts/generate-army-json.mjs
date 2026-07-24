// Converts WMR_Armies_*.md army-list tables into the app JSON described in
// schema.md. Pipeline: markdown -> parsed intermediate data -> persistent
// curated normalization (data/curation/) -> final app JSON
// (src/data/generated/). Mechanical parsing only lives here; special-rule
// interpretation belongs in the curation data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const RULE_SET = "warmaster-revolution";
const RULE_BOOK = "warmaster-revolution-armies";
const SOURCE_FILE = path.join("data", "source", "WMR_Armies_2.26_army_lists.md");
const VERSION = "2.2.6";

const CHARACTER_TYPES = new Set(["General", "Hero", "Wizard"]);
const UPGRADE_TYPES = new Set([
  "Monstrous Mount",
  "Chariot Mount",
  "Special Mount",
  "Special Bonus",
]);

const FACING_DEFAULTS = {
  Infantry: "long",
  Cavalry: "short",
  Monster: "short",
  Chariot: "short",
  Chariots: "short",
  Artillery: "short",
  Machine: "short",
  General: "round",
  Hero: "round",
  Wizard: "round",
};

// [speed, halfPace] normal movement defaults. Machines vary per special rule
// and must come from curation.
const MOVE_DEFAULTS = {
  Infantry: [20, 10],
  Cavalry: [30, 15],
  Monster: [30, 15],
  Chariot: [30, 15],
  Chariots: [30, 15],
  Artillery: [10, 5],
  General: [60, null],
  Hero: [60, null],
  Wizard: [60, null],
};

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[‘’'’‘]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function hashText(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

function splitRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function isSeparatorRow(line) {
  return /^\|[\s:-]+\|/.test(line) && /-{2,}/.test(line);
}

// --- Stage 1: markdown -> intermediate records -----------------------------

export function parseArmyLists(markdown) {
  const lines = markdown.split(/\r?\n/);
  const armies = [];
  let army = null;
  let section = null;

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      army = {
        name: h2[1].trim(),
        army: slugify(h2[1]),
        rows: [],
        armyRules: [],
        spells: [],
      };
      armies.push(army);
      section = "units";
      continue;
    }
    if (!army) continue;
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      const title = h3[1].trim().toLowerCase();
      section = title === "spells" ? "spells" : title === "army rules" ? "rules" : "other";
      continue;
    }
    if (line.startsWith("|")) {
      if (isSeparatorRow(line)) continue;
      const cells = splitRow(line);
      if (section === "units") {
        if (cells[0] === "Troop") continue;
        if (cells.length !== 10) {
          throw new Error(`Unexpected unit row (${cells.length} cells) in ${army.name}: ${line.slice(0, 80)}`);
        }
        const [troop, type, attacks, hits, armour, command, unitSize, points, minMax, special] = cells;
        army.rows.push({
          troop,
          type,
          attacks,
          hits,
          armour,
          command,
          unitSize,
          points,
          minMax,
          rawSpecial: special === "-" ? null : special,
        });
      } else if (section === "spells") {
        if (cells[0] === "Spell") continue;
        if (cells.length !== 4) {
          throw new Error(`Unexpected spell row in ${army.name}: ${line.slice(0, 80)}`);
        }
        const [name, toCast, range, text] = cells;
        army.spells.push({ name, toCast, range, text: cleanText(text) });
      }
      continue;
    }
    if (section === "rules" && line.trim()) {
      army.armyRules.push(cleanText(line.trim()));
    }
  }
  return armies;
}

function cleanText(text) {
  return text.replace(/<br\s*\/?>/gi, "\n").replace(/\n{2,}/g, "\n").trim();
}

// --- Stage 2: mechanical normalization --------------------------------------

function parseNumberOrNull(value) {
  if (value === "-" || value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Attacks like "3", "3/1", "+2", "+2/+2", "1/2+ bounce", "1/8-4-2", "D6".
function parseAttacks(value) {
  const out = {
    meleeAttacks: null,
    rangedAttacks: null,
    bonusAttacks: null,
    meleeAttackProfile: null,
    rangedAttackProfile: null,
  };
  if (!value || value === "-" || value === "0") return out;
  const slash = value.indexOf("/");
  const melee = slash === -1 ? value.trim() : value.slice(0, slash).trim();
  const ranged = slash === -1 ? null : value.slice(slash + 1).trim();

  if (/^\+\d+$/.test(melee)) out.bonusAttacks = Number(melee.slice(1));
  else if (/^\d+$/.test(melee)) out.meleeAttacks = Number(melee);
  else if (melee) out.meleeAttackProfile = melee;

  if (ranged != null) {
    if (/^\+?\d+$/.test(ranged)) out.rangedAttacks = Number(ranged.replace("+", ""));
    else if (ranged) out.rangedAttackProfile = ranged;
  }
  return out;
}

function parseArmour(value) {
  if (!value || value === "-" || value === "0") return null;
  return value;
}

function parseCommand(value) {
  const out = { command: null, bonusCommand: null };
  if (!value || value === "-") return out;
  if (/^\+\d+$/.test(value)) out.bonusCommand = Number(value.slice(1));
  else out.command = parseNumberOrNull(value);
  return out;
}

function parseUnitSize(value) {
  const out = { unitSize: null, unitSizeModifier: null };
  if (!value || value === "-") return out;
  const mod = value.match(/^([+-])(\d+)$/);
  if (mod) out.unitSizeModifier = Number(value);
  else out.unitSize = parseNumberOrNull(value);
  return out;
}

function parsePoints(value) {
  const out = { points: null, upgradePoints: null };
  if (!value || value === "-") return out;
  if (/^\+\d+$/.test(value)) out.upgradePoints = Number(value.slice(1));
  else out.points = parseNumberOrNull(value);
  return out;
}

function parseMinMax(value) {
  if (!value || value === "-") return { min: null, max: null };
  if (!value.includes("/")) {
    const n = parseNumberOrNull(value);
    return { min: n, max: n };
  }
  const [minRaw, maxRaw] = value.split("/").map((v) => v.trim());
  return { min: parseNumberOrNull(minRaw), max: parseNumberOrNull(maxRaw) };
}

function categorize(type) {
  if (CHARACTER_TYPES.has(type)) return "character";
  if (UPGRADE_TYPES.has(type)) return "upgrade";
  return "unit";
}

// Extract the leading "**Name.**" heading from raw special text. Returns
// { specialName, body }.
export function extractSpecialName(rawSpecial) {
  if (!rawSpecial) return { specialName: null, body: null };
  const match = rawSpecial.match(/^\*\*([^*]+?)\.?\*\*\s*/);
  if (!match) return { specialName: null, body: cleanText(rawSpecial) };
  return {
    specialName: match[1].trim().replace(/\.$/, ""),
    body: cleanText(rawSpecial.slice(match[0].length)),
  };
}

export function normalizeRow(row, armyId) {
  const category = categorize(row.type);
  const { specialName, body } = extractSpecialName(row.rawSpecial);
  const { command, bonusCommand } = parseCommand(row.command);
  const unit = {
    ruleSet: RULE_SET,
    ruleBook: RULE_BOOK,
    version: VERSION,
    army: armyId,
    unitId: `${armyId}:${slugify(row.troop)}`,
    troop: row.troop,
    type: row.type,
    subType: null,
    category,
    facing: category === "upgrade" ? null : (FACING_DEFAULTS[row.type] ?? null),
    speed: category === "upgrade" ? null : (MOVE_DEFAULTS[row.type]?.[0] ?? null),
    halfPace: category === "upgrade" ? null : (MOVE_DEFAULTS[row.type]?.[1] ?? null),
    eligibleToUpgrade: [],
    ...parseAttacks(row.attacks),
    hits: parseNumberOrNull(row.hits),
    armour: parseArmour(row.armour),
    command,
    bonusCommand,
    ...parseUnitSize(row.unitSize),
    ...parsePoints(row.points),
    ...parseMinMax(row.minMax),
    specialName,
    specials: body ? [body] : [],
    // Named roll chart (e.g. the Giant Goes Wild Chart) split out of the
    // specials by curation; entries are newline-separated in `text`.
    chart: null,
    notes: null,
  };
  return unit;
}

// --- Stage 3: curated normalization -----------------------------------------

// Fields a curation entry may override. To turn a stand-alone unit into an
// attachment (like the Lizardmen Salamander joining Skinks) set `category` to
// "upgrade", move its cost to `upgradePoints` (with `points` null), and list
// the eligible parent units in `eligibleToUpgrade`; the app then offers it on
// those units instead of as its own catalog entry.
const OVERRIDABLE_FIELDS = new Set([
  "facing",
  "subType",
  "speed",
  "halfPace",
  "category",
  "command",
  "bonusCommand",
  "bonusAttacks",
  "rangedAttacks",
  "meleeAttacks",
  "meleeAttackProfile",
  "rangedAttackProfile",
  "specialName",
  "unitSize",
  "unitSizeModifier",
  "points",
  "upgradePoints",
  "max",
  "min",
]);

export function applyCuration(unit, entry, warnings, rawSpecial) {
  if (!entry) return unit;
  if (entry.source != null && entry.source !== hashText(rawSpecial ?? "")) {
    warnings.push(
      `STALE CURATION: ${unit.unitId} — source special text changed since the curated entry was written; review it.`,
    );
  }
  const out = { ...unit };
  for (const [field, value] of Object.entries(entry.overrides ?? {})) {
    if (!OVERRIDABLE_FIELDS.has(field)) {
      throw new Error(`Curation for ${unit.unitId} overrides unknown field "${field}"`);
    }
    out[field] = value;
  }
  if (entry.eligibleToUpgrade) out.eligibleToUpgrade = entry.eligibleToUpgrade;
  if (entry.specials) out.specials = entry.specials;
  if (entry.chart !== undefined) out.chart = entry.chart;
  if (entry.notes !== undefined) out.notes = entry.notes;
  return out;
}

// --- Main --------------------------------------------------------------------

function loadCuration(dir) {
  if (!fs.existsSync(dir)) return {};
  const merged = {};
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    for (const [unitId, entry] of Object.entries(data)) {
      if (merged[unitId]) throw new Error(`Duplicate curation entry for ${unitId}`);
      merged[unitId] = entry;
    }
  }
  return merged;
}

function main() {
  const markdown = fs.readFileSync(path.join(root, SOURCE_FILE), "utf8");
  const curation = loadCuration(path.join(root, "data", "curation"));
  const parsed = parseArmyLists(markdown);
  const warnings = [];
  const usedCuration = new Set();
  const armies = [];
  const intermediate = [];

  for (const parsedArmy of parsed) {
    const seen = new Set();
    const units = parsedArmy.rows.map((row) => {
      let unit = normalizeRow(row, parsedArmy.army);
      if (seen.has(unit.unitId)) {
        // Same troop name twice in one army (e.g. Lizardmen Stegadon unit +
        // Stegadon mount): qualify with the row type.
        unit.unitId = `${unit.unitId}-${slugify(row.type)}`;
        if (seen.has(unit.unitId)) throw new Error(`Duplicate unitId ${unit.unitId}`);
      }
      seen.add(unit.unitId);
      intermediate.push({ unitId: unit.unitId, rawSpecial: row.rawSpecial, source: hashText(row.rawSpecial ?? "") });
      if (curation[unit.unitId]) {
        usedCuration.add(unit.unitId);
        unit = applyCuration(unit, curation[unit.unitId], warnings, row.rawSpecial);
      }
      return unit;
    });
    armies.push({
      ruleSet: RULE_SET,
      ruleBook: RULE_BOOK,
      version: VERSION,
      army: parsedArmy.army,
      name: parsedArmy.name,
      units,
      armyRules: parsedArmy.armyRules,
      spells: parsedArmy.spells,
    });
  }

  for (const unitId of Object.keys(curation)) {
    if (!usedCuration.has(unitId)) {
      warnings.push(`ORPHAN CURATION: ${unitId} has a curated entry but no source row.`);
    }
  }

  const outDir = path.join(root, "src", "data", "generated");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${RULE_SET}.json`),
    JSON.stringify({ id: RULE_SET, name: "Warmaster Revolution", version: VERSION, armies }, null, 2),
  );

  const intermediateDir = path.join(root, "data", "intermediate");
  fs.mkdirSync(intermediateDir, { recursive: true });
  fs.writeFileSync(
    path.join(intermediateDir, "units.json"),
    JSON.stringify(intermediate, null, 2),
  );

  writeNormalizationReport(armies, curation, intermediate);

  const unitCount = armies.reduce((n, a) => n + a.units.length, 0);
  console.log(`Generated ${armies.length} armies, ${unitCount} units -> src/data/generated/${RULE_SET}.json`);
  console.log(`Curated entries applied: ${usedCuration.size}`);
  for (const warning of warnings) console.warn(warning);
  if (warnings.length > 0) process.exitCode = 1;
}

// Normalization report (schema.md §9): documents how curated normalization
// turned raw special-rule text into structured fields, specials, and notes.
function writeNormalizationReport(armies, curation, intermediate) {
  const rawByUnit = new Map(intermediate.map((r) => [r.unitId, r.rawSpecial]));
  const lines = ["# Normalization report", ""];
  for (const army of armies) {
    const curated = army.units.filter((u) => curation[u.unitId]);
    if (curated.length === 0) continue;
    lines.push(`# ${army.name}`, "");
    for (const unit of curated) {
      const entry = curation[unit.unitId];
      lines.push(`## ${unit.troop}`, "");
      lines.push(`Special text: ${rawByUnit.get(unit.unitId) ?? "(none)"}`, "");
      if (entry.overrides && Object.keys(entry.overrides).length > 0) {
        lines.push("Overrides:", "");
        for (const [field, value] of Object.entries(entry.overrides)) {
          lines.push(`- \`${field}\` set to ${JSON.stringify(value)}`);
        }
        lines.push("");
      }
      const result = {
        specialName: unit.specialName,
        eligibleToUpgrade: unit.eligibleToUpgrade,
        specials: unit.specials,
        notes: unit.notes,
      };
      lines.push("```json", JSON.stringify(result, null, 2), "```", "");
    }
  }
  const outDir = path.join(root, "reports");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "normalization-report.md"), lines.join("\n"));
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
