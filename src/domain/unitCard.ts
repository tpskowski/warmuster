import type { SpellData, UnitData } from "../types";
import type { MagicItemData } from "./magicItems";

// Unit-card model: what goes on a printed 63 x 88mm card (standard trading
// card, 3 x 3 per A4 page) and which font-fit level it needs. When special
// rules run long the rules font steps down first; if they still don't fit at
// a readable size the text is split at a sentence boundary and continues on
// the card's back face. Cards whose rules fit entirely on the front get the
// Warmuster logo back instead. Fit levels must stay in sync with the fit-N
// classes in src/styles.css; the Playwright layout test (tests/cards.spec.ts)
// verifies the estimates against real browser rendering for every card.

export interface CardStatRow {
  label: string;
  value: string;
}

export interface CardDiagram {
  kind: "rects" | "circle" | "none";
  count: number;
  orientation: "horizontal" | "vertical";
  /** Lay the stands out in two lanes instead of one strip. Set for a 4-stand
   * unit so it reads as a 2 x 2 block. */
  grid?: boolean;
}

/** One rule paragraph. A magic item carries its name as a bold `title` printed
 * on its own line above the text; ordinary rules have `title: null`. */
export interface CardRule {
  title: string | null;
  text: string;
}

/** Split an inline Markdown-style rule heading from its body so named custom
 * rules render consistently in dialogs, print views and unit cards. */
export function splitRuleHeading(text: string): CardRule {
  const match = text.match(/^\*\*([^*]+?)\*\*\s*:?[ \t]*(.*)$/s);
  if (!match) return { title: null, text };
  return { title: match[1].trim().replace(/:$/, ""), text: match[2] };
}

export interface CardModel {
  unitId: string;
  name: string;
  type: string;
  subType: string | null;
  stats: CardStatRow[];
  diagram: CardDiagram;
  /** Rule paragraphs shown on the front face. */
  frontRules: CardRule[];
  /** Continuation paragraphs on the back face; empty means logo back. */
  backRules: CardRule[];
  fitLevel: number;
  fits: boolean;
  /** Chart cards use tighter paragraph spacing (.card-compact in CSS). */
  compact: boolean;
}

// Brief type-rule summaries shown when a unit has no special rules (and to
// remind how the troop type behaves). These paraphrase the WMR rulebook.
const TYPE_RULES: Record<string, string> = {
  Infantry:
    "Infantry can enter woods and other dense terrain, defend obstacles and garrison built-up areas.",
  Cavalry:
    "Cavalry never counts as defended or fortified, even behind cover, and cannot move into contact with fortified enemy.",
  Chariot:
    "+1 Attack per stand when charging enemy in the open, in addition to the normal charge bonus. Chariots never count as defended or fortified, even behind cover, and cannot move into contact with fortified enemy.",
  Chariots:
    "+1 Attack per stand when charging enemy in the open, in addition to the normal charge bonus. Chariots never count as defended or fortified, even behind cover, and cannot move into contact with fortified enemy.",
  // Monsters never count as defended or fortified either, but the fortified
  // contact ban is not stated here: it spares giants and flying monsters.
  Monster:
    "+1 Attack per stand when charging enemy in the open, in addition to the normal charge bonus. Monsters never count as defended or fortified, even behind cover.",
  Artillery:
    "Artillery cannot charge on initiative, never pursues, and is destroyed if forced to retreat from combat. It can only cross open ground, hills and bridges, and can shoot over intervening troops from high ground.",
  Machine: "Machines follow their own movement and combat rules — see special rules.",
  General:
    "Character stand: joins units and adds bonus Attacks. Cannot be shot at or attacked directly. If the General is killed the battle is lost.",
  Hero: "Character stand: joins units and adds bonus Attacks. Cannot be shot at or attacked directly.",
  Wizard:
    "Character stand: joins units, adds bonus Attacks and casts spells. Cannot be shot at or attacked directly.",
};

