import { useEffect, useMemo, useRef, useState } from "react";
import Catalog from "./components/Catalog";
import ConfigDialog from "./components/ConfigDialog";
import ExportDialog from "./components/ExportDialog";
import InfoDialog, { type InfoTopic } from "./components/InfoDialog";
import ListRail, { InfoLinks } from "./components/ListRail";
import { HamburgerIcon, MoonIcon, SunIcon } from "./components/Icons";
import MagicItemsDialog from "./components/MagicItemsDialog";
import PrintView, {
  defaultCardPrintOptions,
  type CardPrintOptions,
  type PrintMode,
} from "./components/PrintView";
import Roster from "./components/Roster";
import { consumeShareHash, decodeShareCode } from "./domain/shareCode";
import { baseAppUrl, ruleSetIdFromPath } from "./domain/ruleSetPath";
import { getArmy, ruleSets } from "./data/gameData";
import {
  createFolder,
  deleteFolder,
  foldersForRuleSet,
  normalizeImportFolderTarget,
  moveFolder,
  moveList,
  renameFolder,
  resolveImportFolder,
  type ImportFolderTarget,
} from "./domain/folders";
import {
  addCharacter,
  addUnit,
  addUnitCopy,
  assignMagicItem,
  createList,
  removeCharacter,
  removeUnit,
  renameList,
  setAllowMercenaries,
  setNotes,
  setPointsLimit,
  toggleCharacterScouting,
  toggleCharacterUpgrade,
  toggleUnitScouting,
  toggleUnitUpgrade,
  totalPoints,
} from "./domain/lists";
import { validateList } from "./domain/validation";
import { loadFolders, saveFolders } from "./storage/folderRepository";
import {
  importFolderPreference,
  loadImportFolderPreferences,
  saveImportFolderPreferences,
} from "./storage/importFolderRepository";
import {
  deleteList,
  listsForRuleSet,
  loadLists,
  replaceAllLists,
  saveLists,
  upsertList,
} from "./storage/listRepository";
import type { Folder, SavedList } from "./types";

type Theme = "light" | "dark";
export const DEFAULT_RULE_SET_ID = "warmaster-revolution";

