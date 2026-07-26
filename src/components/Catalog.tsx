import type { ArmyData, SavedList, UnitData } from "../types";
import { hireableFor, isHired } from "../data/mercenaries";
import { armySizeMultiplier } from "../domain/armySize";
import { hiredCount, hireLimit, resolveCountsAs } from "../domain/hiring";
import { countOf } from "../domain/lists";
import SpecialRules from "./SpecialRules";
import UnitStats, { minMaxLabel, pointsLabel, signedLabel } from "./UnitStats";

interface CatalogProps {
  army: ArmyData;
  list: SavedList;
  onAddUnit: (unitId: string) => void;
  onAddCharacter: (unitId: string) => void;
  onOpenMagicItems: () => void;
}

function CatalogRow({
  unit,
  army,
  count,
  scale,
  onAdd,
}: {
  unit: UnitData;
  army: ArmyData;
  count: number;
  scale: number;
  onAdd?: () => void;
}) {
  const isGeneral = unit.type === "General";
  const max = unit.max != null ? (isGeneral ? unit.max : unit.max * scale) : null;

  const atMax = max != null && count >= max;
  // What hiring this regiment will cost the army's own allowances. Only
  // meaningful when it is being hired into someone else's list.
  const hireSlots = isHired(unit, army) ? resolveCountsAs(unit, army) : [];
  // A unit that may stand in for another (Dogs of War Handgunners for
  // Crossbowmen) says so here, so the option is visible while choosing rather
  // than only once a minimum fails.
  const standsInFor = unit.substitutesFor
    ? army.units.find((u) => u.unitId === unit.substitutesFor!.unitId)
    : undefined;
  const perThousand = unit.substitutesFor?.perThousand;

  return (
    <li className={`catalog-row${atMax ? " at-max" : ""}`}>
      <div className="catalog-main">
        <div className="catalog-name-line">
          <span className="catalog-name">{unit.troop}</span>
          <span className="catalog-type">{unit.type}</span>
          <SpecialRules unit={unit} scale={scale} />
          {standsInFor && (
            <span
              className="counts-as"
              title={
                perThousand == null
                  ? `Any number may be taken in place of ${standsInFor.troop}, counting toward its Min/Max.`
                  : `${perThousand * scale} of these may be taken in place of ${standsInFor.troop} at ${scale * 1000} pts, counting toward its Min/Max.`
              }
            >
              Counts as {standsInFor.troop}
            </span>
          )}
          {hireSlots.map((slot) => (
            <span
              key={slot.unitIds.join("|")}
              className="counts-as"
              title={`Hiring this regiment uses up one ${slot.label} slot in your own army list.`}
            >
              Uses a {slot.label} slot
            </span>
          ))}
        </div>
        <div className="catalog-stat-line">
          <UnitStats unit={unit} />
          <span className="stat catalog-size">
            <span className="stat-label">Size</span>{" "}
            {unit.unitSizeModifier != null
              ? signedLabel(unit.unitSizeModifier)
              : (unit.unitSize ?? "-")}
          </span>
          <span className="stat">
            <span className="stat-label">Min/Max</span> {minMaxLabel(unit, scale)}
          </span>
        </div>
      </div>
      <div className="catalog-side">
        <span className="catalog-points">{pointsLabel(unit)} pts</span>
        {onAdd && (
          <button
            type="button"
            className="add-btn"
            onClick={onAdd}
            title={atMax ? "Already at maximum (you can still add it)" : `Add ${unit.troop}`}
          >
            Add
          </button>
        )}

      </div>
    </li>
  );
}

