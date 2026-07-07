import type { ArmyData, SavedList, UnitData } from "../types";
import { countOf } from "../domain/lists";
import SpecialRules from "./SpecialRules";
import UnitStats, { minMaxLabel, pointsLabel, signedLabel } from "./UnitStats";

interface CatalogProps {
  army: ArmyData;
  list: SavedList;
  onAddUnit: (unitId: string) => void;
  onAddCharacter: (unitId: string) => void;
}

function CatalogRow({
  unit,
  count,
  scale,
  onAdd,
}: {
  unit: UnitData;
  count: number;
  scale: number;
  onAdd?: () => void;
}) {
  const isGeneral = unit.type === "General";
  const max = unit.max != null ? (isGeneral ? unit.max : unit.max * scale) : null;

  const atMax = max != null && count >= max;

  return (
    <li className={`catalog-row${atMax ? " at-max" : ""}`}>
      <div className="catalog-main">
        <div className="catalog-name-line">
          <span className="catalog-name">{unit.troop}</span>
          <span className="catalog-type">{unit.type}</span>
          <SpecialRules unit={unit} />
        </div>
        <div className="catalog-stat-line">
          <UnitStats unit={unit} />
          <span className="stat">
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

export default function Catalog({ army, list, onAddUnit, onAddCharacter }: CatalogProps) {
  const scale = Math.max(1, Math.floor(list.pointsLimit / 1000));
  const units = army.units.filter((u) => u.category === "unit");
  const characters = army.units.filter((u) => u.category === "character");
  const upgrades = army.units.filter((u) => u.category === "upgrade");

  return (
    <div className="catalog">
      <h3 className="panel-heading">Units</h3>
      <ul className="catalog-list">
        {units.map((unit) => (
          <CatalogRow
            key={unit.unitId}
            unit={unit}
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
              <CatalogRow key={unit.unitId} unit={unit} count={0} scale={scale} />
            ))}
          </ul>
        </>
      )}
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
            <>
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
            </>
          )}
        </>
      )}
    </div>
  );
}

