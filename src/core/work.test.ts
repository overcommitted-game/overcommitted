import { describe, expect, test } from 'vitest';
import { advance, hold, makeConfig } from './fixtures';
import { createRound } from './round';

describe('working at a station', () => {
  test('single-step task completes after workMs at its station', () => {
    const r = createRound(makeConfig());
    r.spawnTask('jobApplication');
    hold(r, 'linkedin-1', 1400);
    expect(r.snapshot().tasks).toHaveLength(1);
    hold(r, 'linkedin-1', 100);
    const s = r.snapshot();
    expect(s.tasks).toHaveLength(0);
    expect(s.stats.completed).toBe(1);
    expect(s.score).toBe(15); // 10 + round(10 * 0.5 * 28600 / 30000)
  });

  test('empty hands work the oldest eligible task', () => {
    const r = createRound(makeConfig());
    const a = r.spawnTask('jobApplication');
    r.spawnTask('jobApplication');
    hold(r, 'linkedin-1', 1500);
    expect(r.snapshot().tasks.map((t) => t.id)).not.toContain(a);
  });

  test('completing then expiring never drops score below zero', () => {
    const r = createRound(makeConfig());
    r.spawnTask('jobApplication');
    r.spawnTask('jobApplication');
    hold(r, 'linkedin-1', 1500);
    advance(r, 30000);
    expect(r.snapshot().score).toBe(0);
  });
});