export function initialRuleSet(stored: string | null, routed: string | null = null): string {
  if (routed && ruleSets.some((ruleSet) => ruleSet.id === routed)) return routed;
  return ruleSets.some((ruleSet) => ruleSet.id === stored) ? stored! : DEFAULT_RULE_SET_ID;
}

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
  const [folders, setFolders] = useState<Folder[]>(() => loadFolders());
  // Mirrors `folders` so the share import, which resolves after its effect's
  // closure was captured, always reads the current folders.
  const foldersRef = useRef(folders);
  const [importFolderPreferences, setImportFolderPreferences] = useState(() =>
    loadImportFolderPreferences(),
  );
  const importFolderPreferencesRef = useRef(importFolderPreferences);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const [exportOpen, setExportOpen] = useState(false);
  const [magicItemsOpen, setMagicItemsOpen] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode | null>(null);
  const [cardPrintOptions, setCardPrintOptions] = useState<CardPrintOptions>(defaultCardPrintOptions);
  const [infoTopic, setInfoTopic] = useState<InfoTopic | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile list drawer
  const restoreGeneration = useRef(0);
  const routedRuleSet = useRef(ruleSetIdFromPath(window.location.pathname));
  // Active rule set: each set has its own saved lists. Persisted per browser.
  const [activeRuleSet, setActiveRuleSet] = useState<string>(() =>
    initialRuleSet(localStorage.getItem("warmuster.ruleSet"), routedRuleSet.current),
  );

  useEffect(() => {
    if (!routedRuleSet.current) return;
    window.history.replaceState(
      null,
      "",
      baseAppUrl(window.location.search, window.location.hash),
    );
  }, []);

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
  // Optional Scouting deployment values are a display preference and do not
  // alter saved army lists.
  const [scoutingEnabled, setScoutingEnabled] = useState<boolean>(
    () => localStorage.getItem("warmuster.scouting") === "true",
  );

  useEffect(() => {
    localStorage.setItem("warmuster.scouting", String(scoutingEnabled));
  }, [scoutingEnabled]);
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

  // The print preview lives on its own history entry, so the browser Back
  // button closes it (returning to the app) instead of leaving the site.
  const openPrint = (mode: PrintMode) => {
    window.history.pushState({ warmusterPrint: true }, "");
    setPrintMode(mode);
  };
  const closePrint = () => window.history.back();
  useEffect(() => {
    const onPop = () => setPrintMode(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Every folder write goes through here: ref, storage, then state.
  const updateFolders = (next: Folder[]) => {
    foldersRef.current = next;
    saveFolders(next);
    setFolders(next);
  };

  // Import a shared list from the URL hash on first load.
  useEffect(() => {
    const code = consumeShareHash();
    if (!code) return;
    const generation = restoreGeneration.current;
    void decodeShareCode(code).then((imported) => {
      if (!imported || generation !== restoreGeneration.current) return;
      const current = foldersRef.current;
      const target = importFolderPreference(importFolderPreferencesRef.current, imported.ruleSet);
      const { folders: next, folderId } = resolveImportFolder(current, imported.ruleSet, target);
      if (next !== current) updateFolders(next);
      setLists((prev) => upsertList(prev, { ...imported, folderId }));
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
  const visibleFolders = useMemo(
    () => foldersForRuleSet(folders, activeRuleSet),
    [folders, activeRuleSet],
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
    setMenuOpen(false); // collapse the mobile drawer to reveal the new list
  };

  const handleDelete = (id: string) => {
    setLists((prev) => deleteList(prev, id));
    if (activeListId === id) setActiveListId(null);
  };

  const handleCreateFolder = (name: string) =>
    updateFolders([...folders, createFolder(folders, activeRuleSet, name)]);

  const handleRenameFolder = (id: string, name: string) =>
    updateFolders(renameFolder(folders, id, name));

  // A folder holds its lists, so deleting it deletes them too — the rail asks
  // for confirmation, naming the count, before this runs.
  const handleDeleteFolder = (id: string) => {
    const next = deleteFolder(folders, lists, id);
    updateFolders(next.folders);
    saveLists(next.lists);
    setLists(next.lists);
    if (!next.lists.some((l) => l.id === activeListId)) setActiveListId(null);
  };

  const handleMoveList = (listId: string, folderId: string | null, index: number) => {
    const next = moveList(lists, listId, folderId, index);
    setLists(next);
    saveLists(next);
  };

  const handleMoveFolder = (folderId: string, index: number) =>
    updateFolders(moveFolder(folders, folderId, index));

  // Restoring a backup swaps in another browser's whole collection, so the
  // list open at the time is gone unless the backup happens to carry it.
  const handleReplaceAll = (importedLists: SavedList[], importedFolders: Folder[]) => {
    if (!replaceAllLists(importedLists)) return false;
    updateFolders(importedFolders);
    restoreGeneration.current += 1;
    setLists(importedLists);
    if (!importedLists.some((l) => l.id === activeListId)) setActiveListId(null);
    return true;
  };

  const handleSelectRuleSet = (id: string) => {
    if (id === activeRuleSet) return;
    setActiveRuleSet(id);
    // The active list belongs to the previous set; drop back to Home.
    setActiveListId(null);
  };

  const handleSelectImportFolder = (target: ImportFolderTarget) => {
    const next = { ...importFolderPreferencesRef.current, [activeRuleSet]: target };
    importFolderPreferencesRef.current = next;
    saveImportFolderPreferences(next);
    setImportFolderPreferences(next);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div
      className={`app-shell${simplifiedView ? " simplified" : ""}${menuOpen ? " menu-open" : ""}`}
    >
      {/* Mobile-only: hamburger opens the list drawer; points float top-right. */}
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(true)}
        aria-label="Open lists menu"
      >
        <HamburgerIcon />
      </button>
      <button
        type="button"
        className="mobile-theme-btn"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
      {activeList && army && (
        <div
          className={`mobile-points${totalPoints(activeList, army) > activeList.pointsLimit ? " over" : ""}`}
        >
          {totalPoints(activeList, army)} / {activeList.pointsLimit}
        </div>
      )}
      {menuOpen && <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="app-body">
        <ListRail
          ruleSets={ruleSets}
          activeRuleSet={activeRuleSet}
          lists={visibleLists}
          folders={visibleFolders}
          activeListId={activeListId}
          onSelect={(id) => {
            setActiveListId(id);
            setMenuOpen(false);
          }}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveList={handleMoveList}
          onMoveFolder={handleMoveFolder}
          onInfo={setInfoTopic}
          theme={theme}
          onToggleTheme={toggleTheme}
          onHome={() => {
            setActiveListId(null);
            setMenuOpen(false);
          }}
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
              onAddUnitCopy={(i) => mutate((l) => addUnitCopy(l, i))}
              onToggleUnitScouting={(i) => mutate((l) => toggleUnitScouting(l, i))}
              onToggleUnitUpgrade={(i, upgradeId) => mutate((l) => toggleUnitUpgrade(l, i, upgradeId))}
              onRemoveCharacter={(id) => mutate((l) => removeCharacter(l, id))}
              onToggleCharacterScouting={(id) => mutate((l) => toggleCharacterScouting(l, id))}
              onToggleCharacterUpgrade={(id, upgradeId) =>
                mutate((l) => toggleCharacterUpgrade(l, id, upgradeId))
              }
              onRemoveMagicItem={(itemId) => mutate((l) => assignMagicItem(l, itemId, null))}
              onRename={(name) => mutate((l) => renameList(l, name))}
              onSetPointsLimit={(pts) => mutate((l) => setPointsLimit(l, pts))}
              onSetNotes={(notes) => mutate((l) => setNotes(l, notes))}
              onSetAllowMercenaries={(allow) => mutate((l) => setAllowMercenaries(l, allow))}
              scoutingEnabled={scoutingEnabled}
            />
            <aside className="catalog-panel">
              <Catalog
                army={army}
                list={activeList}
                onAddUnit={(unitId) => mutate((l) => addUnit(l, unitId))}
                onAddCharacter={(unitId) => mutate((l) => addCharacter(l, unitId))}
                onOpenMagicItems={() => setMagicItemsOpen(true)}
                scoutingEnabled={scoutingEnabled}
              />
            </aside>
          </main>
        ) : (
          <main className="builder">
            <Home />
          </main>
        )}
      </div>

      {/* Mobile-only: the info/theme links live at the very bottom of the page
          instead of in the (now hidden) rail. */}
      <footer className="page-footer">
        <InfoLinks onInfo={setInfoTopic} theme={theme} onToggleTheme={toggleTheme} />
      </footer>

      <p className="gw-disclaimer">
        This is a fan project in no way connected to or endorsed by Games Workshop
      </p>

      {infoTopic && <InfoDialog topic={infoTopic} onClose={() => setInfoTopic(null)} />}
      {configOpen && (
        <ConfigDialog
          ruleSets={ruleSets}
          activeRuleSet={activeRuleSet}
          onSelectRuleSet={handleSelectRuleSet}
          simplifiedView={simplifiedView}
          onToggleSimplifiedView={setSimplifiedView}
          scoutingEnabled={scoutingEnabled}
          onToggleScouting={setScoutingEnabled}
          lists={lists}
          folders={folders}
          importFolderTarget={normalizeImportFolderTarget(
            folders,
            activeRuleSet,
            importFolderPreference(importFolderPreferences, activeRuleSet),
          )}
          onSelectImportFolder={handleSelectImportFolder}
          onReplaceAll={handleReplaceAll}
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
            openPrint(mode);
          }}
        />
      )}
      {printMode && activeList && army && (
        <div className="print-overlay">
          <div className="print-toolbar">
            <button type="button" className="primary-btn" onClick={() => window.print()}>
              🖨 Print
            </button>
            <button type="button" onClick={closePrint}>
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
            scoutingEnabled={scoutingEnabled}
          />
        </div>
      )}
    </div>
  );
}
