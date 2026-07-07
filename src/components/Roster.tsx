import type { ArmyData, SavedCharacterEntry, SavedList, SavedUnitEntry, ValidationIssue } from "../types";
import { getUnit, upgradesFor } from "../data/gameData";
import { entryPoints, totalPoints } from "../domain/lists";
import SpecialRules from "./SpecialRules";
import UnitStats from "./UnitStats";

interface RosterProps {
  army: ArmyData;
  list: SavedList;
  issues: ValidationIssue[];
  onRemoveUnit: (entryIndex: number) => void;
  onAddUnit: (unitId: string) => void;
  onToggleUnitUpgrade: (entryIndex: number, upgradeId: string) => void;
  onRemoveCharacter: (id: string) => void;
  onToggleCharacterUpgrade: (id: string, upgradeId: string) => void;
  onRename: (name: string) => void;
  onSetPointsLimit: (points: number) => void;
  onSetNotes: (notes: string) => void;
}

function UpgradePicker({
  army,
  ownerUnitId,
  selected,
  onToggle,
}: {
  army: ArmyData;
  ownerUnitId: string;
  selected: string[];
  onToggle: (upgradeId: string) => void;
}) {
  const available = upgradesFor(army, ownerUnitId);
  if (available.length === 0 && selected.length === 0) return null;
  // Include selected-but-ineligible upgrades so they can be removed.
  const extras = selected
    .filter((id) => !available.some((u) => u.unitId === id))
    .map((id) => getUnit(army, id))
    .filter((u) => u != null);
  return (
    <span className="upgrade-picker">
      {[...available, ...extras].map((upgrade) => {
        const active = selected.includes(upgrade.unitId);
        return (
          <button
            key={upgrade.unitId}
            type="button"
            className={`upgrade-chip${active ? " active" : ""}`}
            onClick={() => onToggle(upgrade.unitId)}
            title={`${upgrade.troop} (${upgrade.upgradePoints != null ? `+${upgrade.upgradePoints}` : upgrade.points} pts)`}
          >
            {active ? "Selected: " : ""}
            {upgrade.troop}
          </button>
        );
      })}
    </span>
  );
}

function RosterUnitRow({
  army,
  entry,
  index,
  onRemove,
  onAdd,
  onToggleUpgrade,
}: {
  army: ArmyData;
  entry: SavedUnitEntry;
  index: number;
  onRemove: () => void;
  onAdd: () => void;
  onToggleUpgrade: (upgradeId: string) => void;
}) {
  const unit = getUnit(army, entry.unitId);
  if (!unit) {
    return (
      <li className="roster-row missing">
        <span>{entry.unitId} (not in this army data)</span>
        <button type="button" className="icon-btn" onClick={onRemove} title="Remove">
          ✕
        </button>
      </li>
    );
  }
  return (
    <li className="roster-row">
      <div className="roster-main">
        <div className="roster-name-line">
          <span className="roster-qty">{entry.quantity}×</span>
          <span className="roster-name">{unit.troop}</span>
          <span className="catalog-type">{unit.type}</span>
          <SpecialRules unit={unit} />
          <UpgradePicker
            army={army}
            ownerUnitId={entry.unitId}
            selected={entry.upgrades}
            onToggle={onToggleUpgrade}
          />
        </div>
        <div className="roster-stat-line">
          <UnitStats unit={unit} />
        </div>
      </div>
      <div className="roster-side">
        <div className="roster-summary">
          {unit.unitSize != null && (
            <span className="roster-models">{entry.quantity * unit.unitSize} Models</span>
          )}
          <span className="roster-points">{entryPoints(army, entry, unit)} pts</span>
        </div>
        <span className="qty-controls">
          <button type="button" className="icon-btn" onClick={onRemove} title="Remove one">
            −
          </button>
          <button type="button" className="icon-btn" onClick={onAdd} title="Add one">
            +
          </button>
        </span>
      </div>
    </li>
  );
}

