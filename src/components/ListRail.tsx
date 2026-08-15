import { useMemo, useState, type DragEvent } from "react";
import type { Folder, RuleSetInfo, SavedList } from "../types";
import { listsInFolder, topLevelLists } from "../domain/folders";
import { FEEDBACK_URL, type InfoTopic } from "./InfoDialog";
import { ExportIcon, FolderIcon, GearIcon, MoonIcon, PencilIcon, SunIcon } from "./Icons";

interface ListRailProps {
  ruleSets: RuleSetInfo[];
  activeRuleSet: string;
  lists: SavedList[];
  folders: Folder[];
  activeListId: string | null;
  onSelect: (id: string) => void;
  onCreate: (armyId: string, name: string, pointsLimit: number) => void;
  onDelete: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  /** Move a list into `folderId` (null = top level) at the given slot. */
  onMoveList: (listId: string, folderId: string | null, index: number) => void;
  onMoveFolder: (folderId: string, index: number) => void;
  onInfo: (topic: InfoTopic) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onHome: () => void;
  onExport: () => void;
  onOpenConfig: () => void;
  canExport: boolean;
}

/** What the pointer is currently carrying. */
type DragItem = { kind: "list" | "folder"; id: string };

/** Where it would land: a slot between two of a folder's lists, a slot
 * between two folders, or inside a folder (appended to its lists). */
type DropSpot =
  | { kind: "lists"; folderId: string | null; index: number }
  | { kind: "folders"; index: number }
  | { kind: "into"; folderId: string };

/** Appending to a folder: clamped down to the sibling count by the move. */
const APPEND = Number.MAX_SAFE_INTEGER;

/** The info/theme links shown in the rail footer (desktop) and the page
 * footer (mobile). */
export function InfoLinks({
  onInfo,
  theme,
  onToggleTheme,
}: {
  onInfo: (topic: InfoTopic) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <>
      <div className="rail-footer-row">
        <button type="button" onClick={() => onInfo("privacy")}>
          Privacy
        </button>
        <button type="button" onClick={() => onInfo("changelog")}>
          Changelog
        </button>
        <button type="button" onClick={() => onInfo("roadmap")}>
          Roadmap
        </button>
      </div>
      <div className="rail-footer-row">
        <button type="button" onClick={() => onInfo("credits")}>
          Credits
        </button>
        <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" aria-label="Feedback, opens external form">
          Feedback {"->"}
        </a>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </>
  );
}

