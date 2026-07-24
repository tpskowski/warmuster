/**
 * Warmaster Min/Max allowances scale once per full 1,000 points.
 *
 * Examples:
 * - 1,000–1,999 points: ×1
 * - 2,000–2,999 points: ×2
 * - 3,000–3,999 points: ×3
 */
export function armySizeMultiplier(pointsLimit: number): number {
  if (!Number.isFinite(pointsLimit)) return 1;
  return Math.max(1, Math.floor(pointsLimit / 1000));
}
