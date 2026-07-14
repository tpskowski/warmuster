import type { RuleSetInfo, UnitData } from "../types";

// Extra units for the "Warmaster (Custom)" rule set. They are derived at
// runtime from the base Warmaster Revolution data (copying an existing unit's
// stats and rules, then applying tweaks) and spliced into the right army, so
// they exist only in the custom set — the base set is untouched.

function baseUnit(base: RuleSetInfo, unitId: string): UnitData {
  for (const army of base.armies) {
    const unit = army.units.find((u) => u.unitId === unitId);
    if (unit) return unit;
  }
  throw new Error(`customUnits: base unit "${unitId}" not found`);
}

function targetArmy(ruleSet: RuleSetInfo, armyId: string) {
  const army = ruleSet.armies.find((a) => a.army === armyId);
  if (!army) throw new Error(`customUnits: army "${armyId}" not found`);
  return army;
}

/** Clone a base unit and apply overrides, retagging it for the custom set. */
function derive(src: UnitData, over: Partial<UnitData>): UnitData {
  return { ...structuredClone(src), ...over, ruleSet: "warmaster-custom" };
}

/** Add the custom units to an already-cloned custom rule set. `base` is the
 * source (Warmaster Revolution) data the units copy from. */
export function applyCustomUnits(custom: RuleSetInfo, base: RuleSetInfo): void {
  const dwarfs = targetArmy(custom, "dwarfs");
  const goblins = targetArmy(custom, "goblins");

  // Ram Riders — a straight copy of the Chaos Dwarf Bull Centaurs.
  dwarfs.units.push(
    derive(baseUnit(base, "chaos-dwarfs:bull-centaurs"), {
      unitId: "dwarfs:ram-riders",
      troop: "Ram Riders",
      army: "dwarfs",
    }),
  );

  // Ancestral Warriors — the Vampire Counts Ethereal Host, renamed within its
  // rules, given a 4+ save at 130 pts, with the "no magic items" clause gone.
  const ethereal = baseUnit(base, "vampire-counts:ethereal-host");
  const ancestralText = ethereal.specials[0]
    .replace(/\s*Ethereal Hosts cannot have magic items\./i, "")
    .replace(/Ethereal Hosts?/gi, "Ancestral Warriors")
    .trim();
  dwarfs.units.push(
    derive(ethereal, {
      unitId: "dwarfs:ancestral-warriors",
      troop: "Ancestral Warriors",
      army: "dwarfs",
      points: 130,
      armour: "4+",
      specialName: "Ancestral Warriors",
      specials: [ancestralText],
    }),
  );

  // Iron Breakers — Dwarf Warriors with a 3+ save at 140 pts and a stubborn
  // drive-back rule.
  dwarfs.units.push(
    derive(baseUnit(base, "dwarfs:warriors"), {
      unitId: "dwarfs:iron-breakers",
      troop: "Iron Breakers",
      army: "dwarfs",
      armour: "3+",
      points: 140,
      specials: [
        "Ironbreakers cannot be driven back by shooting and do not roll for drive backs.",
      ],
    }),
  );

  // Giant Squig — a new Goblin monster. Its move is a variable 5D6cm, so the
  // stat block carries no fixed Speed; the movement lives in the rules.
  goblins.units.push({
    ruleSet: "warmaster-custom",
    ruleBook: "warmaster-revolution-armies",
    version: custom.version,
    army: "goblins",
    unitId: "goblins:giant-squig",
    troop: "Giant Squig",
    type: "Monster",
    subType: null,
    category: "unit",
    facing: "short",
    speed: null,
    halfPace: null,
    eligibleToUpgrade: [],
    meleeAttacks: null,
    rangedAttacks: null,
    bonusAttacks: null,
    meleeAttackProfile: "2D6",
    rangedAttackProfile: null,
    hits: 5,
    armour: null,
    command: null,
    bonusCommand: null,
    unitSize: 1,
    unitSizeModifier: null,
    points: 140,
    upgradePoints: null,
    min: null,
    max: 1,
    specialName: null,
    specials: [
      "Giant Squigs must always be given a separate order. They cannot be brigaded. " +
        "When activated assign the direction a Giant Squig is moving, then roll and move it 5D6cm. " +
        "Should a Giant Squig be activated and the command roll failed, it will move 5D6 in a random direction. " +
        "If this brings it into contact with a friendly unit they may give way as normal but become disordered on a roll of a 1 or a 2. " +
        "If they cannot give way the Squig makes 2D6 hits against them.",
    ],
    chart: null,
    notes: null,
  });
}