// Ground movement limits. The rulebook names the terrain each type *may*
// cross and blocks everything else, so these read as a whitelist rather than
// a short list of forbidden features. Flying troops move over terrain, so
// these never apply to them.
const GROUND_TERRAIN_RULES: Record<string, string> = {
  Cavalry:
    "Cavalry can only move into or over hills, bridges, shallow fordable rivers, grown fields and low obstacles; all other terrain blocks them.",
  Monster:
    "Monsters can only move into or over hills, bridges, shallow fordable rivers, grown fields and low obstacles; all other terrain blocks them.",
  Chariot: "Chariots can only move into or over hills and bridges; all other terrain blocks them.",
  Chariots: "Chariots can only move into or over hills and bridges; all other terrain blocks them.",
};

const FLYER_RULE = "Flyer: uses the flying movement rules and can move over units and terrain.";

/**
 * Shooting range. Prefer an explicit "range of Ncm" in the unit's own rules,
 * fall back to the rulebook's standard artillery ranges (by attack profile)
 * or the standard 30cm missile range.
 */
export function rangeOf(unit: UnitData): number | null {
  if (unit.rangedAttacks == null && unit.rangedAttackProfile == null) return null;
  for (const text of unit.specials) {
    const m = text.match(
      /(?:(?:maximum )?range (?:of|is reduced to|is restricted to)|ranges up to)\s?(?:only )?(\d+)\s?cm/i,
    );
    if (m) return Number(m[1]);
  }
  if (unit.type === "Artillery" || unit.type === "Machine") {
    const profile = unit.rangedAttackProfile ?? "";
    if (/bounce/i.test(profile)) return 60; // cannon
    if (/skewer/i.test(profile)) return 40; // bolt thrower
    if (unit.specials.some((t) => /elven bolt thrower/i.test(t))) return 40;
    if (unit.specials.some((t) => /stone thrower/i.test(t))) return 60;
    return null; // varies; the special rules explain
  }
  return 30;
}