export default function Catalog({
  army,
  list,
  onAddUnit,
  onAddCharacter,
  onOpenMagicItems,
}: CatalogProps) {
  const assignedMagicItems = [...list.units, ...list.characters].reduce(
    (sum, entry) => sum + entry.magicItems.length,
    0,
  );
  const scale = armySizeMultiplier(list.pointsLimit);
  // Regiments of Renown live in every army's data so hired ones resolve, but
  // they are offered only from their own section, and only when the list has
  // mercenaries switched on. In a Regiments of Renown army list they are the
  // army, so nothing is held back.
  const own = army.units.filter((u) => !isHired(u, army));
  const units = own.filter((u) => u.category === "unit");
  const characters = own.filter((u) => u.category === "character");
  const upgrades = own.filter((u) => u.category === "upgrade");
  const regiments = list.allowMercenaries ? hireableFor(army) : [];
  const hired = hiredCount(list, army);
  const limit = hireLimit(list);

  return (
    <div className="catalog">
      <h3 className="panel-heading">Units</h3>
      {units.length === 0 && (
        <p className="panel-hint">No units in this army.</p>
      )}
      <ul className="catalog-list">
        {units.map((unit) => (
          <CatalogRow
            key={unit.unitId}
            unit={unit}
            army={army}
            count={countOf(list, unit.unitId)}
            scale={scale}
            onAdd={() => onAddUnit(unit.unitId)}
          />
        ))}
      </ul>
      <h3 className="panel-heading">Characters</h3>
      <ul className="catalog-list">
        {characters.map((unit) => (
          <CatalogRow
            key={unit.unitId}
            unit={unit}
            army={army}
            count={countOf(list, unit.unitId)}
            scale={scale}
            onAdd={() => onAddCharacter(unit.unitId)}
          />
        ))}
      </ul>
      {upgrades.length > 0 && (
        <>
          <h3 className="panel-heading">Mounts &amp; upgrades</h3>
          <p className="panel-hint">Added from a unit or character already in your list.</p>
          <ul className="catalog-list">
            {upgrades.map((unit) => (
              <CatalogRow key={unit.unitId} unit={unit} army={army} count={0} scale={scale} />
            ))}
          </ul>
        </>
      )}
      {regiments.length > 0 && (
        <>
          <h3 className="panel-heading">
            Regiments of Renown{" "}
            <span className={`hire-count${hired > limit ? " over" : ""}`}>
              {hired} of {limit} hired
            </span>
          </h3>
          <p className="panel-hint">
            Mercenaries for hire — one per full 1000 points, one of each per army, and no magic
            items. Each uses up an allowance in your own list.
          </p>
          <ul className="catalog-list">
            {regiments.map((unit) => (
              <CatalogRow
                key={unit.unitId}
                unit={unit}
                army={army}
                count={countOf(list, unit.unitId)}
                scale={scale}
                onAdd={() =>
                  unit.category === "character"
                    ? onAddCharacter(unit.unitId)
                    : onAddUnit(unit.unitId)
                }
              />
            ))}
          </ul>
        </>
      )}
      <h3 className="panel-heading">Magic items</h3>
      <p className="panel-hint">Banners, weapons and devices of power for units and characters.</p>
      <button type="button" className="add-btn magic-items-btn" onClick={onOpenMagicItems}>
        Assign magic items{assignedMagicItems > 0 ? ` (${assignedMagicItems} taken)` : ""}
      </button>
      {(army.armyRules.length > 0 || army.spells.length > 0) && (
        <>
          {army.armyRules.length > 0 && (
            <>
              <h3 className="panel-heading">Army rules</h3>
              {army.armyRules.map((rule, i) => (
                <p key={i} className="army-rule-text">
                  {rule}
                </p>
              ))}
            </>
          )}
          {army.spells.length > 0 && (
            <section className="catalog-spells">
              <h3 className="panel-heading">Spells</h3>
              <ul className="spell-list">
                {army.spells.map((spell) => (
                  <li key={spell.name} className="spell-row">
                    <div className="spell-head">
                      <strong>{spell.name}</strong>
                      <span className="spell-meta">
                        {spell.toCast} to cast · {spell.range}
                      </span>
                    </div>
                    <p className="spell-text">{spell.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

