import { useEffect, useMemo, useState } from "react";
import Catalog from "./components/Catalog";
import ConfigDialog from "./components/ConfigDialog";
import ExportDialog from "./components/ExportDialog";
import InfoDialog, { type InfoTopic } from "./components/InfoDialog";
import ListRail from "./components/ListRail";
import MagicItemsDialog from "./components/MagicItemsDialog";
import PrintView, {
  defaultCardPrintOptions,
  type CardPrintOptions,
  type PrintMode,
} from "./components/PrintView";
import Roster from "./components/Roster";
import { consumeShareHash, decodeShareCode } from "./domain/shareCode";
import { getArmy, ruleSets } from "./data/gameData";
import {
  addCharacter,
  addUnit,
  assignMagicItem,
  createList,
  removeCharacter,
  removeUnit,
  renameList,
  setNotes,
  setPointsLimit,
  toggleCharacterUpgrade,
  toggleUnitUpgrade,
} from "./domain/lists";
import { validateList } from "./domain/validation";
import { deleteList, listsForRuleSet, loadLists, upsertList } from "./storage/listRepository";
import type { SavedList } from "./types";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  const stored = localStorage.getItem("warmuster.theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function Home() {
  return (
    <div className="home">
      <h2 className="home-title">Muster your army</h2>
      <p>
        Warmuster is a list builder for <strong>Warmaster Revolution</strong>. Pick an army, add
        units, and your list is saved automatically in this browser — nothing leaves your device.
      </p>
      <p>Create a new list or pick an existing one from the left to get started.</p>
    </div>
  );
}

