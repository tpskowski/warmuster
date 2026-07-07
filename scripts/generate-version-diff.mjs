// Version diff report: compares the current generated data with the
// immediately previous version snapshot (data/previous/), per schema.md.
// To prepare a comparison, copy the old generated JSON into data/previous/
// before regenerating. Only one previous version is retained.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FILE = "warmaster-revolution.json";
const currentPath = path.join(root, "src", "data", "generated", FILE);
const previousPath = path.join(root, "data", "previous", FILE);

if (!fs.existsSync(previousPath)) {
  console.log(`No previous version snapshot at data/previous/${FILE}; nothing to diff.`);
  process.exit(0);
}

const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
const previous = JSON.parse(fs.readFileSync(previousPath, "utf8"));

const lines = [
  `# Version diff: ${previous.version} -> ${current.version}`,
  "",
];

const prevUnits = new Map();
for (const army of previous.armies) {
  for (const unit of army.units) prevUnits.set(unit.unitId, unit);
}
const curUnits = new Map();
for (const army of current.armies) {
  for (const unit of army.units) curUnits.set(unit.unitId, unit);
}

const IGNORED = new Set(["version"]);
let changes = 0;

for (const army of current.armies) {
  const armyLines = [];
  for (const unit of army.units) {
    const prev = prevUnits.get(unit.unitId);
    if (!prev) {
      armyLines.push(`- **${unit.troop}** (${unit.unitId}): added`);
      continue;
    }
    const fieldChanges = [];
    for (const key of new Set([...Object.keys(unit), ...Object.keys(prev)])) {
      if (IGNORED.has(key)) continue;
      const a = JSON.stringify(prev[key] ?? null);
      const b = JSON.stringify(unit[key] ?? null);
      if (a !== b) fieldChanges.push(`  - \`${key}\`: ${a} -> ${b}`);
    }
    if (fieldChanges.length > 0) {
      armyLines.push(`- **${unit.troop}** (${unit.unitId}):`, ...fieldChanges);
    }
  }
  for (const [unitId, unit] of prevUnits) {
    if (unitId.startsWith(`${army.army}:`) && !curUnits.has(unitId)) {
      armyLines.push(`- **${unit.troop}** (${unitId}): removed`);
    }
  }
  if (armyLines.length > 0) {
    lines.push(`## ${army.name}`, "", ...armyLines, "");
    changes += armyLines.length;
  }
}

if (changes === 0) lines.push("No changes.");

const outDir = path.join(root, "reports");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "version-diff.md"), lines.join("\n"));
console.log(`Wrote reports/version-diff.md (${changes} change lines).`);
