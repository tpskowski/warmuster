import type { SavedList } from "../types";
import { createId } from "./lists";

// Share links carry the whole list in the URL hash — there is no server to
// look anything up on. Only stable IDs and the rule version are stored;
// stats and points are re-resolved from current app data on import.
//
// Wire format: "#list=WMR1." + base64url(deflate-raw(JSON)) when the
// platform can compress, otherwise "#list=WMR0." + base64url(JSON).

export const SHARE_HASH_PARAM = "list";
const COMPRESSED_PREFIX = "WMR1.";
const PLAIN_PREFIX = "WMR0.";
const PAYLOAD_KIND = "warmuster/list";

interface SharePayload {
  kind: typeof PAYLOAD_KIND;
  schemaVersion: 1;
  ruleSet: string;
  ruleVersion: string;
  army: string;
  name: string;
  pointsLimit: number;
  units: SavedList["units"];
  characters: Array<{ unitId: string; upgrades: string[] }>;
  notes: string | null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipeThrough(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const readable = source.pipeThrough(stream);
  return new Uint8Array(await new Response(readable as ReadableStream).arrayBuffer());
}

export async function encodeShareCode(list: SavedList): Promise<string> {
  const payload: SharePayload = {
    kind: PAYLOAD_KIND,
    schemaVersion: 1,
    ruleSet: list.ruleSet,
    ruleVersion: list.ruleVersion,
    army: list.army,
    name: list.name,
    pointsLimit: list.pointsLimit,
    units: list.units,
    characters: list.characters.map((c) => ({ unitId: c.unitId, upgrades: c.upgrades })),
    notes: list.notes,
  };
  const json = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream !== "undefined") {
    const compressed = await pipeThrough(json, new CompressionStream("deflate-raw"));
    return COMPRESSED_PREFIX + toBase64Url(compressed);
  }
  return PLAIN_PREFIX + toBase64Url(json);
}

export async function decodeShareCode(code: string): Promise<SavedList | null> {
  try {
    let json: Uint8Array;
    if (code.startsWith(COMPRESSED_PREFIX)) {
      json = await pipeThrough(
        fromBase64Url(code.slice(COMPRESSED_PREFIX.length)),
        new DecompressionStream("deflate-raw"),
      );
    } else if (code.startsWith(PLAIN_PREFIX)) {
      json = fromBase64Url(code.slice(PLAIN_PREFIX.length));
    } else {
      return null;
    }
    const payload = JSON.parse(new TextDecoder().decode(json)) as SharePayload;
    if (payload.kind !== PAYLOAD_KIND || payload.schemaVersion !== 1) return null;
    return {
      id: createId("list"),
      schemaVersion: 1,
      ruleSet: payload.ruleSet,
      ruleVersion: payload.ruleVersion,
      army: payload.army,
      name: payload.name,
      pointsLimit: payload.pointsLimit,
      units: (payload.units ?? []).map((u) => ({
        unitId: String(u.unitId),
        quantity: Math.max(1, Number(u.quantity) || 1),
        upgrades: Array.isArray(u.upgrades) ? u.upgrades.map(String) : [],
      })),
      characters: (payload.characters ?? []).map((c) => ({
        id: createId("character"),
        unitId: String(c.unitId),
        upgrades: Array.isArray(c.upgrades) ? c.upgrades.map(String) : [],
      })),
      notes: payload.notes ?? null,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function buildShareUrl(list: SavedList): Promise<string> {
  const code = await encodeShareCode(list);
  const base = `${location.origin}${location.pathname}`;
  return `${base}#${SHARE_HASH_PARAM}=${code}`;
}

/** Extracts and clears a share code from the current URL hash, if present. */
export function consumeShareHash(): string | null {
  const match = location.hash.match(new RegExp(`^#${SHARE_HASH_PARAM}=(.+)$`));
  if (!match) return null;
  history.replaceState(null, "", location.pathname + location.search);
  return match[1];
}
