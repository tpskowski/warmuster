export const RULE_SET_ENTRY_PATHS = {
  "/WMR": "warmaster-revolution",
  "/WMR-2026-playtest": "wmr-2026-playtest",
  "/A-Matter-of-Mustaches": "warmaster-custom",
} as const;

/** Resolve a direct-entry path case-insensitively, with an optional trailing slash. */
export function ruleSetIdFromPath(pathname: string): string | null {
  const normalized = (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname).toLowerCase();
  const match = Object.entries(RULE_SET_ENTRY_PATHS).find(
    ([path]) => path.toLowerCase() === normalized,
  );
  return match?.[1] ?? null;
}

/** Return to the app root without discarding a query string or share hash. */
export function baseAppUrl(search = "", hash = ""): string {
  return `/${search}${hash}`;
}
