import { ruleSets } from "../data/gameData";
import { magicItems } from "../domain/magicItems";
import {
  buildCard,
  buildChartCard,
  buildMagicItemCard,
  buildSpellCard,
  type CardModel,
} from "../domain/unitCard";
import { CardSheet } from "./PrintView";

/** Every card in the game — all armies' units, spells, and all magic items —
 * rendered as printable sheets. Reached via ?gallery=cards; used by the
 * Playwright layout tests to verify that no card overflows or overlaps. */
export default function CardGallery() {
  const cards: CardModel[] = [];
  const seenSpells = new Set<string>();
  for (const ruleSet of ruleSets) {
    for (const army of ruleSet.armies) {
      const byId = new Map(army.units.map((u) => [u.unitId, u]));
      for (const unit of army.units) {
        // Upgrades (mounts, etc.) never print standalone — they merge onto
        // the card of an eligible bearer, so exercise that combined layout.
        if (unit.category === "upgrade") {
          const bearer = unit.eligibleToUpgrade.map((id) => byId.get(id)).find((u) => u != null);
          if (bearer) cards.push(buildCard(bearer, [], [unit]));
          continue;
        }
        cards.push(buildCard(unit));
        const chartCard = buildChartCard(unit);
        if (chartCard) cards.push(chartCard);
      }
      for (const spell of army.spells) {
        if (seenSpells.has(spell.name + spell.text)) continue;
        seenSpells.add(spell.name + spell.text);
        cards.push(buildSpellCard(spell));
      }
    }
  }
  // Magic items print on their bearer's card: render each item once on a
  // representative bearer (banners go on units, the rest on characters).
  const someArmy = ruleSets[0].armies[0];
  const someUnit = someArmy.units.find((u) => u.category === "unit");
  const someCharacter = someArmy.units.find((u) => u.category === "character");
  for (const item of magicItems) {
    const bearer = item.kind === "standard" ? someUnit : someCharacter;
    if (bearer) cards.push(buildCard(bearer, [item]));
    cards.push(buildMagicItemCard(item));
  }
  // Duplicate unitIds across armies are fine for React keys per page, but
  // make them unique to keep the test selectors unambiguous.
  const seen = new Map<string, number>();
  for (const card of cards) {
    const n = seen.get(card.unitId) ?? 0;
    seen.set(card.unitId, n + 1);
    if (n > 0) card.unitId = `${card.unitId}#${n}`;
  }
  return (
    <div className="print-overlay">
      <div className="print-root">
        <CardSheet cards={cards} />
      </div>
    </div>
  );
}