function signedValue(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

/** Stat rows for the card; rows without a value are omitted entirely. */
export function cardStats(unit: UnitData): CardStatRow[] {
  const rows: CardStatRow[] = [];
  const melee = unit.meleeAttackProfile ?? (unit.meleeAttacks != null ? String(unit.meleeAttacks) : null);
  const ranged = unit.rangedAttackProfile ?? (unit.rangedAttacks != null ? String(unit.rangedAttacks) : null);
  if (melee != null) rows.push({ label: "Melee Attacks", value: melee });
  if (ranged != null) rows.push({ label: "Ranged Attacks", value: ranged });
  if (unit.bonusAttacks != null) rows.push({ label: "Bonus Attacks", value: signedValue(unit.bonusAttacks) });
  if (unit.hits != null) rows.push({ label: "Hits", value: String(unit.hits) });
  // "0" armour means none — print it as the rulebook's dash (e.g. Skirmishers
  // "0 or 6+" becomes "- or 6+").
  if (unit.armour != null) rows.push({ label: "Armour", value: unit.armour.replace(/\b0\b/g, "-") });
  if (unit.command != null) rows.push({ label: "Command", value: String(unit.command) });
  if (unit.bonusCommand != null) rows.push({ label: "Command", value: signedValue(unit.bonusCommand) });
  const range = rangeOf(unit);
  if (range != null) rows.push({ label: "Range", value: `${range}cm` });
  if (unit.speed != null) rows.push({ label: "Speed", value: `${unit.speed}cm` });
  // Call out a non-standard half pace (flyers: 60cm full, 10cm half); when
  // it's simply half of Speed, or not applicable (null), print nothing.
  if (unit.speed != null && unit.halfPace != null && unit.halfPace !== unit.speed / 2) {
    rows.push({ label: "Half pace", value: `${unit.halfPace}cm` });
  }
  return rows;
}

/** The stats block prints in two columns: combat values (attacks, hits,
 * armour, command) on the left; movement and range on the right. */
const RIGHT_COLUMN_LABELS = new Set(["Range", "Speed", "Half pace"]);

export function statColumns(stats: CardStatRow[]): { left: CardStatRow[]; right: CardStatRow[] } {
  return {
    left: stats.filter((s) => !RIGHT_COLUMN_LABELS.has(s.label)),
    right: stats.filter((s) => RIGHT_COLUMN_LABELS.has(s.label)),
  };
}

/** Rule paragraphs: special rules if any, otherwise type rules. */
export function cardRules(unit: UnitData): string[] {
  const rules: string[] = [];
  if (unit.subType === "Flying") rules.push(FLYER_RULE);
  if (unit.specials.length > 0) {
    rules.push(...unit.specials);
  } else {
    // A flyer moves over terrain, so its ground limits would contradict the
    // flyer rule above.
    if (unit.subType !== "Flying") {
      const terrain = GROUND_TERRAIN_RULES[unit.type];
      if (terrain) rules.push(terrain);
    }
    const typeRule = TYPE_RULES[unit.type];
    if (typeRule) rules.push(typeRule);
  }
  return rules;
}

/** `extraStands` counts stands added by attachments (a Salamander joining
 * Skinks, Skirmishers joining Halberdiers), so the diagram shows the unit at
 * its actual strength. */
export function cardDiagram(unit: UnitData, extraStands = 0): CardDiagram {
  if (unit.category === "character") {
    // Standard characters remain round. Custom characters can explicitly opt
    // into a rectangular long- or short-facing base.
    if (unit.ruleSet === "warmaster-custom" && unit.facing !== "round") {
      return {
        kind: "rects",
        count: 1,
        orientation: unit.facing === "long" ? "vertical" : "horizontal",
      };
    }
    return { kind: "circle", count: 1, orientation: "horizontal" };
  }
  if (unit.category === "upgrade") return { kind: "none", count: 0, orientation: "horizontal" };
  // A modifier changes another unit's size; it is not a stand count itself.
  const count = (unit.unitSize ?? 0) + extraStands;
  if (count <= 0) return { kind: "none", count: 0, orientation: "horizontal" };
  // Long-edge units draw wide (horizontal) stands; short-edge draw tall ones.
  return {
    kind: "rects",
    count,
    orientation: unit.facing === "long" ? "horizontal" : "vertical",
    // No unit is natively four stands, so this is always a 3-stand unit plus
    // an attached stand; a 2 x 2 block reads better than a long strip.
    ...(count === 4 ? { grid: true } : {}),
  };
}

// ---------------------------------------------------------------- fit model
//
// Printed card geometry, in mm. The card is a stacked column: head (name,
// type, stand diagram), stats block, then rule paragraphs at full width.
// Overflowing rules continue on the back face, which has a slim head and the
// full inner height for text.

const PT_TO_MM = 0.3528;
const RULE_LINE_HEIGHT = 1.3;

// Per-character advance widths (em) for the card body font, measured from
// the bundled Noto Sans in Chromium (bundling pins these metrics on every
// platform). Line counts come from simulating the browser's greedy word
// wrap with these widths, so the estimate tracks the actual text instead of
// a one-size-fits-all average.
// prettier-ignore
const CHAR_EM: Record<string, number> = {
  a: 0.561, b: 0.615, c: 0.48, d: 0.615, e: 0.564, f: 0.344, g: 0.615,
  h: 0.618, i: 0.258, j: 0.258, k: 0.534, l: 0.258, m: 0.935, n: 0.618,
  o: 0.605, p: 0.615, q: 0.615, r: 0.413, s: 0.479, t: 0.361, u: 0.618,
  v: 0.508, w: 0.786, x: 0.529, y: 0.51, z: 0.47,
  A: 0.639, B: 0.65, C: 0.613, D: 0.73, E: 0.556, F: 0.519, G: 0.728,
  H: 0.741, I: 0.339, J: 0.273, K: 0.619, L: 0.524, M: 0.907, N: 0.76,
  O: 0.781, P: 0.605, Q: 0.781, R: 0.622, S: 0.549, T: 0.575, U: 0.731,
  V: 0.6, W: 0.93, X: 0.586, Y: 0.566, Z: 0.572,
  "0": 0.572, "1": 0.572, "2": 0.572, "3": 0.572, "4": 0.572,
  "5": 0.572, "6": 0.572, "7": 0.572, "8": 0.572, "9": 0.572,
  " ": 0.26, ".": 0.268, ",": 0.268, ";": 0.268, ":": 0.268, "!": 0.269,
  "?": 0.434, "(": 0.3, ")": 0.3, "'": 0.225, '"': 0.408, "-": 0.322,
  "+": 0.572, "/": 0.372, "%": 0.831, "°": 0.428, "–": 0.5, "—": 1,
  "’": 0.175, "‘": 0.175, "“": 0.359, "”": 0.359, "*": 0.551,
};
const FALLBACK_CHAR_EM = 0.55;
const SPACE_EM = CHAR_EM[" "];

function wordEm(word: string): number {
  let em = 0;
  for (const ch of word) em += CHAR_EM[ch] ?? FALLBACK_CHAR_EM;
  return em;
}

/** Lines the text occupies in a column `widthMm` wide at `pt`, simulating the
 * browser's greedy word wrap. Newlines are hard breaks (the cards render with
 * white-space: pre-line). `boldFactor` widens bold text slightly. */
export function textLines(text: string, widthMm: number, pt: number, boldFactor = 1): number {
  const capacityEm = widthMm / (pt * PT_TO_MM);
  let lines = 0;
  for (const segment of text.split("\n")) {
    lines++;
    let lineEm = 0;
    for (const word of segment.split(/\s+/)) {
      if (!word) continue;
      const em = wordEm(word) * boldFactor;
      const needed = lineEm === 0 ? em : lineEm + SPACE_EM * boldFactor + em;
      if (needed > capacityEm && lineEm > 0) {
        lines++;
        lineEm = Math.min(em, capacityEm); // overlong words break mid-word
      } else {
        lineEm = needed;
      }
    }
  }
  return Math.max(1, lines);
}

const INNER_W_MM = 57.4; // 63 - 2 x 2.5 padding - border
const INNER_H_MM = 82.4; // 88 - 2 x 2.5 padding - border
const HEAD_BASE_MM = 3.0; // head border, padding and margin
const NAME_LINE_MM = 5.4; // 11pt display line
const BACK_HEAD_MM = 7.0; // slim continuation head (measured incl. margin)
const PARA_GAP_MM = 1.2; // margin between rule paragraphs
const COMPACT_PARA_GAP_MM = 0.5; // tighter margin on chart cards (numbered lists)
const STAT_COL_GAP_MM = 2; // gap between the two stat columns
/** Safety margin: estimates must under-fill, never overflow. The word-wrap
 * simulation reproduces the browser's wrapping exactly for the bundled card
 * font, so only a thin margin remains for sub-pixel rounding. Verified over
 * every card face by tests/cards.spec.ts. */
const CAPACITY_FACTOR = 0.99;
/** Don't bother starting a paragraph on the front with less room than this. */
const MIN_SPLIT_MM = 8;

export interface FitLevel {
  /** Rules font size (pt) on both faces. */
  rulePt: number;
  /** Stat font size (pt) and row height (mm). */
  statPt: number;
  statLineMm: number;
  /** Unit name font size (pt). */
  namePt: number;
  /** May the rules continue on the back face at this level? */
  split: boolean;
}

/** Stat and name sizing derived from the rules font: roomy at large sizes,
 * compacting as the rules shrink so more room goes to the text. */
function level(rulePt: number, split: boolean): FitLevel {
  if (rulePt >= 7.5) return { rulePt, statPt: 8.5, statLineMm: 4.1, namePt: 11, split };
  if (rulePt >= 6.5) return { rulePt, statPt: 8, statLineMm: 3.6, namePt: 11, split };
  return { rulePt, statPt: 7.5, statLineMm: 3.3, namePt: 10, split };
}

// Quarter-point size ladder, largest first.
const PT_LADDER = [9, 8.75, 8.5, 8.25, 8, 7.75, 7.5, 7.25, 7, 6.75, 6.5, 6.25, 6, 5.75, 5.5, 5.25, 5];
/** Don't shrink front-only rules below this to avoid a split; below it,
 * splitting onto the back at a larger, more readable font wins. */
const FRONT_ONLY_FLOOR_PT = 6.5;

/** Fit levels tried in order: first every size (down to a readable floor)
 * that keeps the rules on the front, then every size that continues onto the
 * back. So a card only splits when it can't fit front-only at a reasonable
 * size, and each face then uses the largest font that fits. The card
 * components render these values as CSS variables, so nothing here needs a
 * matching CSS class. */
export const FIT_LEVELS: FitLevel[] = [
  ...PT_LADDER.filter((pt) => pt >= FRONT_ONLY_FLOOR_PT).map((pt) => level(pt, false)),
  ...PT_LADDER.map((pt) => level(pt, true)),
];

function ruleLineMm(rulePt: number): number {
  return rulePt * RULE_LINE_HEIGHT * PT_TO_MM;
}

/** Estimated head height: the name wraps beside the type label and diagram. */
function headMm(name: string, diagram: CardDiagram): number {
  // A grid diagram splits the stands over two lanes: two columns of stacked
  // wide stands, or two rows of side-by-side tall ones.
  const lanes = diagram.grid ? 2 : 1;
  const perLane = Math.ceil(diagram.count / lanes);
  const diagramH =
    diagram.kind === "circle" ? 5 : diagram.kind === "rects"
      ? diagram.orientation === "horizontal" ? perLane * 3.3 : 8.5 * lanes
      : 0;
  const diagramW = diagram.kind === "rects"
    ? diagram.orientation === "vertical" ? perLane * 4.2 : lanes === 2 ? 15.1 : 8
    : diagram.kind !== "none" ? 8 : 0;
  const nameWidthMm = name.length * 11 * 0.48 * PT_TO_MM;
  const nameLines = Math.max(1, Math.ceil(nameWidthMm / (INNER_W_MM - 13 - diagramW)));
  return HEAD_BASE_MM + Math.max(nameLines * NAME_LINE_MM, diagramH);
}

/** Stats block height: two side-by-side columns, so it follows the taller
 * column; a row whose text overflows its column wraps onto extra lines. */
function statsBlockMm(stats: CardStatRow[], fit: FitLevel): number {
  if (stats.length === 0) return 0;
  const { left, right } = statColumns(stats);
  const colWidthMm = (INNER_W_MM - STAT_COL_GAP_MM) / 2;
  const colLines = (rows: CardStatRow[]) =>
    rows.reduce((sum, row) => sum + textLines(`${row.label}: ${row.value}`, colWidthMm, fit.statPt), 0);
  return Math.max(colLines(left), colLines(right)) * fit.statLineMm + 1.5;
}

/** Height (mm) available for rule text on the front face. */
function frontRulesMm(card: Pick<CardModel, "name" | "diagram" | "stats">, fit: FitLevel): number {
  return (INNER_H_MM - headMm(card.name, card.diagram) - statsBlockMm(card.stats, fit)) * CAPACITY_FACTOR;
}

/** Height (mm) available for rule text on the back face. */
function backRulesMm(): number {
  return (INNER_H_MM - BACK_HEAD_MM) * CAPACITY_FACTOR;
}

/** Estimated height (mm) of one rule paragraph: an optional bold title line
 * (the magic item name) above the text, at the given font size. */
export function paragraphMm(rule: CardRule, rulePt: number, gapMm = PARA_GAP_MM): number {
  const titleLines = rule.title ? textLines(rule.title, INNER_W_MM, rulePt, 1.05) : 0;
  return (titleLines + textLines(rule.text, INNER_W_MM, rulePt)) * ruleLineMm(rulePt) + gapMm;
}

function rulesMm(rules: CardRule[], rulePt: number, gapMm: number): number {
  return rules.reduce((sum, rule) => sum + paragraphMm(rule, rulePt, gapMm), 0);
}

/** Split a rule at a sentence boundary so its head fits in `mmBudget`. The
 * title stays with the head; the continuation carries no title. */
function splitRule(
  rule: CardRule,
  rulePt: number,
  mmBudget: number,
  gapMm: number,
): [CardRule | null, CardRule] {
  const sentences = rule.text.split(/(?<=[.!?])\s+/);
  let head = "";
  for (let i = 0; i < sentences.length - 1; i++) {
    const candidate = head === "" ? sentences[i] : `${head} ${sentences[i]}`;
    if (paragraphMm({ title: rule.title, text: candidate }, rulePt, gapMm) > mmBudget) break;
    head = candidate;
  }
  if (head === "") return [null, rule];
  return [
    { title: rule.title, text: head },
    { title: null, text: rule.text.slice(head.length).trimStart() },
  ];
}

/** Distribute rule paragraphs over front and back at the given level. */
function layoutRules(
  rules: CardRule[],
  level: FitLevel,
  frontMm: number,
  gapMm: number,
): { front: CardRule[]; back: CardRule[]; fits: boolean } {
  const front: CardRule[] = [];
  const back: CardRule[] = [];
  let remaining = frontMm;
  let overflowed = false;
  for (const rule of rules) {
    if (overflowed) {
      back.push(rule);
      continue;
    }
    const need = paragraphMm(rule, level.rulePt, gapMm);
    if (need <= remaining) {
      front.push(rule);
      remaining -= need;
      continue;
    }
    overflowed = true;
    if (!level.split) return { front: rules, back: [], fits: false };
    if (remaining >= MIN_SPLIT_MM) {
      const [head, tail] = splitRule(rule, level.rulePt, remaining, gapMm);
      if (head != null) {
        front.push(head);
        back.push(tail);
        continue;
      }
    }
    back.push(rule);
  }
  const fits = !overflowed || rulesMm(back, level.rulePt, gapMm) <= backRulesMm();
  return { front, back, fits };
}

export interface CardFit {
  level: number;
  front: CardRule[];
  back: CardRule[];
  fits: boolean;
}

export function fitCard(
  card: Pick<CardModel, "name" | "diagram" | "stats">,
  rules: CardRule[],
  gapMm = PARA_GAP_MM,
): CardFit {
  let last: CardFit | null = null;
  for (let level = 0; level < FIT_LEVELS.length; level++) {
    const fit = FIT_LEVELS[level];
    const layout = layoutRules(rules, fit, frontRulesMm(card, fit), gapMm);
    last = { level, ...layout, fits: layout.fits };
    if (layout.fits) return last;
  }
  return last!;
}

function assembleCard(
  unitId: string,
  name: string,
  type: string,
  subType: string | null,
  stats: CardStatRow[],
  rules: CardRule[],
  diagram: CardDiagram,
  compact = false,
): CardModel {
  const fit = fitCard({ name, diagram, stats }, rules, compact ? COMPACT_PARA_GAP_MM : PARA_GAP_MM);
  return {
    unitId,
    name,
    type,
    subType,
    stats,
    diagram,
    frontRules: fit.front,
    backRules: fit.back,
    fitLevel: fit.level,
    fits: fit.fits,
    compact,
  };
}

/** Build a unit's card. Magic items carried by the unit are printed as
 * extra rule paragraphs on the same card, not as separate cards; the card id
 * distinguishes the variant so an unequipped copy of the unit keeps its own
 * card. */
/** A mount or other upgrade shown on its character's card: the upgrade name
 * in bold, then its rules (or a short label when it carries none). */
function upgradeRule(upgrade: UnitData): CardRule {
  const rules = cardRules(upgrade);
  const type = upgrade.type.replace(/\bMount\b/, "mount").toLowerCase();
  return { title: upgrade.troop, text: rules.length > 0 ? rules.join(" ") : `${type}.` };
}

/** Build a unit's card. Mounts/upgrades and magic items carried by the unit
 * are printed as extra rule paragraphs on the same card rather than as
 * separate cards; the card id encodes the applied upgrades and items so an
 * equipped copy of a unit keeps a distinct card from an unequipped one. */
export function buildCard(
  unit: UnitData,
  items: MagicItemData[] = [],
  upgrades: UnitData[] = [],
): CardModel {
  const ownRules = cardRules(unit).map(splitRuleHeading);
  // Custom units may carry a single normalized rule heading in `specialName`.
  // Keep standard ruleset cards exactly as they were, and do not duplicate an
  // inline heading or a name that is identical to the troop name.
  if (
    unit.ruleSet === "warmaster-custom" &&
    unit.specialName &&
    unit.specialName !== unit.troop &&
    ownRules[0] &&
    ownRules[0].title == null
  ) {
    ownRules[0] = { ...ownRules[0], title: unit.specialName };
  }
  const upgradeRules = upgrades.map(upgradeRule);
  const itemRules = items.map((item) => ({ title: item.name, text: item.text }));
  // On a character card the mount leads: a character with very long rules
  // (e.g. the Slann Mage) would otherwise bury its mount on the card back.
  // On a unit card an attachment (Salamander, Skirmishers) is an addition to
  // the parent unit, so the parent's own rules read first.
  const rules: CardRule[] =
    unit.category === "character"
      ? [...upgradeRules, ...itemRules, ...ownRules]
      : [...ownRules, ...upgradeRules, ...itemRules];
  // Attachments raise the unit's stand count; mounts leave it alone.
  const extraStands = upgrades.reduce((sum, u) => sum + (u.unitSizeModifier ?? 0), 0);
  const suffix = [...upgrades.map((u) => u.unitId), ...items.map((i) => i.itemId)];
  const unitId = suffix.length > 0 ? `${unit.unitId}+${suffix.join("+")}` : unit.unitId;
  return assembleCard(
    unitId,
    unit.troop,
    unit.subType ? `${unit.type} (${unit.subType})` : unit.type,
    unit.subType,
    cardStats(unit),
    rules,
    cardDiagram(unit, extraStands),
  );
}

/** A unit's roll chart (e.g. the Giant Goes Wild Chart) as its own card, one
 * paragraph per chart line. The text runs long, so the fit model spreads it
 * over the card's front and back faces. */
export function buildChartCard(unit: UnitData): CardModel | null {
  if (!unit.chart) return null;
  return assembleCard(
    `${unit.unitId}:chart`,
    unit.chart.name,
    unit.troop,
    null,
    [],
    unit.chart.text.split("\n").map((line) => ({ title: null, text: line })),
    { kind: "none", count: 0, orientation: "horizontal" },
    true, // numbered list: compact paragraph spacing buys a bigger font
  );
}

export function buildMagicItemCard(item: MagicItemData, bearer?: UnitData): CardModel {
  const kind = item.kind === "standard" ? "standard" : item.kind;
  const assignedCost = bearer ? item.cost(bearer) : null;
  const stats: CardStatRow[] = [
    { label: "Cost", value: assignedCost == null ? item.costLabel : `${assignedCost} pts` },
  ];
  if (bearer) stats.push({ label: "Carried by", value: bearer.troop });
  return assembleCard(
    item.itemId,
    item.name,
    `Magic ${kind}`,
    null,
    stats,
    [{ title: null, text: item.text }],
    { kind: "none", count: 0, orientation: "horizontal" },
  );
}

export function buildSpellCard(spell: SpellData): CardModel {
  return assembleCard(
    `spell:${spell.name}`,
    spell.name,
    "Spell",
    null,
    [
      { label: "To cast", value: spell.toCast },
      { label: "Range", value: spell.range },
    ],
    [{ title: null, text: spell.text }],
    { kind: "none", count: 0, orientation: "horizontal" },
  );
}
