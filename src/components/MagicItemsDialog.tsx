import { useEffect } from "react";
import type { ArmyData, SavedList } from "../types";
import { getUnit } from "../data/gameData";
import { magicItemBearer, type MagicItemTarget } from "../domain/lists";
import {
  canBearMagicItem,
  magicItemCost,
  magicItems,
  type MagicItemData,
  type MagicItemKind,
} from "../domain/magicItems";

interface MagicItemsDialogProps {
  army: ArmyData;
  list: SavedList;
  onAssign: (itemId: string, target: MagicItemTarget | null) => void;
  onClose: () => void;
}

const SECTIONS: Array<{ kind: MagicItemKind; title: string; hint: string }> = [
  {
    kind: "standard",
    title: "Magic standards",
    hint: "Carried by an infantry, cavalry or chariot unit. Cost depends on the unit's profile.",
  },
  {
    kind: "weapon",
    title: "Magic weapons",
    hint: "Carried by an infantry, cavalry or chariot unit, or by a character.",
  },
  {
    kind: "device",
    title: "Devices of power",
    hint: "Carried by characters only.",
  },
];

function targetKey(target: MagicItemTarget | null): string {
  if (!target) return "";
  return target.kind === "unit" ? `unit:${target.index}` : `char:${target.id}`;
}

function parseTargetKey(key: string): MagicItemTarget | null {
  if (key.startsWith("unit:")) return { kind: "unit", index: Number(key.slice(5)) };
  if (key.startsWith("char:")) return { kind: "character", id: key.slice(5) };
  return null;
}

function ItemRow({
  army,
  list,
  item,
  onAssign,
}: {
  army: ArmyData;
  list: SavedList;
  item: MagicItemData;
  onAssign: (itemId: string, target: MagicItemTarget | null) => void;
}) {
  const bearer = magicItemBearer(list, item.itemId);
  const bearerKey = targetKey(bearer);

  const options: Array<{ key: string; label: string }> = [];
  list.characters.forEach((entry) => {
    const unit = getUnit(army, entry.unitId);
    if (!unit) return;
    const key = `char:${entry.id}`;
    // A bearer can carry only one item; hide anyone already carrying another.
    if (entry.magicItems.length > 0 && key !== bearerKey) return;
    if (canBearMagicItem(item, unit, army) || key === bearerKey) {
      const current = key === bearerKey ? " (current)" : "";
      options.push({
        key,
        label: `${unit.troop} — ${magicItemCost(item.itemId, unit)} pts${current}`,
      });
    }
  });
  list.units.forEach((entry, index) => {
    const unit = getUnit(army, entry.unitId);
    if (!unit) return;
    const key = `unit:${index}`;
    // Single entries carrying another item are full; a merged stack is fine
    // because assigning splits a fresh unit off it.
    if (entry.quantity === 1 && entry.magicItems.length > 0 && key !== bearerKey) return;
    if (canBearMagicItem(item, unit, army) || key === bearerKey) {
      const extras = entry.upgrades
        .map((id) => getUnit(army, id)?.troop)
        .filter(Boolean)
        .join(", ");
      const current = key === bearerKey ? " (current)" : "";
      options.push({
        key,
        label: `${unit.troop}${extras ? ` [${extras}]` : ""} — ${magicItemCost(item.itemId, unit)} pts${current}`,
      });
    }
  });

  return (
    <li className="magic-item-row">
      <div className="magic-item-main">
        <div className="magic-item-head">
          <strong>{item.name}</strong>
          <span className="magic-item-meta">
            {item.costLabel}
            {item.restriction ? ` · ${item.restriction}` : ""}
          </span>
        </div>
        <p className="magic-item-text">{item.text}</p>
      </div>
      <select
        className="magic-item-select"
        value={bearerKey}
        onChange={(e) => onAssign(item.itemId, parseTargetKey(e.target.value))}
        aria-label={`Assign ${item.name}`}
        disabled={options.length === 0 && bearerKey === ""}
      >
        <option value="">{options.length === 0 ? "No eligible bearer in list" : "Not taken"}</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </li>
  );
}

export default function MagicItemsDialog({ army, list, onAssign, onClose }: MagicItemsDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal magic-items-modal"
        role="dialog"
        aria-label="Magic items"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Magic items</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            x
          </button>
        </div>
        <p className="panel-hint">
          A unit or character can carry one magic item, and each item may appear in the army only
          once. Assigning an item to a merged stack splits one unit out with the item.
        </p>
        {SECTIONS.map((section) => {
          const items = magicItems.filter((item) => item.kind === section.kind);
          return (
            <section key={section.kind}>
              <h3 className="panel-heading">{section.title}</h3>
              <p className="panel-hint">{section.hint}</p>
              <ul className="magic-item-list">
                {items.map((item) => (
                  <ItemRow key={item.itemId} army={army} list={list} item={item} onAssign={onAssign} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
