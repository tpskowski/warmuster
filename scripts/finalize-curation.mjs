// One-shot promotion of reviewed draft curation (data/curation-draft/) into
// the persistent curation data (data/curation/), applying the hand-review
// corrections below. After this run, data/curation/ is the source of truth
// and is edited directly; this script documents how the initial data was
// produced.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const draftDir = path.join(root, "data", "curation-draft");
const outDir = path.join(root, "data", "curation");

const drafts = {};
const byArmy = {};
for (const file of fs.readdirSync(draftDir)) {
  const army = file.replace(/\.json$/, "");
  byArmy[army] = JSON.parse(fs.readFileSync(path.join(draftDir, file), "utf8"));
  Object.assign(drafts, byArmy[army]);
}

function entry(unitId) {
  const army = unitId.split(":")[0];
  byArmy[army] ??= {};
  byArmy[army][unitId] ??= {};
  return byArmy[army][unitId];
}
function setOverrides(unitId, overrides) {
  const e = entry(unitId);
  e.overrides = { ...e.overrides, ...overrides };
}
function setEligible(unitId, targets) {
  entry(unitId).eligibleToUpgrade = targets;
}

// --- Hand-review corrections -------------------------------------------------

// Machines: resolved movement values from their special rules.
setOverrides("empire:steam-tank", { halfPace: 10 });
setOverrides("skaven:warp-lightning-cannon", { speed: 20, halfPace: 10 });
setOverrides("skaven:doom-wheel", { speed: 20, halfPace: 10 });
setOverrides("skaven:screaming-bell", { speed: 20, halfPace: 10 });

// "able to fly" phrasing the draft heuristics missed.
setOverrides("chaos-dwarfs:great-taurus", { subType: "Flying", speed: 100 });
setOverrides("chaos-dwarfs:lammasu", { subType: "Flying", speed: 100 });
setOverrides("bretonnia:pegasus", { subType: "Flying", speed: 100 });

// Flying mounts: rider move becomes 100cm ("as for a normal flying mount").
setOverrides("araby:flying-carpet", { speed: 100 });
setOverrides("araby:djinn", { speed: 100 });
setOverrides("cathay:celestial-dragon", { speed: 100 });
setOverrides("nippon:tatsu", { speed: 100 });

// The shared "Dragons." text gives the *mount's rider* 100cm; the Dragon
// Rider unit itself is a flying Monster unit (schema default 60/10).
setOverrides("high-elves:dragon-rider", { speed: 60 });

// Eligibility corrections after reading the source text.
setEligible("high-elves:dragon", ["high-elves:general", "high-elves:hero", "high-elves:mage"]);
setEligible("lizardmen:stegadon-monstrous-mount", ["lizardmen:slann-mage-palanquin"]);
setEligible("lizardmen:carnosaur", ["lizardmen:saurus-hero"]);
setEligible("bretonnia:grail-reliquae", ["bretonnia:peasants"]);
setEligible("kislev:tzarina", ["kislev:general"]);
setEligible("dark-elves:chariot", ["dark-elves:general", "dark-elves:hero", "dark-elves:sorceress"]);
setEligible("cathay:chariot", ["cathay:general", "cathay:hero", "cathay:sorcerer"]);
setEligible("cathay:tiger", ["cathay:general", "cathay:hero"]);
setEligible("daemons:daemonic-wings", [
  "daemons:daemon-overlord",
  "daemons:daemon-lord-hero",
  "daemons:daemon-sorcerer",
]);
setEligible("daemons:favour-of-the-gods", [
  "daemons:daemon-overlord",
  "daemons:daemon-lord-hero",
  "daemons:daemon-sorcerer",
]);
setEligible("araby:flying-carpet", ["araby:general", "araby:hero", "araby:wizard"]);
setEligible("araby:elephant", ["araby:general", "araby:hero", "araby:wizard"]);
setEligible("goblins:wyvern", ["goblins:goblin-warboss", "goblins:goblin-hero", "goblins:goblin-shaman"]);
setEligible("chaos-dwarfs:sorcerer-lord", ["chaos-dwarfs:general"]);
setEligible("wood-elves:forest-dragon", [
  "wood-elves:general",
  "wood-elves:noble",
  "wood-elves:spellweaver",
]);

// -----------------------------------------------------------------------------

fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const [army, entries] of Object.entries(byArmy)) {
  if (Object.keys(entries).length === 0) continue;
  total += Object.keys(entries).length;
  fs.writeFileSync(path.join(outDir, `${army}.json`), JSON.stringify(entries, null, 2));
}
console.log(`Wrote ${total} curation entries -> data/curation/`);