function RosterCharacterRow({
  army,
  entry,
  onRemove,
  onToggleUpgrade,
}: {
  army: ArmyData;
  entry: SavedCharacterEntry;
  onRemove: () => void;
  onToggleUpgrade: (upgradeId: string) => void;
}) {
  const unit = getUnit(army, entry.unitId);
  if (!unit) {
    return (
      <li className="roster-row missing">
        <span>{entry.unitId} (not in this army data)</span>
        <button type="button" className="icon-btn" onClick={onRemove} title="Remove">
          ✕
        </button>
      </li>
    );
  }
  return (
    <li className="roster-row">
      <div className="roster-main">
        <div className="roster-name-line">
          <span className="roster-name">{unit.troop}</span>
          <span className="catalog-type">{unit.type}</span>
          <SpecialRules unit={unit} />
          <UpgradePicker
            army={army}
            ownerUnitId={entry.unitId}
            selected={entry.upgrades}
            onToggle={onToggleUpgrade}
          />
        </div>
        <div className="roster-stat-line">
          <UnitStats unit={unit} />
        </div>
      </div>
      <div className="roster-side">
        <span className="roster-points">{entryPoints(army, entry, unit)} pts</span>
        <button type="button" className="icon-btn" onClick={onRemove} title="Remove">
          ✕
        </button>
      </div>
    </li>
  );
}

export default function Roster({
  army,
  list,
  issues,
  onRemoveUnit,
  onAddUnit,
  onToggleUnitUpgrade,
  onRemoveCharacter,
  onToggleCharacterUpgrade,
  onRename,
  onSetPointsLimit,
  onSetNotes,
}: RosterProps) {
  const points = totalPoints(list, army);
  const over = points > list.pointsLimit;
  return (
    <div className="roster">
      <div className="roster-header">
        <input
          className="list-name-input"
          value={list.name}
          onChange={(e) => onRename(e.target.value)}
          aria-label="List name"
        />
        <span className="roster-army-name">{army.name}</span>
        <label className="points-limit">
          <input
            type="number"
            min={500}
            step={500}
            value={list.pointsLimit}
            onChange={(e) => onSetPointsLimit(Number(e.target.value) || 0)}
            aria-label="Points limit"
          />{" "}
          pts
        </label>
        <span className={`points-total${over ? " over" : ""}`}>
          {points} / {list.pointsLimit}
        </span>
      </div>

      {issues.length > 0 && (
        <ul className="validation-panel" aria-label="Validation issues">
          {issues.map((issue, i) => (
            <li key={i} className={`issue ${issue.severity}`}>
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      <h3 className="panel-heading">Characters</h3>
      {list.characters.length === 0 && <p className="panel-hint">No characters yet — every army needs a General.</p>}
      <ul className="roster-list">
        {list.characters.map((entry) => (
          <RosterCharacterRow
            key={entry.id}
            army={army}
            entry={entry}
            onRemove={() => onRemoveCharacter(entry.id)}
            onToggleUpgrade={(upgradeId) => onToggleCharacterUpgrade(entry.id, upgradeId)}
          />
        ))}
      </ul>

      <h3 className="panel-heading">Units</h3>
      {list.units.length === 0 && <p className="panel-hint">Add units from the catalog.</p>}
      <ul className="roster-list">
        {list.units.map((entry, index) => (
          <RosterUnitRow
            key={`${entry.unitId}-${index}`}
            army={army}
            entry={entry}
            index={index}
            onRemove={() => onRemoveUnit(index)}
            onAdd={() => onAddUnit(entry.unitId)}
            onToggleUpgrade={(upgradeId) => onToggleUnitUpgrade(index, upgradeId)}
          />
        ))}
      </ul>

      <h3 className="panel-heading">Notes</h3>
      <textarea
        className="notes-input"
        value={list.notes ?? ""}
        placeholder="Optional notes for this list…"
        onChange={(e) => onSetNotes(e.target.value)}
        rows={2}
      />
    </div>
  );
}
