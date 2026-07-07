import type { ArmyData, SavedCharacterEntry, SavedList, SavedUnitEntry, SpellData } from "../types";
import { getUnit } from "../data/gameData";
import { entryPoints, totalPoints } from "../domain/lists";
import { getMagicItem, type MagicItemData } from "../domain/magicItems";
import { buildCard, type CardModel } from "../domain/unitCard";
import { meleeAttacksLabel, rangedAttacksLabel, signedLabel } from "./UnitStats";

export type PrintMode = "list" | "cards";

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
              {unit.specials.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
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
    <span className={`diagram-rects ${diagram.orientation}`}>
      {Array.from({ length: diagram.count }, (_, i) => (
        <span key={i} className="diagram-rect" />
      ))}
    </span>
  );
}

function UnitCard({ card }: { card: CardModel }) {
  return (
    <div className={`unit-card fit-${card.fitLevel}`}>
      <div className="card-head">
        <span className="card-name">{card.name}</span>
        <span className="card-type">{card.type}</span>
        <Diagram card={card} />
      </div>
      <div className="card-body">
        <div className="card-stats">
          {card.stats.map((stat) => (
            <div key={stat.label} className="card-stat">
              <span className="card-stat-label">{stat.label}:</span> {stat.value}
            </div>
          ))}
        </div>
        {card.rules.map((rule, i) => (
          <p key={i} className="card-rule">
            {rule}
          </p>
        ))}
      </div>
    </div>
  );
}

function SpellCard({ spell }: { spell: SpellData }) {
  return (
    <div className="unit-card spell-card fit-0">
      <div className="card-head">
        <span className="card-name">{spell.name}</span>
        <span className="card-type">Spell</span>
      </div>
      <div className="card-body">
        <div className="card-stats">
          <div className="card-stat">
            <span className="card-stat-label">To cast:</span> {spell.toCast}
          </div>
          <div className="card-stat">
            <span className="card-stat-label">Range:</span> {spell.range}
          </div>
        </div>
        <p className="card-rule">{spell.text}</p>
      </div>
    </div>
  );
}

function MagicItemCard({ item, bearer }: { item: MagicItemData; bearer: string | null }) {
  return (
    <div className="unit-card spell-card fit-0">
      <div className="card-head">
        <span className="card-name">{item.name}</span>
        <span className="card-type">Magic item</span>
      </div>
      <div className="card-body">
        {bearer && (
          <div className="card-stats">
            <div className="card-stat">
              <span className="card-stat-label">Carried by:</span> {bearer}
            </div>
          </div>
        )}
        <p className="card-rule">{item.text}</p>
      </div>
    </div>
  );
}

/** Unit-card sheet: one card per distinct unit/character/upgrade in the list,
 * plus cards for assigned magic items and spells when the list includes a
 * wizard. */
export function CardSheet({ list, army }: { list: SavedList; army: ArmyData }) {
  const usedIds: string[] = [];
  const push = (id: string) => {
    if (!usedIds.includes(id)) usedIds.push(id);
  };
  const itemCards: Array<{ item: MagicItemData; bearer: string | null }> = [];
  for (const entry of [...list.characters, ...list.units]) {
    push(entry.unitId);
    for (const id of entry.upgrades) push(id);
    for (const id of entry.magicItems) {
      const item = getMagicItem(id);
      if (item && !itemCards.some((c) => c.item.itemId === id)) {
        itemCards.push({ item, bearer: getUnit(army, entry.unitId)?.troop ?? null });
      }
    }
  }
  const cards = usedIds
    .map((id) => getUnit(army, id))
    .filter((u) => u != null)
    .map((u) => buildCard(u));
  const hasWizard = usedIds.some((id) => getUnit(army, id)?.type === "Wizard");
  return (
    <div className="card-sheet">
      {cards.map((card) => (
        <UnitCard key={card.unitId} card={card} />
      ))}
      {itemCards.map(({ item, bearer }) => (
        <MagicItemCard key={item.itemId} item={item} bearer={bearer} />
      ))}
      {hasWizard && army.spells.map((spell) => <SpellCard key={spell.name} spell={spell} />)}
    </div>
  );
}

export default function PrintView({
  mode,
  list,
  army,
}: {
  mode: PrintMode;
  list: SavedList;
  army: ArmyData;
}) {
  return (
    <div className="print-root">
      {mode === "list" ? <PrintList list={list} army={army} /> : <CardSheet list={list} army={army} />}
    </div>
  );
}

