import { describe, expect, it } from "vitest";
import {
  applyCuration,
  extractSpecialName,
  hashText,
  normalizeRow,
  parseArmyLists,
  slugify,
} from "./generate-army-json.mjs";

describe("slugify", () => {
  it("normalizes army and troop names", () => {
    expect(slugify("Tomb Kings")).toBe("tomb-kings");
    expect(slugify("Pirazzo‘s Lost Legion")).toBe("pirazzos-lost-legion");
    expect(slugify("Dogs of War")).toBe("dogs-of-war");
  });
});

describe("extractSpecialName", () => {
  it("pulls the leading bold heading", () => {
    const { specialName, body } = extractSpecialName("**Harpies.** Harpies can fly.");
    expect(specialName).toBe("Harpies");
    expect(body).toBe("Harpies can fly.");
  });

  it("handles missing heading", () => {
    const { specialName, body } = extractSpecialName("Just some text.");
    expect(specialName).toBeNull();
    expect(body).toBe("Just some text.");
  });
});

const SAMPLE = `## Chaos

| Troop | Type | Attacks | Hits | Armour | Command | Unit Size | Points per Unit | Min/Max | Special |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Chaos Warriors | Infantry | 4 | 4 | 4+ | - | 3 | 140 | 1/- | - |
| Harpies | Monster | 2 | 3 | 6+ | - | 3 | 65 | -/1 | **Harpies.** Harpies are based facing the long edge. Harpies can fly. A unit of harpies cannot be joined by a character. |
| General | General | +2 | - | - | 9 | 1 | 125 | 1 | - |
| Chaos Dragon | Monstrous Mount | +3 | - | - | - | - | +100 | -/1 | **Chaos Dragon.** Generals, Wizards and Heroes can ride a Chaos Dragon. |
`;

describe("normalizeRow via parseArmyLists", () => {
  const army = parseArmyLists(SAMPLE)[0];
  const units = army.rows.map((row) => normalizeRow(row, army.army));
  const byTroop = Object.fromEntries(units.map((u) => [u.troop, u]));

  it("applies infantry defaults per schema.md", () => {
    const u = byTroop["Chaos Warriors"];
    expect(u).toMatchObject({
      unitId: "chaos:chaos-warriors",
      category: "unit",
      facing: "long",
      speed: 20,
      halfPace: 10,
      meleeAttacks: 4,
      armour: "4+",
      command: null,
      unitSize: 3,
      points: 140,
      min: 1,
      max: null,
      specialName: null,
      specials: [],
      notes: null,
    });
  });

  it("normalizes characters", () => {
    const u = byTroop["General"];
    expect(u).toMatchObject({
      category: "character",
      facing: "round",
      speed: 60,
      halfPace: null,
      bonusAttacks: 2,
      meleeAttacks: null,
      command: 9,
      min: 1,
      max: 1,
    });
  });

  it("normalizes mounts as upgrades", () => {
    const u = byTroop["Chaos Dragon"];
    expect(u).toMatchObject({
      category: "upgrade",
      facing: null,
      speed: null,
      bonusAttacks: 3,
      points: null,
      upgradePoints: 100,
      max: 1,
      specialName: "Chaos Dragon",
    });
  });

  it("extracts special names and keeps body text in specials", () => {
    const u = byTroop["Harpies"];
    expect(u.specialName).toBe("Harpies");
    expect(u.specials).toHaveLength(1);
    expect(u.specials[0]).toContain("Harpies can fly.");
  });
});

describe("attack parsing", () => {
  const parse = (attacks) =>
    normalizeRow(
      { troop: "X", type: "Artillery", attacks, hits: "2", armour: "0", command: "-", unitSize: "1", points: "50", minMax: "-/1", rawSpecial: null },
      "test",
    );

  it("splits melee/ranged", () => {
    expect(parse("3/1")).toMatchObject({ meleeAttacks: 3, rangedAttacks: 1 });
  });

  it("keeps non-standard values as profiles", () => {
    expect(parse("1/8-4-2")).toMatchObject({ meleeAttacks: 1, rangedAttackProfile: "8-4-2" });
    expect(parse("1/2+ bounce")).toMatchObject({ meleeAttacks: 1, rangedAttackProfile: "2+ bounce" });
    expect(parse("D6")).toMatchObject({ meleeAttackProfile: "D6" });
  });

  it("handles double bonus (Djinn)", () => {
    expect(parse("+2/+2")).toMatchObject({ bonusAttacks: 2, rangedAttacks: 2 });
  });
});

describe("applyCuration", () => {
  const army = parseArmyLists(SAMPLE)[0];
  const row = army.rows.find((r) => r.troop === "Harpies");
  const unit = normalizeRow(row, army.army);

  it("applies overrides, specials, and notes", () => {
    const warnings = [];
    const curated = applyCuration(
      unit,
      {
        source: hashText(row.rawSpecial),
        overrides: { facing: "long", subType: "Flying", speed: 60, halfPace: 10 },
        specials: ["A unit of harpies cannot be joined by a character."],
        notes: "Harpies are based facing the long edge. Harpies can fly.",
      },
      warnings,
      row.rawSpecial,
    );
    expect(warnings).toHaveLength(0);
    expect(curated).toMatchObject({
      facing: "long",
      subType: "Flying",
      speed: 60,
      halfPace: 10,
      specials: ["A unit of harpies cannot be joined by a character."],
      notes: "Harpies are based facing the long edge. Harpies can fly.",
    });
  });

  it("flags stale curation when source text changes", () => {
    const warnings = [];
    applyCuration(unit, { source: "deadbeef", overrides: {} }, warnings, row.rawSpecial);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("STALE CURATION");
  });

  it("rejects unknown override fields", () => {
    expect(() => applyCuration(unit, { overrides: { armour: "3+" } }, [], row.rawSpecial)).toThrow(
      /unknown field/,
    );
  });
});
