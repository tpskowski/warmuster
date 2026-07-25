import { describe, expect, it } from "vitest";
import { getArmy } from "../data/gameData";
import { buildCard, buildChartCard, buildSpellCard, cardStats, rangeOf, statColumns } from "./unitCard";
import { magicItems } from "./magicItems";
import { ruleSets } from "../data/gameData";
import { listCards } from "../components/PrintView";
import { buildTextExport } from "./export";
import { addCharacter, addUnit, assignMagicItem, createList, toggleCharacterUpgrade } from "./lists";

const orcs = getArmy("warmaster-revolution", "orcs")!;
const empire = getArmy("warmaster-revolution", "empire")!;
const chaos = getArmy("warmaster-revolution", "chaos")!;

function unit(army: typeof orcs, troop: string) {
  const found = army.units.find((u) => u.troop === troop);
  if (!found) throw new Error(`missing ${troop}`);
  return found;
}

describe("unit cards", () => {
  // The Giant from the Orcs list has the longest special rules in the game:
  // far too much for a 63 x 88mm front, so the text must continue on the
  // card's back face — and fit there.
  it("continues the Orcs Giant rules on the back of the card", () => {
    const card = buildCard(unit(orcs, "Giant"));
    expect(card.fits).toBe(true);
    expect(card.backRules.length).toBeGreaterThan(0);
    // Nothing may be lost in the front/back split.
    const total = [...card.frontRules, ...card.backRules].map((r) => r.text).join(" ");
    for (const special of unit(orcs, "Giant").specials) {
      for (const sentence of special.split(/(?<=[.!?])\s+/)) {
        expect(total).toContain(sentence);
      }
    }
  });

  it("splits the Giant Goes Wild Chart onto its own two-sided card", () => {
    const giant = unit(orcs, "Giant");
    // The chart lives in the dedicated field, not in the running rules.
    expect(giant.chart?.name).toBe("Giant Goes Wild Chart");
    expect(giant.specials.join(" ")).not.toContain("stands rooted to the spot");
    const lines = giant.chart!.text.split("\n");
    expect(lines).toHaveLength(6);
    lines.forEach((line, i) => expect(line.startsWith(`${i + 1}.`)).toBe(true));

    // The chart prints as its own card, spread over front and back.
    const card = buildChartCard(giant)!;
    expect(card.name).toBe("Giant Goes Wild Chart");
    expect(card.fits).toBe(true);
    expect(card.backRules.length).toBeGreaterThan(0);
    expect([...card.frontRules, ...card.backRules].map((r) => r.text).join(" ")).toContain(
      "mighty bellow",
    );

    // Units without a chart produce no chart card.
    expect(buildChartCard(unit(chaos, "Chaos Warriors"))).toBeNull();

    // All six giants share the treatment.
    for (const armyId of ["albion", "dogs-of-war", "goblins", "norse", "ogre-kingdoms"]) {
      const army = getArmy("warmaster-revolution", armyId)!;
      const g = army.units.find((u) => u.chart != null);
      expect(g, armyId).toBeDefined();
      expect(buildChartCard(g!)!.fits, armyId).toBe(true);
    }

    // Printing a list with a Giant includes the chart card once.
    let list = createList("warmaster-revolution", "2.2.6", "orcs", "Waaagh", 2000);
    list = addUnit(list, "orcs:giant");
    list = addUnit(list, "orcs:giant");
    const cards = listCards(list, orcs);
    expect(cards.filter((c) => c.unitId === "orcs:giant:chart")).toHaveLength(1);
  });

  it("uses full font size and a logo back for short rules", () => {
    const card = buildCard(unit(chaos, "Chaos Warriors"));
    expect(card.fitLevel).toBe(0);
    expect(card.fits).toBe(true);
    expect(card.backRules).toEqual([]);
  });

  // Requirement: no card in any army may overflow — everything must fit on
  // the front or continue onto the back. The Playwright layout test
  // (tests/cards.spec.ts) verifies the same against real rendering.
  it("fits every unit, spell, and magic item in the game on a card", () => {
    for (const ruleSet of ruleSets) {
      for (const army of ruleSet.armies) {
        for (const u of army.units) {
          const card = buildCard(u);
          expect(card.fits, `${army.name} ${u.troop}`).toBe(true);
        }
        for (const spell of army.spells) {
          expect(buildSpellCard(spell).fits, `${army.name} spell ${spell.name}`).toBe(true);
        }
      }
    }
    // Magic items print on their bearer's card and must still fit there.
    const bearer = unit(chaos, "General");
    const banner = unit(chaos, "Chaos Warriors");
    for (const item of magicItems) {
      const card = buildCard(item.kind === "standard" ? banner : bearer, [item]);
      expect(card.fits, `item ${item.name}`).toBe(true);
    }
  });

  it("prints magic items on the bearer's card, not as extra cards", () => {
    let list = createList("warmaster-revolution", "2.2.6", "chaos", "Host", 2000);
    list = addCharacter(list, "chaos:general");
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    const item = magicItems.find((i) => i.kind !== "standard")!;
    list = assignMagicItem(list, item.itemId, { kind: "character", id: list.characters[0].id });
    expect(list.characters[0].magicItems).toEqual([item.itemId]);

    const cards = listCards(list, chaos);
    // No standalone magic-item card...
    expect(cards.some((c) => c.name === item.name)).toBe(false);
    // ...the General's card carries the item's rules instead.
    const general = cards.find((c) => c.unitId === `chaos:general+${item.itemId}`)!;
    expect(general.name).toBe("General");
    // The item prints as its own paragraph: bold name as the title, then text.
    const itemRule = [...general.frontRules, ...general.backRules].find((r) => r.title === item.name);
    expect(itemRule).toBeDefined();
    expect(itemRule!.text).toContain(item.text.slice(0, 20));
    expect(general.fits).toBe(true);
    // The unequipped Chaos Warriors keep a single plain card.
    expect(cards.filter((c) => c.unitId === "chaos:chaos-warriors")).toHaveLength(1);
  });

  it("puts a mount/upgrade before the unit's own long rules on the card", () => {
    // The Lizardmen Slann has enormous rules text; its mount must still land
    // on the front, not be buried after that wall of text on the back.
    const lizardmen = getArmy("warmaster-revolution", "lizardmen")!;
    const slann = lizardmen.units.find((u) => u.unitId === "lizardmen:slann-mage-palanquin")!;
    const stegadon = lizardmen.units.find(
      (u) => u.unitId === "lizardmen:stegadon-monstrous-mount",
    )!;
    const card = buildCard(slann, [], [stegadon]);
    expect(card.fits).toBe(true);
    expect(card.frontRules[0]?.title).toBe("Stegadon"); // mount is first, on the front
    expect(card.frontRules.some((r) => r.title === "Stegadon")).toBe(true);
  });

  it("can move magic items from units onto their own cards", () => {
    let list = createList("warmaster-revolution", "2.2.6", "chaos", "Host", 2000);
    list = addCharacter(list, "chaos:general");
    const item = magicItems.find((i) => i.kind !== "standard")!;
    list = assignMagicItem(list, item.itemId, { kind: "character", id: list.characters[0].id });

    const cards = listCards(list, chaos, {
      printMagicCards: true,
      includeMagicItemsOnUnits: false,
    });
    const general = cards.find((card) => card.unitId === "chaos:general")!;
    expect([...general.frontRules, ...general.backRules].some((rule) => rule.title === item.name)).toBe(false);

    const itemCard = cards.find((card) => card.unitId === item.itemId)!;
    expect(itemCard.name).toBe(item.name);
    expect(itemCard.type).toMatch(/^Magic /);
    expect(itemCard.stats).toContainEqual({ label: "Carried by", value: "General" });
    expect([...itemCard.frontRules, ...itemCard.backRules].map((rule) => rule.text).join(" ")).toContain(
      item.text.slice(0, 20),
    );
  });

  it("can omit spell cards", () => {
    let list = createList("warmaster-revolution", "2.2.6", "chaos", "Host", 2000);
    list = addCharacter(list, "chaos:sorcerer");

    expect(listCards(list, chaos).some((card) => card.unitId.startsWith("spell:"))).toBe(true);
    expect(
      listCards(list, chaos, {
        printMagicCards: false,
        includeMagicItemsOnUnits: true,
      }).some((card) => card.unitId.startsWith("spell:")),
    ).toBe(false);
  });

  it("prints mount rules on the character's card, not as a separate card", () => {
    let list = createList("warmaster-revolution", "2.2.6", "empire", "Host", 2000);
    list = addCharacter(list, "empire:general");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "empire:griffon");
    expect(list.characters[0].upgrades).toEqual(["empire:griffon"]);

    const cards = listCards(list, empire);
    // No standalone mount card...
    expect(cards.some((c) => c.name === "Griffon")).toBe(false);
    expect(cards.some((c) => c.unitId === "empire:griffon")).toBe(false);
    // ...the General's card carries the Griffon's rules as a titled paragraph.
    const general = cards.find((c) => c.unitId === "empire:general+empire:griffon")!;
    expect(general.name).toBe("General");
    const mount = [...general.frontRules, ...general.backRules].find((r) => r.title === "Griffon");
    expect(mount).toBeDefined();
    expect(mount!.text).toContain("Attacks");
    expect(general.fits).toBe(true);
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

  it("prints '0' armour as a dash", () => {
    // Empire Skirmishers have armour "0 or 6+" — the 0 should read as "-".
    const skirmishers = cardStats(unit(empire, "Skirmishers"));
    expect(skirmishers).toContainEqual({ label: "Armour", value: "- or 6+" });
    // Ordinary armour is untouched.
    expect(cardStats(unit(chaos, "Chaos Warriors"))).toContainEqual({ label: "Armour", value: "4+" });
  });

  it("groups Range, Speed and Half pace into the right stat column", () => {
    const highElves = getArmy("warmaster-revolution", "high-elves")!;
    const { left, right } = statColumns(cardStats(unit(highElves, "Giant Eagles")));
    expect(right.map((s) => s.label)).toEqual(["Speed", "Half pace"]);
    expect(left.map((s) => s.label)).not.toContain("Speed");
    expect(left.map((s) => s.label)).toContain("Hits");
    // Crossbowmen carry all three right-column stats.
    const cross = statColumns(cardStats(unit(empire, "Crossbowmen")));
    expect(cross.right.map((s) => s.label)).toEqual(["Range", "Speed"]);
    expect(cross.left.every((s) => !["Range", "Speed", "Half pace"].includes(s.label))).toBe(true);
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

  it("shows half pace only when it is not half of speed", () => {
    const highElves = getArmy("warmaster-revolution", "high-elves")!;
    const eagles = cardStats(unit(highElves, "Giant Eagles"));
    expect(eagles).toContainEqual({ label: "Speed", value: "60cm" });
    expect(eagles).toContainEqual({ label: "Half pace", value: "10cm" });
    // Standard troops halve their speed: no extra row.
    const warriors = cardStats(unit(chaos, "Chaos Warriors"));
    expect(warriors.some((s) => s.label === "Half pace")).toBe(false);
    // Characters have no half pace at all (halfPace is null).
    const general = cardStats(unit(chaos, "General"));
    expect(general.some((s) => s.label === "Half pace")).toBe(false);
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

  const ruleText = (u: Parameters<typeof buildCard>[0]) =>
    buildCard(u).frontRules.map((r) => r.text).join(" ");

  it("shows type rules when a unit has no specials", () => {
    const rules = ruleText(unit(chaos, "Chaos Knights"));
    // The rulebook lists the terrain cavalry *can* cross; everything else
    // blocks them, so the reminder must not read as a short blacklist.
    expect(rules).toContain("Cavalry can only move into or over hills");
    expect(rules).toContain("grown fields and low obstacles");
    expect(rules).toContain("never counts as defended or fortified");
  });

  it("limits chariots to hills and bridges, unlike cavalry", () => {
    const rules = ruleText(unit(chaos, "Chaos Chariots"));
    expect(rules).toContain("Chariots can only move into or over hills and bridges");
    // Chariots are stricter than cavalry: no fords, fields or low obstacles.
    expect(rules).not.toContain("fordable rivers");
    expect(rules).toContain("in addition to the normal charge bonus");
  });

  it("gives monsters their own ground limits", () => {
    const daemons = getArmy("warmaster-revolution", "daemons")!;
    const beasts = daemons.units.find((u) => u.unitId === "daemons:daemon-beasts")!;
    const rules = ruleText(beasts);
    expect(rules).toContain("Monsters can only move into or over hills");
    expect(rules).toContain("grown fields and low obstacles");
    expect(rules).toContain("never count as defended or fortified");
  });

  it("does not put ground terrain limits on a flying monster", () => {
    const eagles = getArmy("warmaster-revolution", "high-elves")!.units.find(
      (u) => u.unitId === "high-elves:giant-eagles",
    )!;
    const rules = ruleText(eagles);
    expect(rules).toContain("Flyer:"); // flies over terrain instead
    expect(rules).not.toContain("all other terrain blocks them");
    // The charge bonus still applies to a flying monster.
    expect(rules).toContain("in addition to the normal charge bonus");
  });

  it("puts the parent unit's rules before an attached stand's", () => {
    // Unlike a character's mount, an attachment adds to the parent unit, so
    // the Skinks' own rules lead and the Salamander follows.
    const lizardmen = getArmy("warmaster-revolution", "lizardmen")!;
    const skinks = lizardmen.units.find((u) => u.unitId === "lizardmen:skinks")!;
    const salamander = lizardmen.units.find((u) => u.unitId === "lizardmen:salamander")!;
    const card = buildCard(skinks, [], [salamander]);
    const rules = [...card.frontRules, ...card.backRules];
    const salamanderAt = rules.findIndex((r) => r.title === "Salamander");
    expect(salamanderAt).toBeGreaterThan(0); // not first
    expect(rules[0].title).toBeNull(); // the unit's own rules lead
  });

  it("counts an attached stand in the diagram and lays four stands out 2 x 2", () => {
    const empire = getArmy("warmaster-revolution", "empire")!;
    const halberdiers = empire.units.find((u) => u.unitId === "empire:halberdiers")!;
    const skirmishers = empire.units.find((u) => u.unitId === "empire:skirmishers")!;
    // On its own the unit is three stands in a single strip.
    expect(buildCard(halberdiers).diagram).toEqual({
      kind: "rects",
      count: 3,
      orientation: "horizontal",
    });
    // The attachment adds a stand, and four stands read as a 2 x 2 block.
    expect(buildCard(halberdiers, [], [skirmishers]).diagram).toEqual({
      kind: "rects",
      count: 4,
      orientation: "horizontal",
      grid: true,
    });
  });

  it("leaves the stand count alone for a character's mount", () => {
    const general = buildCard(unit(chaos, "General"), [], [unit(chaos, "Chaos Dragon")]);
    expect(general.diagram.kind).toBe("circle");
    expect(general.diagram.count).toBe(1);
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


