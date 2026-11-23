export function completionPoints(
  points: number,
  remainingMs: number,
  timeLimitMs: number,
  speedBonusMax: number,
): number {
  return points + Math.round((points * speedBonusMax * remainingMs) / timeLimitMs);
}

export function starsFor(score: number, [one, two, three]: [number, number, number]): 0 | 1 | 2 | 3 {
  if (score >= three) return 3;
  if (score >= two) return 2;
  if (score >= one) return 1;
  return 0;
}
