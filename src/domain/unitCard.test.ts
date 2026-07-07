import { describe, expect, it } from "vitest";
import { getArmy } from "../data/gameData";
import { buildCard, cardStats, estimateFit, rangeOf } from "./unitCard";
import { buildTextExport } from "./export";
import { addCharacter, addUnit, createList, toggleCharacterUpgrade } from "./lists";

const orcs = getArmy("warmaster-revolution", "orcs")!;
const empire = getArmy("warmaster-revolution", "empire")!;
const chaos = getArmy("warmaster-revolution", "chaos")!;

function unit(army: typeof orcs, troop: string) {
  const found = army.units.find((u) => u.troop === troop);
  if (!found) throw new Error(`missing ${troop}`);
  return found;
}

describe("unit cards", () => {
  // Plan requirement: the Giant from the Orcs list — the longest special
  // rules in the game — must fit on a card (at a reduced font level).
  it("fits the Orcs Giant on a card", () => {
    const giant = unit(orcs, "Giant");
    const { fits, level } = estimateFit(giant);
    expect(fits).toBe(true);
    expect(level).toBeGreaterThan(0); // long text should step the font down
  });

  it("uses full font size for short rules", () => {
    const warriors = unit(chaos, "Chaos Warriors");
    expect(estimateFit(warriors)).toEqual({ level: 0, fits: true });
  });

  it("omits stat rows without values", () => {
    const general = unit(chaos, "General");
    const labels = cardStats(general).map((s) => s.label);
    expect(labels).not.toContain("Hits");
    expect(labels).not.toContain("Armour");
    expect(labels).not.toContain("Range");
    expect(labels).toContain("Command");
    expect(labels).toContain("Speed");
  });

  it("keeps melee, ranged, and bonus attacks as separate schema fields", () => {
    const pistoliers = cardStats(unit(empire, "Pistoliers"));
    expect(pistoliers).toEqual(expect.arrayContaining([
      { label: "Melee Attacks", value: "3" },
      { label: "Ranged Attacks", value: "1" },
      { label: "Hits", value: "3" },
      { label: "Armour", value: "5+" },
    ]));

    const general = cardStats(unit(chaos, "General"));
    expect(general).toContainEqual({ label: "Bonus Attacks", value: "+2" });
    expect(general.some((stat) => stat.label === "Melee Attacks")).toBe(false);
    expect(general.some((stat) => stat.label === "Ranged Attacks")).toBe(false);
  });

  it("derives shooting ranges", () => {
    expect(rangeOf(unit(empire, "Crossbowmen"))).toBe(30); // standard missile range
    expect(rangeOf(unit(empire, "Pistoliers"))).toBe(15); // "range of only 15cm"
    expect(rangeOf(unit(empire, "Cannon"))).toBe(60); // bounce profile
    expect(rangeOf(unit(empire, "Halberdiers"))).toBeNull();
    const goblins = getArmy("warmaster-revolution", "goblins")!;
    expect(rangeOf(unit(goblins, "Goblins"))).toBe(15); // "range is reduced to 15cm"
  });

  it("builds unit diagrams from size and facing", () => {
    const warriors = buildCard(unit(chaos, "Chaos Warriors"));
    expect(warriors.diagram).toEqual({ kind: "rects", count: 3, orientation: "horizontal" });
    const knights = buildCard(unit(chaos, "Chaos Knights"));
    expect(knights.diagram).toEqual({ kind: "rects", count: 3, orientation: "vertical" });
    const general = buildCard(unit(chaos, "General"));
    expect(general.diagram.kind).toBe("circle");
  });

  it("shows type rules when a unit has no specials", () => {
    const card = buildCard(unit(chaos, "Chaos Knights"));
    expect(card.rules.some((r) => r.includes("Cavalry cannot enter woods"))).toBe(true);
  });
});

describe("text export", () => {
  it("renders a compact Discord-friendly list", () => {
    let list = createList("warmaster-revolution", "2.2.6", "chaos", "Doom Host", 1000);
    list = addCharacter(list, "chaos:general");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "chaos:chaos-dragon");
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    const text = buildTextExport(list, chaos);
    expect(text).toContain("**Doom Host** — Chaos, 505/1000 pts");
    expect(text).toContain("- General (Chaos Dragon) — 225 pts");
    expect(text).toContain("- 2x Chaos Warriors — 280 pts");
  });
});


