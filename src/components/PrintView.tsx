import type { CSSProperties } from "react";
import type { ArmyData, SavedCharacterEntry, SavedList, SavedUnitEntry } from "../types";
import { getUnit } from "../data/gameData";
import { entryPoints, totalPoints } from "../domain/lists";
import { getMagicItem } from "../domain/magicItems";
import {
  buildCard,
  buildChartCard,
  buildMagicItemCard,
  buildSpellCard,
  splitRuleHeading,
  statColumns,
  FIT_LEVELS,
  type CardModel,
  type CardRule,
  type CardStatRow,
} from "../domain/unitCard";
import { meleeAttacksLabel, rangedAttacksLabel, signedLabel } from "./UnitStats";

export type PrintMode = "list" | "cards";

export interface CardPrintOptions {
  printMagicCards: boolean;
  includeMagicItemsOnUnits: boolean;
}

export const defaultCardPrintOptions: CardPrintOptions = {
  printMagicCards: true,
  includeMagicItemsOnUnits: true,
};

/** Full army-list printout with special rules, army rules, and spells. */
function entryExtras(army: ArmyData, entry: SavedUnitEntry | SavedCharacterEntry): string {
  return [
    ...entry.upgrades.map((id) => getUnit(army, id)?.troop),
    ...entry.magicItems.map((id) => getMagicItem(id)?.name ?? id),
  ]
    .filter(Boolean)
    .join(", ");
}