export function armyDisplayName(list: SavedList, ruleSets: RuleSetInfo[]): string {
  const army = ruleSets
    .find((ruleSet) => ruleSet.id === list.ruleSet)
    ?.armies.find((candidate) => candidate.army === list.army);
  if (army) return army.name;
  return list.army
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function classes(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

export default function ListRail({
  ruleSets,
  activeRuleSet,
  lists,
  folders,
  activeListId,
  onSelect,
  onCreate,
  onDelete,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveList,
  onMoveFolder,
  onInfo,
  theme,
  onToggleTheme,
  onHome,
  onExport,
  onOpenConfig,
  canExport,
}: ListRailProps) {
  const [creating, setCreating] = useState(false);
  const [armyId, setArmyId] = useState("");
  const [pointsLimit, setPointsLimit] = useState(2000);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  /** The folder whose name is being edited in place, and the name so far. */
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [dropSpot, setDropSpot] = useState<DropSpot | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedList | null>(null);
  const [pendingFolderDelete, setPendingFolderDelete] = useState<Folder | null>(null);

  // New lists are created under the active rule set (chosen in Configuration).
  const ruleSet = ruleSets.find((rs) => rs.id === activeRuleSet) ?? ruleSets[0];
  const armies = useMemo(
    () => [...(ruleSet?.armies ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [ruleSet],
  );
  const rootLists = useMemo(
    () => topLevelLists(lists, activeRuleSet, folders),
    [lists, activeRuleSet, folders],
  );

  const create = () => {
    if (!ruleSet || !armyId) return;
    const armyName = ruleSet.armies.find((a) => a.army === armyId)?.name ?? armyId;
    onCreate(armyId, `${armyName} ${pointsLimit}`, pointsLimit);
    setCreating(false);
    setArmyId("");
  };

  const createFolder = () => {
    if (folderName.trim() === "") return;
    onCreateFolder(folderName);
    setFolderName("");
    setCreatingFolder(false);
  };

  const commitRename = () => {
    if (renaming && renaming.name.trim() !== "") onRenameFolder(renaming.id, renaming.name);
    setRenaming(null);
  };

  const toggleFolder = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const endDrag = () => {
    setDrag(null);
    setDropSpot(null);
  };

  const startDrag = (event: DragEvent, item: DragItem) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
    setDrag(item);
  };

  /** True when the pointer is past the midpoint of the row it is over, i.e.
   * the drop belongs after that row rather than before it. */
  const isAfter = (event: DragEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY > rect.top + rect.height / 2;
  };

  // Claim the drag for this element: the innermost target wins, so a row
  // inside a folder places precisely instead of dropping into the folder.
  const over = (event: DragEvent, spot: DropSpot) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropSpot(spot);
  };

  const drop = (event: DragEvent, spot: DropSpot) => {
    event.preventDefault();
    event.stopPropagation();
    if (drag?.kind === "list") {
      if (spot.kind === "into") onMoveList(drag.id, spot.folderId, APPEND);
      else if (spot.kind === "lists") onMoveList(drag.id, spot.folderId, spot.index);
    } else if (drag?.kind === "folder" && spot.kind === "folders") {
      onMoveFolder(drag.id, spot.index);
    }
    endDrag();
  };

  const listSlot = (folderId: string | null, index: number): boolean =>
    dropSpot?.kind === "lists" && dropSpot.folderId === folderId && dropSpot.index === index;

  const listRow = (list: SavedList, index: number, folderId: string | null, last: boolean) => {
    const spot = (event: DragEvent): DropSpot => ({
      kind: "lists",
      folderId,
      index: isAfter(event) ? index + 1 : index,
    });
    return (
      <li
        key={list.id}
        className={classes(
          list.id === activeListId && "active",
          drag?.kind === "list" && drag.id === list.id && "dragging",
          drag?.kind === "list" && listSlot(folderId, index) && "drop-before",
          drag?.kind === "list" && last && listSlot(folderId, index + 1) && "drop-after",
        )}
        draggable
        onDragStart={(event) => startDrag(event, { kind: "list", id: list.id })}
        onDragEnd={endDrag}
        onDragOver={(event) => {
          if (drag?.kind === "list") over(event, spot(event));
        }}
        onDrop={(event) => {
          if (drag?.kind === "list") drop(event, spot(event));
        }}
      >
        <button type="button" className="rail-list-btn" onClick={() => onSelect(list.id)}>
          <span className="rail-list-name">{list.name}</span>
          <span className="rail-list-meta">
            {armyDisplayName(list, ruleSets)} / {list.pointsLimit} pts
          </span>
        </button>
        <button
          type="button"
          className="icon-btn rail-row-action rail-delete"
          title={`Delete ${list.name}`}
          onClick={() => setPendingDelete(list)}
          aria-label={`Delete ${list.name}`}
        >
          x
        </button>
      </li>
    );
  };

  return (
    <nav className="list-rail" aria-label="Saved army lists">
      <div className="rail-scroll">
        <div className="rail-brand-row">
          <button type="button" className="app-title" onClick={onHome}>Warmuster</button>
          <div className="rail-brand-actions">
            <button
              type="button"
              className="toolbar-icon-btn"
              onClick={onExport}
              disabled={!canExport}
              aria-label="Export current list"
              title="Export current list"
            >
              <ExportIcon />
            </button>
            <button
              type="button"
              className="toolbar-icon-btn"
              onClick={onOpenConfig}
              aria-label="Configuration"
              title="Configuration"
            >
              <GearIcon />
            </button>
          </div>
        </div>

        <ul className="rail-folders">
          {folders.map((folder, index) => {
            const folderLists = listsInFolder(lists, activeRuleSet, folder.id);
            const open = !collapsed.has(folder.id);
            const spot = (event: DragEvent): DropSpot =>
              drag?.kind === "folder"
                ? { kind: "folders", index: isAfter(event) ? index + 1 : index }
                : { kind: "into", folderId: folder.id };
            return (
              <li
                key={folder.id}
                className={classes(
                  "rail-folder",
                  drag?.kind === "folder" && drag.id === folder.id && "dragging",
                  dropSpot?.kind === "into" && dropSpot.folderId === folder.id && "drop-into",
                  drag?.kind === "folder" &&
                    dropSpot?.kind === "folders" &&
                    dropSpot.index === index &&
                    "drop-before",
                  drag?.kind === "folder" &&
                    index === folders.length - 1 &&
                    dropSpot?.kind === "folders" &&
                    dropSpot.index === index + 1 &&
                    "drop-after",
                )}
                // Anywhere in the folder that isn't a list row takes the list
                // into this folder; the row below handles folder reordering.
                onDragOver={(event) => {
                  if (drag?.kind === "list") over(event, { kind: "into", folderId: folder.id });
                }}
                onDrop={(event) => {
                  if (drag?.kind === "list") drop(event, { kind: "into", folderId: folder.id });
                }}
              >
                <div
                  className="rail-folder-row"
                  // Dragging is suspended while the name is being edited, so
                  // selecting text in the box doesn't start a drag instead.
                  draggable={renaming?.id !== folder.id}
                  onDragStart={(event) => startDrag(event, { kind: "folder", id: folder.id })}
                  onDragEnd={endDrag}
                  onDragOver={(event) => {
                    if (drag) over(event, spot(event));
                  }}
                  onDrop={(event) => {
                    if (drag) drop(event, spot(event));
                  }}
                >
                  {renaming?.id === folder.id ? (
                    <input
                      type="text"
                      className="rail-folder-rename"
                      value={renaming.name}
                      autoFocus
                      aria-label={`Rename folder ${folder.name}`}
                      onChange={(event) => setRenaming({ id: folder.id, name: event.target.value })}
                      onBlur={commitRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename();
                        if (event.key === "Escape") setRenaming(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="rail-folder-toggle"
                      onClick={() => toggleFolder(folder.id)}
                      onDoubleClick={() => setRenaming({ id: folder.id, name: folder.name })}
                      aria-expanded={open}
                      title={open ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
                    >
                      <span className={classes("rail-caret", open && "open")} aria-hidden="true" />
                      <FolderIcon aria-hidden="true" />
                      <span className="rail-folder-name">{folder.name}</span>
                      <span className="rail-folder-count">{folderLists.length}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn rail-row-action"
                    title={`Rename folder ${folder.name}`}
                    onClick={() => setRenaming({ id: folder.id, name: folder.name })}
                    aria-label={`Rename folder ${folder.name}`}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-btn rail-row-action rail-delete"
                    title={`Delete folder ${folder.name}`}
                    onClick={() => setPendingFolderDelete(folder)}
                    aria-label={`Delete folder ${folder.name}`}
                  >
                    x
                  </button>
                </div>
                {open && (
                  <ul className="rail-lists rail-folder-lists">
                    {folderLists.length === 0 ? (
                      <li className="rail-folder-empty">Drop lists here</li>
                    ) : (
                      folderLists.map((list, i) =>
                        listRow(list, i, folder.id, i === folderLists.length - 1),
                      )
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <ul
          className={classes(
            "rail-lists",
            "rail-root-lists",
            drag?.kind === "list" && listSlot(null, rootLists.length) && "drop-at-end",
          )}
          // The empty space below the lists drops at the top level.
          onDragOver={(event) => {
            if (drag?.kind === "list") over(event, { kind: "lists", folderId: null, index: rootLists.length });
          }}
          onDrop={(event) => {
            if (drag?.kind === "list") drop(event, { kind: "lists", folderId: null, index: rootLists.length });
          }}
        >
          {rootLists.map((list, i) => listRow(list, i, null, i === rootLists.length - 1))}
        </ul>

        {creating ? (
          <div className="rail-create">
            <select value={armyId} onChange={(e) => setArmyId(e.target.value)} aria-label="Army">
              <option value="">Choose an army...</option>
              {armies.map((army) => (
                <option key={army.army} value={army.army}>
                  {army.name}
                </option>
              ))}
            </select>
            <select
              value={pointsLimit}
              onChange={(e) => setPointsLimit(Number(e.target.value))}
              aria-label="Points"
            >
              {[500, 1000, 1500, 2000, 2500, 3000].map((pts) => (
                <option key={pts} value={pts}>
                  {pts} pts
                </option>
              ))}
            </select>
            <div className="rail-create-actions">
              <button type="button" className="primary-btn" onClick={create} disabled={!armyId}>
                Create
              </button>
              <button type="button" onClick={() => setCreating(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : creatingFolder ? (
          <div className="rail-create">
            <input
              type="text"
              value={folderName}
              autoFocus
              placeholder="Folder name"
              aria-label="Folder name"
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createFolder();
                if (e.key === "Escape") setCreatingFolder(false);
              }}
            />
            <div className="rail-create-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={createFolder}
                disabled={folderName.trim() === ""}
              >
                Create
              </button>
              <button type="button" onClick={() => setCreatingFolder(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rail-new-actions">
            <button
              type="button"
              className="primary-btn rail-new"
              onClick={() => {
                setCreating(true);
                setArmyId(armies[0]?.army ?? "");
              }}
            >
              New list
            </button>
            <button
              type="button"
              className="rail-new-folder"
              onClick={() => {
                setFolderName("");
                setCreatingFolder(true);
              }}
            >
              New folder
            </button>
          </div>
        )}
      </div>
      <footer className="rail-footer">
        <InfoLinks onInfo={onInfo} theme={theme} onToggleTheme={onToggleTheme} />
      </footer>
      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
          <div
            className="modal confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-list-title"
            aria-describedby="delete-list-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="delete-list-title">Delete list?</h2>
            </div>
            <p id="delete-list-description">
              <strong>{pendingDelete.name}</strong> will be permanently removed from this browser.
            </p>
            <div className="confirm-actions">
              <button type="button" onClick={() => setPendingDelete(null)}>Cancel</button>
              <button
                type="button"
                className="danger-btn"
                autoFocus
                onClick={() => {
                  onDelete(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Delete list
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingFolderDelete && (
        <div className="modal-backdrop" onClick={() => setPendingFolderDelete(null)}>
          <div
            className="modal confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-folder-title"
            aria-describedby="delete-folder-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="delete-folder-title">Delete folder?</h2>
            </div>
            <p id="delete-folder-description">
              {(() => {
                const count = listsInFolder(lists, activeRuleSet, pendingFolderDelete.id).length;
                return (
                  <>
                    <strong>{pendingFolderDelete.name}</strong>{" "}
                    {count === 0 ? (
                      <>is empty and will be removed from this browser.</>
                    ) : (
                      <>
                        holds {count} list{count === 1 ? "" : "s"}.{" "}
                        <strong>
                          Deleting the folder permanently deletes {count === 1 ? "that list" : "those lists"} too.
                        </strong>{" "}
                        Drag {count === 1 ? "it" : "them"} out of the folder first to keep{" "}
                        {count === 1 ? "it" : "them"}.
                      </>
                    )}
                  </>
                );
              })()}
            </p>
            <div className="confirm-actions">
              <button type="button" onClick={() => setPendingFolderDelete(null)}>Cancel</button>
              <button
                type="button"
                className="danger-btn"
                autoFocus
                onClick={() => {
                  onDeleteFolder(pendingFolderDelete.id);
                  setPendingFolderDelete(null);
                }}
              >
                Delete folder and lists
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
