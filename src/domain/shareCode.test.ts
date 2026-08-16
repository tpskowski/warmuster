import { describe, expect, it } from "vitest";
import {
  addCharacter,
  addUnit,
  createList,
  toggleCharacterScouting,
  toggleCharacterUpgrade,
  toggleUnitScouting,
} from "./lists";
import { decodeShareCode, encodeShareCode } from "./shareCode";

describe("share codes", () => {
  it("round-trips a list through encode/decode", async () => {
    let list = createList("warmaster-revolution", "2.2.6", "chaos", "Doom Host", 2000);
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    list = addCharacter(list, "chaos:general");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "chaos:chaos-dragon");
    list = toggleUnitScouting(list, 0);
    list = toggleCharacterScouting(list, list.characters[0].id);
    list = { ...list, notes: "bring dice" };

    const code = await encodeShareCode(list);
    expect(code).toMatch(/^WMR[01]\./);

    const decoded = await decodeShareCode(code);
    expect(decoded).not.toBeNull();
    expect(decoded!.id).not.toBe(list.id); // imported copy gets a fresh id
    expect(decoded!.army).toBe("chaos");
    expect(decoded!.pointsLimit).toBe(2000);
    expect(decoded!.units).toEqual(list.units);
    expect(decoded!.characters[0].unitId).toBe("chaos:general");
    expect(decoded!.characters[0].upgrades).toEqual(["chaos:chaos-dragon"]);
    expect(decoded!.characters[0].scoutingCommitted).toBe(true);
    expect(decoded!.notes).toBe("bring dice");
  });

  it("rejects garbage", async () => {
    expect(await decodeShareCode("nonsense")).toBeNull();
    expect(await decodeShareCode("WMR1.!!!!")).toBeNull();
    expect(await decodeShareCode("WMR0." + btoa(JSON.stringify({ kind: "other" })))).toBeNull();
  });
});
