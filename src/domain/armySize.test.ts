import { describe, expect, it } from "vitest";
import { armySizeMultiplier } from "./armySize";

describe("armySizeMultiplier", () => {
  it.each([
    [1000, 1],
    [1999, 1],
    [2000, 2],
    [2500, 2],
    [2999, 2],
    [3000, 3],
  ])("scales a %i point list by ×%i", (pointsLimit, expected) => {
    expect(armySizeMultiplier(pointsLimit)).toBe(expected);
  });
});
