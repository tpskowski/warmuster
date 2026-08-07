import { useEffect, useState } from "react";
import type { ArmyData, SavedCharacterEntry, SavedList, SavedUnitEntry, UnitData, ValidationIssue } from "../types";
import { getUnit, upgradesFor } from "../data/gameData";
import { isHired } from "../data/mercenaries";
import { armySizeMultiplier } from "../domain/armySize";
import { hiredCount } from "../domain/hiring";
import { breakPoint, entryPoints, entryStands, totalPoints } from "../domain/lists";
import { getMagicItem, magicItemCost, type MagicItemData } from "../domain/magicItems";
import SpecialRules, { UnitDetailsDialog } from "./SpecialRules";
import UnitStats from "./UnitStats";

interface RosterProps {
  army: ArmyData;
  list: SavedList;
  issues: ValidationIssue[];
  onRemoveUnit: (entryIndex: number) => void;
  onAddUnitCopy: (entryIndex: number) => void;
  onToggleUnitUpgrade: (entryIndex: number, upgradeId: string) => void;
  onRemoveCharacter: (id: string) => void;
  onToggleCharacterUpgrade: (id: string, upgradeId: string) => void;
  onRemoveMagicItem: (itemId: string) => void;
  onRename: (name: string) => void;
  onSetPointsLimit: (points: number) => void;
  onSetNotes: (notes: string) => void;
  onSetAllowMercenaries: (allow: boolean) => void;
}

function UpgradePicker({
  army,
  ownerUnitId,
  scale,
  selected,
  onToggle,
}: {
  army: ArmyData;
  ownerUnitId: string;
  scale: number;
  selected: string[];
  onToggle: (upgradeId: string) => void;
}) {
  const [detail, setDetail] = useState<UnitData | null>(null);
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
        const points = `${upgrade.upgradePoints != null ? `+${upgrade.upgradePoints}` : upgrade.points} pts`;
        // A selected pill opens the upgrade's rules; its × button removes it.
        if (selected.includes(upgrade.unitId)) {
          return (
            <span key={upgrade.unitId} className="chip-group">
              <button
                type="button"
                className="upgrade-chip active"
                onClick={() => setDetail(upgrade)}
                title={`${upgrade.troop} (${points}) — view rules`}
              >
                {upgrade.troop}
              </button>
              <button
                type="button"
                className="upgrade-chip active chip-x"
                onClick={() => onToggle(upgrade.unitId)}
                title={`Remove ${upgrade.troop}`}
                aria-label={`Remove ${upgrade.troop}`}
              >
                ✕
              </button>
            </span>
          );
        }
        return (
          <button
            key={upgrade.unitId}
            type="button"
            className="upgrade-chip"
            onClick={() => onToggle(upgrade.unitId)}
            title={`Add ${upgrade.troop} (${points})`}
          >
            {upgrade.troop}
          </button>
        );
      })}
      {detail && (
        <UnitDetailsDialog unit={detail} scale={scale} onClose={() => setDetail(null)} />
      )}
    </span>
  );
}