export function PrintList({ list, army }: { list: SavedList; army: ArmyData }) {
  const rows: Array<{ label: string; quantity: number; points: number; unitId: string }> = [];
  for (const entry of list.characters) {
    const unit = getUnit(army, entry.unitId);
    if (!unit) continue;
    const extras = entryExtras(army, entry);
    rows.push({
      label: extras ? `${unit.troop} (${extras})` : unit.troop,
      quantity: 1,
      points: entryPoints(army, entry, unit),
      unitId: entry.unitId,
    });
  }
  for (const entry of list.units) {
    const unit = getUnit(army, entry.unitId);
    if (!unit) continue;
    const extras = entryExtras(army, entry);
    rows.push({
      label: extras ? `${unit.troop} (${extras})` : unit.troop,
      quantity: entry.quantity,
      points: entryPoints(army, entry, unit),
      unitId: entry.unitId,
    });
  }
  const usedMagicItems = [...list.characters, ...list.units]
    .flatMap((entry) => entry.magicItems)
    .map((id) => getMagicItem(id))
    .filter((item) => item != null);

  // Rules for every distinct unit (and selected upgrade) in the list.
  const usedIds = new Set<string>();
  for (const entry of [...list.characters, ...list.units]) {
    usedIds.add(entry.unitId);
    for (const id of entry.upgrades) usedIds.add(id);
  }
  const ruleUnits = army.units.filter((u) => usedIds.has(u.unitId) && u.specials.length > 0);
  const hasWizard = [...usedIds].some((id) => getUnit(army, id)?.type === "Wizard");

  return (
    <div className="print-list">
      <header className="print-header">
        <h1>{list.name}</h1>
        <p>
          {army.name} · Warmaster Revolution {list.ruleVersion} · {totalPoints(list, army)}/
          {list.pointsLimit} pts
        </p>
      </header>
      <table className="print-table">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Unit</th>
            <th>Melee Attacks</th>
            <th>Ranged Attacks</th>
            <th>Bonus Attacks</th>
            <th>Hits</th>
            <th>Arm</th>
            <th>Cmd</th>
            <th>Spd</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const unit = getUnit(army, row.unitId);
            return (
              <tr key={i}>
                <td>{row.quantity}</td>
                <td>{row.label}</td>
                <td>{unit ? (meleeAttacksLabel(unit) ?? "-") : "-"}</td>
                <td>{unit ? (rangedAttacksLabel(unit) ?? "-") : "-"}</td>
                <td>{unit?.bonusAttacks != null ? signedLabel(unit.bonusAttacks) : "-"}</td>
                <td>{unit?.hits ?? "-"}</td>
                <td>{unit?.armour ?? "-"}</td>
                <td>{unit?.command ?? (unit?.bonusCommand != null ? signedLabel(unit.bonusCommand) : "-")}</td>
                <td>{unit?.speed != null ? `${unit.speed}cm` : "-"}</td>
                <td>{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {list.notes && <p className="print-notes">Notes: {list.notes}</p>}

      {army.armyRules.length > 0 && (
        <section>
          <h2>Army rules</h2>
          {army.armyRules.map((rule, i) => (
            <p key={i}>{rule}</p>
          ))}
        </section>
      )}

      {usedMagicItems.length > 0 && (
        <section>
          <h2>Magic items</h2>
          {usedMagicItems.map((item) => (
            <div key={item.itemId} className="print-rule">
              <h3>{item.name}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </section>
      )}

      {ruleUnits.length > 0 && (
        <section>
          <h2>Special rules</h2>
          {ruleUnits.map((unit) => (
            <div key={unit.unitId} className="print-rule">
              <h3>
                {unit.troop}
                {unit.specialName && unit.specialName !== unit.troop ? ` — ${unit.specialName}` : ""}
              </h3>
              {unit.specials.map((text, i) => {
                const rule = splitRuleHeading(text);
                return (
                  <p key={i}>
                    {rule.title && <strong>{rule.title}: </strong>}
                    {rule.text}
                  </p>
                );
              })}
            </div>
          ))}
        </section>
      )}

      {hasWizard && army.spells.length > 0 && (
        <section>
          <h2>Spells</h2>
          {army.spells.map((spell) => (
            <div key={spell.name} className="print-rule">
              <h3>
                {spell.name} — {spell.toCast} to cast, {spell.range}
              </h3>
              <p>{spell.text}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Diagram({ card }: { card: CardModel }) {
  const { diagram } = card;
  if (diagram.kind === "none") return null;
  if (diagram.kind === "circle") return <span className="diagram-circle" />;
  return (
    <span className={`diagram-rects ${diagram.orientation}${diagram.grid ? " grid" : ""}`}>
      {Array.from({ length: diagram.count }, (_, i) => (
        <span key={i} className="diagram-rect" />
      ))}
    </span>
  );
}

/** Stats in two columns: combat values left; Range/Speed/Half pace right,
 * with the rows of both columns lining up. */
function CardStats({ stats }: { stats: CardStatRow[] }) {
  const { left, right } = statColumns(stats);
  const column = (rows: CardStatRow[]) =>
    rows.map((stat) => (
      <div key={stat.label} className="card-stat">
        <span className="card-stat-label">{stat.label}:</span> {stat.value}
      </div>
    ));
  return (
    <div className="card-stats">
      <div className="card-stats-col">{column(left)}</div>
      <div className="card-stats-col">{column(right)}</div>
    </div>
  );
}

/** A rule paragraph: a magic item's name is bolded on its own line above the
 * text (card-rule uses white-space: pre-line, so the "\n" breaks the line). */
function RuleParagraph({ rule }: { rule: CardRule }) {
  return (
    <p className="card-rule">
      {rule.title != null && (
        <>
          <strong className="card-rule-name">{rule.title}</strong>
          {"\n"}
        </>
      )}
      {rule.text}
    </p>
  );
}

/** Font sizes for the card's fit level, applied as CSS variables consumed by
 * .card-rule / .card-stat / .card-name. */
function fitStyle(card: CardModel): CSSProperties {
  const fit = FIT_LEVELS[card.fitLevel];
  return {
    "--rule-pt": `${fit.rulePt}pt`,
    "--stat-pt": `${fit.statPt}pt`,
    "--stat-line": `${fit.statLineMm}mm`,
    "--name-pt": `${fit.namePt}pt`,
  } as CSSProperties;
}

function cardClass(card: CardModel): string {
  return card.compact ? "unit-card card-compact" : "unit-card";
}

export function CardFront({ card }: { card: CardModel }) {
  return (
    <div
      className={cardClass(card)}
      style={fitStyle(card)}
      data-card={card.unitId}
      data-face="front"
      data-fit={card.fitLevel}
    >
      <div className="card-head">
        <span className="card-name">{card.name}</span>
        <span className="card-type">{card.type}</span>
        <Diagram card={card} />
      </div>
      <div className="card-body">
        {card.stats.length > 0 && <CardStats stats={card.stats} />}
        {card.frontRules.map((rule, i) => (
          <RuleParagraph key={i} rule={rule} />
        ))}
        {card.backRules.length > 0 && <p className="card-continued">continued on back ↷</p>}
      </div>
    </div>
  );
}

/** Back face: rules continuation for long cards, Warmuster logo otherwise. */
export function CardBack({ card }: { card: CardModel }) {
  if (card.backRules.length === 0) {
    return (
      <div className="unit-card card-back-logo" data-card={card.unitId} data-face="back">
        <span>Warmuster</span>
      </div>
    );
  }
  return (
    <div
      className={cardClass(card)}
      style={fitStyle(card)}
      data-card={card.unitId}
      data-face="back"
      data-fit={card.fitLevel}
    >
      <div className="card-head card-head-back">
        <span className="card-name-back">{card.name}</span>
        <span className="card-type">continued</span>
      </div>
      <div className="card-body">
        {card.backRules.map((rule, i) => (
          <RuleParagraph key={i} rule={rule} />
        ))}
      </div>
    </div>
  );
}

/** 3 x 3 cards per A4 page. */
export const CARDS_PER_PAGE = 9;

export function paginate<T>(items: T[], perPage: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages;
}

/** Cards for one list: one card per distinct unit/character variant, plus
 * optional spell cards. Mounts/upgrades stay on their unit; assigned magic
 * items either stay there too or become standalone cards, depending on the
 * selected print options. */
export function listCards(
  list: SavedList,
  army: ArmyData,
  options: CardPrintOptions = defaultCardPrintOptions,
): CardModel[] {
  const cards: CardModel[] = [];
  const seen = new Set<string>();
  const push = (unitId: string, itemIds: string[] = [], upgradeIds: string[] = []) => {
    const unit = getUnit(army, unitId);
    if (!unit) return;
    const items = itemIds
      .map((id) => getMagicItem(id))
      .filter((item) => item != null)
      .sort((a, b) => a.itemId.localeCompare(b.itemId));
    const upgrades = upgradeIds
      .map((id) => getUnit(army, id))
      .filter((u) => u != null)
      .sort((a, b) => a.unitId.localeCompare(b.unitId));
    const card = buildCard(unit, options.includeMagicItemsOnUnits ? items : [], upgrades);
    if (seen.has(card.unitId)) return;
    seen.add(card.unitId);
    cards.push(card);
    // Units with a roll chart (the Giants) get a second, two-sided chart card.
    const chartCard = buildChartCard(unit);
    if (chartCard && !seen.has(chartCard.unitId)) {
      seen.add(chartCard.unitId);
      cards.push(chartCard);
    }
  };
  for (const entry of [...list.characters, ...list.units]) {
    push(entry.unitId, entry.magicItems, entry.upgrades);
  }
  const hasWizard = [...list.characters, ...list.units].some(
    (entry) => getUnit(army, entry.unitId)?.type === "Wizard",
  );
  const itemCards: CardModel[] = [];
  if (!options.includeMagicItemsOnUnits) {
    const seenItems = new Set<string>();
    for (const entry of [...list.characters, ...list.units]) {
      const bearer = getUnit(army, entry.unitId);
      for (const id of entry.magicItems) {
        if (seenItems.has(id)) continue;
        const item = getMagicItem(id);
        if (!item) continue;
        seenItems.add(id);
        itemCards.push(buildMagicItemCard(item, bearer));
      }
    }
  }
  const magicCards = options.printMagicCards && hasWizard
    ? army.spells.map((spell) => buildSpellCard(spell))
    : [];
  return [...cards, ...itemCards, ...magicCards];
}

/** Unit-card sheet paginated for double-sided printing: each front page is
 * followed by a back page whose columns are mirrored (via direction: rtl in
 * CSS), so printing double-sided with "flip on long edge" lines each back up
 * with its front. */
export function CardSheet({ cards }: { cards: CardModel[] }) {
  const pages = paginate(cards, CARDS_PER_PAGE);
  return (
    <div className="card-sheet">
      {pages.map((page, i) => (
        <div key={i} className="card-page-pair">
          <div className="card-page" data-page={`front-${i}`}>
            {page.map((card) => (
              <CardFront key={card.unitId} card={card} />
            ))}
          </div>
          <div className="card-page card-page-back" data-page={`back-${i}`}>
            {page.map((card) => (
              <CardBack key={card.unitId} card={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PrintView({
  mode,
  list,
  army,
  duplexOffsetMm = 0,
  cardOptions = defaultCardPrintOptions,
}: {
  mode: PrintMode;
  list: SavedList;
  army: ArmyData;
  /** Horizontal nudge for the back pages (mm, positive = right) to calibrate
   * out the printer's front/back registration offset in duplex printing. */
  duplexOffsetMm?: number;
  cardOptions?: CardPrintOptions;
}) {
  return (
    <div
      className="print-root"
      style={{ "--duplex-offset": `${duplexOffsetMm}mm` } as CSSProperties}
    >
      {mode === "list" ? (
        <PrintList list={list} army={army} />
      ) : (
        <CardSheet cards={listCards(list, army, cardOptions)} />
      )}
    </div>
  );
}