export default function App() {
  const [lists, setLists] = useState<SavedList[]>(() => loadLists());
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const [exportOpen, setExportOpen] = useState(false);
  const [magicItemsOpen, setMagicItemsOpen] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode | null>(null);
  const [cardPrintOptions, setCardPrintOptions] = useState<CardPrintOptions>(defaultCardPrintOptions);
  const [infoTopic, setInfoTopic] = useState<InfoTopic | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  // Active rule set: each set has its own saved lists. Persisted per browser.
  const [activeRuleSet, setActiveRuleSet] = useState<string>(() => {
    const stored = localStorage.getItem("warmuster.ruleSet");
    return ruleSets.some((rs) => rs.id === stored) ? stored! : ruleSets[0].id;
  });

  useEffect(() => {
    localStorage.setItem("warmuster.ruleSet", activeRuleSet);
  }, [activeRuleSet]);

  // Simplified view hides unit stat lines on the builder page. Persisted.
  const [simplifiedView, setSimplifiedView] = useState<boolean>(
    () => localStorage.getItem("warmuster.simplifiedView") === "true",
  );

  useEffect(() => {
    localStorage.setItem("warmuster.simplifiedView", String(simplifiedView));
  }, [simplifiedView]);
  // Duplex calibration (mm): shifts printed card backs right (+) or left (-)
  // to line up with the fronts on this printer. Saved per browser; defaults
  // to 1mm right until the user calibrates.
  const [duplexOffset, setDuplexOffset] = useState<number>(() => {
    const raw = localStorage.getItem("warmuster.duplexOffset");
    if (raw == null || raw === "") return 1;
    const stored = Number(raw);
    return Number.isFinite(stored) ? stored : 1;
  });

  useEffect(() => {
    localStorage.setItem("warmuster.duplexOffset", String(duplexOffset));
  }, [duplexOffset]);

  // Import a shared list from the URL hash on first load.
  useEffect(() => {
    const code = consumeShareHash();
    if (!code) return;
    void decodeShareCode(code).then((imported) => {
      if (!imported) return;
      setLists((prev) => upsertList(prev, imported));
      // Show the set the imported list belongs to so it's visible in the rail.
      if (ruleSets.some((rs) => rs.id === imported.ruleSet)) setActiveRuleSet(imported.ruleSet);
      setActiveListId(imported.id);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("warmuster.theme", theme);
  }, [theme]);

  const activeList = lists.find((l) => l.id === activeListId) ?? null;
  const army = activeList ? getArmy(activeList.ruleSet, activeList.army) : null;
  const visibleLists = useMemo(
    () => listsForRuleSet(lists, activeRuleSet),
    [lists, activeRuleSet],
  );

  const issues = useMemo(
    () => (activeList && army ? validateList(activeList, army) : []),
    [activeList, army],
  );

  // Every mutation goes through here: state update + localStorage auto-save.
  // The mutation is applied to the freshest copy of the list inside the state
  // updater so rapid consecutive updates never work from a stale snapshot.
  const mutate = (fn: (list: SavedList) => SavedList) => {
    const id = activeListId;
    if (!id) return;
    setLists((prev) => {
      const current = prev.find((l) => l.id === id);
      return current ? upsertList(prev, fn(current)) : prev;
    });
  };

  const handleCreate = (armyId: string, name: string, pointsLimit: number) => {
    const ruleSet = ruleSets.find((rs) => rs.id === activeRuleSet);
    if (!ruleSet) return;
    const list = createList(ruleSet.id, ruleSet.version, armyId, name, pointsLimit);
    setLists((prev) => upsertList(prev, list));
    setActiveListId(list.id);
  };

  const handleDelete = (id: string) => {
    setLists((prev) => deleteList(prev, id));
    if (activeListId === id) setActiveListId(null);
  };

  const handleSelectRuleSet = (id: string) => {
    if (id === activeRuleSet) return;
    setActiveRuleSet(id);
    // The active list belongs to the previous set; drop back to Home.
    setActiveListId(null);
  };

  return (
    <div className={`app-shell${simplifiedView ? " simplified" : ""}`}>

      <div className="app-body">
        <ListRail
          ruleSets={ruleSets}
          activeRuleSet={activeRuleSet}
          lists={visibleLists}
          activeListId={activeListId}
          onSelect={setActiveListId}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onInfo={setInfoTopic}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onHome={() => setActiveListId(null)}
          onExport={() => setExportOpen(true)}
          onOpenConfig={() => setConfigOpen(true)}
          canExport={activeList != null}
        />
        {activeList && army ? (
          <main className="builder">
            <Roster
              army={army}
              list={activeList}
              issues={issues}
              onRemoveUnit={(i) => mutate((l) => removeUnit(l, i))}
              onAddUnit={(unitId) => mutate((l) => addUnit(l, unitId))}
              onToggleUnitUpgrade={(i, upgradeId) => mutate((l) => toggleUnitUpgrade(l, i, upgradeId))}
              onRemoveCharacter={(id) => mutate((l) => removeCharacter(l, id))}
              onToggleCharacterUpgrade={(id, upgradeId) =>
                mutate((l) => toggleCharacterUpgrade(l, id, upgradeId))
              }
              onRemoveMagicItem={(itemId) => mutate((l) => assignMagicItem(l, itemId, null))}
              onRename={(name) => mutate((l) => renameList(l, name))}
              onSetPointsLimit={(pts) => mutate((l) => setPointsLimit(l, pts))}
              onSetNotes={(notes) => mutate((l) => setNotes(l, notes))}
            />
            <aside className="catalog-panel">
              <Catalog
                army={army}
                list={activeList}
                onAddUnit={(unitId) => mutate((l) => addUnit(l, unitId))}
                onAddCharacter={(unitId) => mutate((l) => addCharacter(l, unitId))}
                onOpenMagicItems={() => setMagicItemsOpen(true)}
              />
            </aside>
          </main>
        ) : (
          <main className="builder">
            <Home />
          </main>
        )}
      </div>
      {infoTopic && <InfoDialog topic={infoTopic} onClose={() => setInfoTopic(null)} />}
      {configOpen && (
        <ConfigDialog
          ruleSets={ruleSets}
          activeRuleSet={activeRuleSet}
          onSelectRuleSet={handleSelectRuleSet}
          simplifiedView={simplifiedView}
          onToggleSimplifiedView={setSimplifiedView}
          onClose={() => setConfigOpen(false)}
        />
      )}
      {magicItemsOpen && activeList && army && (
        <MagicItemsDialog
          army={army}
          list={activeList}
          onAssign={(itemId, target) => mutate((l) => assignMagicItem(l, itemId, target))}
          onClose={() => setMagicItemsOpen(false)}
        />
      )}
      {exportOpen && activeList && army && (
        <ExportDialog
          list={activeList}
          army={army}
          onClose={() => setExportOpen(false)}
          onPrint={(mode) => {
            setExportOpen(false);
            setPrintMode(mode);
          }}
        />
      )}
      {printMode && activeList && army && (
        <div className="print-overlay">
          <div className="print-toolbar">
            <button type="button" className="primary-btn" onClick={() => window.print()}>
              🖨 Print
            </button>
            <button type="button" onClick={() => setPrintMode(null)}>
              Close preview
            </button>
            {printMode === "cards" && (
              <div className="card-print-options">
                <label>
                  <input
                    type="checkbox"
                    checked={cardPrintOptions.printMagicCards}
                    onChange={(event) =>
                      setCardPrintOptions((current) => ({
                        ...current,
                        printMagicCards: event.target.checked,
                      }))
                    }
                  />
                  Print magic cards
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={cardPrintOptions.includeMagicItemsOnUnits}
                    onChange={(event) =>
                      setCardPrintOptions((current) => ({
                        ...current,
                        includeMagicItemsOnUnits: event.target.checked,
                      }))
                    }
                  />
                  Include magic items on units
                </label>
                <label
                  className="duplex-offset"
                  title="If the backs print slightly off to one side, nudge them here: positive moves the back side right."
                >
                  Back-side offset
                  <input
                    type="number"
                    step={0.25}
                    min={-5}
                    max={5}
                    value={duplexOffset}
                    onChange={(e) => setDuplexOffset(Number(e.target.value) || 0)}
                  />
                  mm
                </label>
              </div>
            )}
          </div>
          <PrintView
            mode={printMode}
            list={activeList}
            army={army}
            duplexOffsetMm={printMode === "cards" ? duplexOffset : 0}
            cardOptions={cardPrintOptions}
          />
        </div>
      )}
    </div>
  );
}