/** Modal with a magic item's cost and rules, opened from its roster pill. */
function MagicItemDetailsDialog({
  item,
  bearer,
  onClose,
}: {
  item: MagicItemData;
  bearer: UnitData | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop unit-rules-backdrop" onClick={onClose}>
      <div
        className="modal unit-rules-modal"
        role="dialog"
        aria-label={`${item.name} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{item.name}</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            x
          </button>
        </div>
        <p className="unit-rules-subtitle">
          Magic item · {magicItemCost(item.itemId, bearer)} pts
          {item.restriction ? ` · ${item.restriction}` : ""}
        </p>
        <div className="info-body unit-detail-rules">
          <h3>Rules</h3>
          <p>{item.text}</p>
        </div>
      </div>
    </div>
  );
}

function MagicItemChips({
  army,
  entry,
  onRemove,
}: {
  army: ArmyData;
  entry: SavedUnitEntry | SavedCharacterEntry;
  onRemove: (itemId: string) => void;
}) {
  const [detail, setDetail] = useState<MagicItemData | null>(null);
  if (entry.magicItems.length === 0) return null;
  const unit = getUnit(army, entry.unitId);
  return (
    <span className="upgrade-picker">
      {entry.magicItems.map((itemId) => {
        const item = getMagicItem(itemId);
        const name = item?.name ?? itemId;
        return (
          <span key={itemId} className="chip-group">
            <button
              type="button"
              className="upgrade-chip active magic-chip"
              onClick={() => item && setDetail(item)}
              title={`${name} (+${magicItemCost(itemId, unit)} pts) — view rules`}
            >
              {name}
            </button>
            <button
              type="button"
              className="upgrade-chip active magic-chip chip-x"
              onClick={() => onRemove(itemId)}
              title={`Remove ${name}`}
              aria-label={`Remove ${name}`}
            >
              ✕
            </button>
          </span>
        );
      })}
      {detail && (
        <MagicItemDetailsDialog item={detail} bearer={unit} onClose={() => setDetail(null)} />
      )}
    </span>
  );
}

function RosterUnitRow({
  army,
  entry,
  index,
  scale,
  onRemove,
  onAdd,
  onToggleUpgrade,
  onRemoveMagicItem,
}: {
  army: ArmyData;
  entry: SavedUnitEntry;
  index: number;
  scale: number;
  onRemove: () => void;
  onAdd: () => void;
  onToggleUpgrade: (upgradeId: string) => void;
  onRemoveMagicItem: (itemId: string) => void;
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
  const stands = entryStands(army, entry, unit);
  return (
    <li className="roster-row">
      <div className="roster-main">
        <div className="roster-name-line">
          <span className="roster-qty">{entry.quantity}×</span>
          <span className="roster-name">{unit.troop}</span>
          <span className="catalog-type">{unit.type}</span>
          {isHired(unit, army) && (
            <span className="hired-badge" title="Hired Regiment of Renown">
              Hired
            </span>
          )}
          <SpecialRules unit={unit} scale={scale} />
          <UpgradePicker
            army={army}
            ownerUnitId={entry.unitId}
            scale={scale}
            selected={entry.upgrades}
            onToggle={onToggleUpgrade}
          />
          <MagicItemChips army={army} entry={entry} onRemove={onRemoveMagicItem} />
        </div>
        <div className="roster-stat-line">
          <UnitStats unit={unit} />
        </div>
      </div>
      <div className="roster-side">
        <div className="roster-summary">
          {stands != null && (
            <span className="roster-models">{entry.quantity * stands} Stands</span>
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
  scale,
  onRemove,
  onToggleUpgrade,
  onRemoveMagicItem,
}: {
  army: ArmyData;
  entry: SavedCharacterEntry;
  scale: number;
  onRemove: () => void;
  onToggleUpgrade: (upgradeId: string) => void;
  onRemoveMagicItem: (itemId: string) => void;
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
          {isHired(unit, army) && (
            <span className="hired-badge" title="Hired Regiment of Renown">
              Hired
            </span>
          )}
          <SpecialRules unit={unit} scale={scale} />
          <UpgradePicker
            army={army}
            ownerUnitId={entry.unitId}
            scale={scale}
            selected={entry.upgrades}
            onToggle={onToggleUpgrade}
          />
          <MagicItemChips army={army} entry={entry} onRemove={onRemoveMagicItem} />
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
  onAddUnitCopy,
  onToggleUnitUpgrade,
  onRemoveCharacter,
  onToggleCharacterUpgrade,
  onRemoveMagicItem,
  onRename,
  onSetPointsLimit,
  onSetNotes,
  onSetAllowMercenaries,
}: RosterProps) {
  const points = totalPoints(list, army);
  const over = points > list.pointsLimit;
  const scale = armySizeMultiplier(list.pointsLimit);
  // Regiments of Renown are hired into another army, so the switch is offered
  // on every list except one built from the regiments themselves. It cannot be
  // turned off while regiments are still in the list.
  const canHire = army.army !== "regiments-of-renown";
  const hired = hiredCount(list, army);
  return (
    <div className="roster">
      <div className="roster-header">
        <input
          className="list-name-input"
          value={list.name}
          onChange={(e) => onRename(e.target.value)}
          aria-label="List name"
        />
        <span className="break-point" title="Half the army's non-character units, rounded up">
          Breakpoint: <strong>{breakPoint(list)}</strong>
        </span>
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
        {canHire && (
          <label
            className="mercenaries-toggle"
            title={
              hired > 0
                ? "Remove the hired regiments first."
                : "Offer Regiments of Renown for hire in the catalog."
            }
          >
            <input
              type="checkbox"
              checked={list.allowMercenaries === true}
              disabled={hired > 0}
              onChange={(e) => onSetAllowMercenaries(e.target.checked)}
            />
            Mercenaries
          </label>
        )}
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
            scale={scale}
            onRemove={() => onRemoveCharacter(entry.id)}
            onToggleUpgrade={(upgradeId) => onToggleCharacterUpgrade(entry.id, upgradeId)}
            onRemoveMagicItem={onRemoveMagicItem}
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
            scale={scale}
            onRemove={() => onRemoveUnit(index)}
            onAdd={() => onAddUnitCopy(index)}
            onToggleUpgrade={(upgradeId) => onToggleUnitUpgrade(index, upgradeId)}
            onRemoveMagicItem={onRemoveMagicItem}
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
