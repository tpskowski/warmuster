import { useEffect, useRef, useState } from "react";
import { cardRules } from "../domain/unitCard";
import type { UnitData } from "../types";
import { minMaxLabel, pointsLabel, signedLabel, unitStatRows } from "./UnitStats";
import { FacingIcon } from "./Icons";

/** Full unit data and rules, opened from the compact info button on each row. */
export default function SpecialRules({ unit }: { unit: UnitData }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const rules = cardRules(unit);
  const subtitle = unit.subType ? `${unit.type} (${unit.subType})` : unit.type;
  const stats = [
    ...unitStatRows(unit),
    ...(unit.halfPace != null ? [{ label: "Half pace", value: `${unit.halfPace}cm` }] : []),
    ...(unit.unitSize != null ? [{ label: "Unit size", value: String(unit.unitSize) }] : []),
    ...(unit.unitSizeModifier != null
      ? [{ label: "Size modifier", value: signedLabel(unit.unitSizeModifier) }]
      : []),
    { label: "Min / Max", value: minMaxLabel(unit) },
    { label: unit.upgradePoints != null ? "Upgrade points" : "Points", value: pointsLabel(unit) },
  ];

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="special-wrap" ref={ref}>
      <button
        type="button"
        className={`special-badge${open ? " open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`View details for ${unit.troop}`}
        title={`View details for ${unit.troop}`}
      >
        i
      </button>
      {open && (
        <div className="modal-backdrop unit-rules-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal unit-rules-modal"
            role="dialog"
            aria-label={`${unit.troop} details`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2>{unit.troop}</h2>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} title="Close">
                x
              </button>
            </div>
            <p className="unit-rules-subtitle">{subtitle}</p>
            <dl className="unit-detail-stats">
              {unit.facing != null && (
                <div>
                  <dt>Facing</dt>
                  <dd><FacingIcon facing={unit.facing} /></dd>
                </div>
              )}
              {stats.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="info-body unit-detail-rules">
              <h3>Rules</h3>
              {rules.length > 0 ? (
                rules.map((text, index) => <p key={index}>{text}</p>)
              ) : (
                <p>No special rules listed for this unit.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
