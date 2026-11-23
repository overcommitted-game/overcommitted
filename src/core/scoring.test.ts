import { describe, expect, test } from 'vitest';
import { completionPoints, starsFor } from './scoring';

describe('scoring', () => {
  test('completionPoints adds a bonus proportional to remaining time', () => {
    expect(completionPoints(10, 30000, 30000, 0.5)).toBe(15);
    expect(completionPoints(10, 0, 30000, 0.5)).toBe(10);
    expect(completionPoints(60, 35000, 70000, 0.5)).toBe(75);
  });

  test('starsFor counts reached thresholds', () => {
    expect([99, 100, 250, 300, 999].map((s) => starsFor(s, [100, 200, 300]))).toEqual([0, 1, 2, 3, 3]);
  });
});
