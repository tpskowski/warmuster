import type { RuleSetInfo, UnitData } from "../types";

// Extra units for the "A Matter of Mustaches" rule set. They are derived at
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
  // Named custom characters are unique regardless of the army's points limit.
  const deriveDwarfCharacter = (
    sourceUnitId: string,
    overrides: Partial<UnitData>,
  ): UnitData =>
    derive(baseUnit(base, sourceUnitId), {
      ...overrides,
      max: 1,
      maxPerArmy: true,
    });
  const deriveDwarfHero = (overrides: Partial<UnitData>): UnitData =>
    deriveDwarfCharacter("dwarfs:hero", overrides);

  // Ram Riders — a straight copy of the Chaos Dwarf Bull Centaurs.
  dwarfs.units.push(
    derive(baseUnit(base, "chaos-dwarfs:bull-centaurs"), {
      unitId: "dwarfs:ram-riders",
      troop: "Ram Riders",
      army: "dwarfs",
      min: null,
      max: 2,
      maxPerArmy: false,
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
      min: null,
      max: 2,
      maxPerArmy: false,
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
      min: null,
      max: 2,
      maxPerArmy: false,
      specials: [
        "Ironbreakers cannot be driven back by shooting and do not roll for drive backs.",
      ],
    }),
  );

  // Bull Ogres — copied from the Ogre Kingdoms roster for Dwarf armies.
  dwarfs.units.push(
    derive(baseUnit(base, "ogre-kingdoms:bull-ogres"), {
      unitId: "dwarfs:bull-ogres",
      army: "dwarfs",
      min: null,
      max: 1,
      maxPerArmy: false,
    }),
  );

  // Dramar Thungnisson shields his unit with Ironbreaker's Resolve.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:dramar-thungnisson",
      troop: "Dramar Thungnisson",
      specialName: "Ironbreaker's Resolve",
      specials: [
        "When attached to a unit, one shooting hit inflicted on the unit after saves have been taken in each turn is ignored. This includes hits from magic spells inflicted in the Shooting phase.",
      ],
    }),
  );

  // Mounted Dramar spurs on a charging unit and shrugs off incoming fire.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:dramar-thungnisson-mounted",
      troop: "Dramar Thungnisson (Mounted)",
      specialName: null,
      specials: [
        "**For the Hold!:** When attached to a unit, if that unit has moved into contact with an enemy unit this turn you can re-roll one unsuccessful attack each round of combat.",
        "**Ironbreaker's Resolve:** When attached to a unit, one shooting hit inflicted on the unit after saves have been taken in each turn is ignored. This includes hits from magic spells inflicted in the Shooting phase.",
      ],
    }),
  );

  // Dorin Khazadsson leads a brigade of miners onto the battlefield.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:dorin-khazadsson",
      troop: "Dorin Khazadsson",
      specialName: "Underway Ambush",
      specials: [
        "This character and up to 3 Infantry units can be set aside before the battle. Starting on the second turn, at the end of the movement phase, this character’s controller can set this character and those miner units up anywhere on the battlefield as a brigade with this character attached. All models must be at least 20cm away from enemy units and they can not move this turn.",
      ],
    }),
  );

  // Yorri Thungnisson is especially deadly against Giants or Trolls.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:yorri-thungnisson",
      troop: "Yorri Thungnisson",
      bonusAttacks: 2,
      specialName: null,
      specials: [
        "**This Will be the One:** When the unit this character is attached to is in close combat with an enemy Giant or Troll increase bonus attacks by +1.",
      ],
    }),
  );

  // Brok Wheatbrow can rally an engaged unit once per battle.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:brok-wheatbrow",
      troop: "Brok Wheatbrow",
      specialName: "Hearty Provisions",
      specials: [
        "Once per game during the combat phase when the unit Brok is attached to has resolved a round of combat and remains engaged it may remove all damage it has suffered as if it had fallen out of combat.",
      ],
    }),
  );

  // Aldrich of the Unberogen can see and command over the heads of his kin.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:aldrich-of-the-unberogen",
      troop: "Aldrich of the Unberogen",
      specialName: "Is Tall",
      specials: [
        "This character counts their command range as 40cm rather than 20cm. If this unit is attached to a friendly unit, that unit may ignore other dwarf and goblin units for the purposes of line of sight for shooting attacks.",
      ],
    }),
  );

  // Torgo Thungnisson directs an artillery unit's fire with uncanny accuracy.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:torgo-thungnisson",
      troop: "Torgo Thungnisson",
      specialName: "Eye For Shooting",
      specials: [
        "Once per game, if this character is attached to an Artillery unit that unit may fire twice during the shooting phase at the same or different targets.",
      ],
    }),
  );

  // Mounted Torgo takes to the skies alongside Gyrocopter brigades.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:torgo-thungnisson-mounted",
      troop: "Torgo Thungnisson (Mounted)",
      facing: "long",
      specialName: "Master of the Skies",
      specials: [
        "This character can be attached to a Gyrocopter unit, while this character is attached to a Gyrocopter unit, that unit can form a brigade with other Gyrocopter units. An attached Gyrocopter unit gains +3 bonus shooting attacks.",
      ],
    }),
  );

  // Kadri Broadbrew shares a potent lucky brew once per battle.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:kadri-broadbrew",
      troop: "Kadri Broadbrew",
      specialName: "Kadri’s Lucky Brew",
      specials: [
        "When attached to a unit you can choose to immediately re-roll all the unit's Attack dice once in either the Shooting phase or Combat phase, including any bonus attacks from magic items or characters. All the dice must be re-rolled, including any that have scored hits. This effect only works once per game.",
      ],
    }),
  );

  // Logor Hardhaft scouts ahead with the army's Rangers.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:logor-hardhaft",
      troop: "Logor Hardhaft",
      specialName: "Hold Scout",
      specials: [
        "This character and any number of Ranger units may be set aside during deployment. After both armies have completed deployment, any Ranger units set aside with this model are deployed on the table at least 20cm away from any enemy units, this character is then attached to one of those units.",
      ],
    }),
  );

  // Rungni Silverhorn guides Ancestral Warriors through an ethereal passage.
  dwarfs.units.push(
    deriveDwarfHero({
      unitId: "dwarfs:rungni-silverhorn",
      troop: "Rungni Silverhorn",
      specialName: "Ethereal Passage",
      specials: [
        "This character may only be attached to Ancestral Warriors. Once per game at the end of the movement phase, this character, any Ancestral Warrior unit they have joined, and any Ancestral Warrior units in a brigade with that unit may be removed from the table and set up again at least 20cm away from enemy models.",
      ],
    }),
  );

  // Roknar Gromdal is a master Runesmith who dispels magic on a 3+.
  dwarfs.units.push(
    deriveDwarfCharacter("dwarfs:runesmith", {
      unitId: "dwarfs:roknar-gromdal",
      troop: "Roknar Gromdal",
      specialName: "Break the Winds of Magic",
      specials: [
        "If an enemy Wizard who is within 50cm of the Roknar casts a spell then he can attempt to anti-magic it. To determine if this works roll a D6 - on the score of 3+ the Roknar has succeeded and the spell is dispelled by the Roknar's defiant efforts. If he fails then the spell works as normal. Roknar can attempt to anti-magic any number of spells in a turn.",
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
    scoutingPoints: 0,
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
