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

  test('progress is kept when walking away', () => {
    const r = createRound(makeConfig());
    r.spawnTask('jobApplication');
    hold(r, 'linkedin-1', 1000);
    hold(r, 'study-1', 500);
    expect(r.snapshot().tasks[0]?.stepProgress).toBeCloseTo(1000 / 1500);
    hold(r, 'linkedin-1', 500);
    expect(r.snapshot().tasks).toHaveLength(0);
  });

  test('a station shows the progress of the work waiting there, once started', () => {
    const r = createRound(makeConfig());
    r.spawnTask('jobApplication');
    const progressAt = (id: string) => r.snapshot().stations.find((s) => s.id === id)?.workProgress;
    expect(progressAt('linkedin-1')).toBeNull();
    hold(r, 'linkedin-1', 600);
    expect(progressAt('linkedin-1')).toBeCloseTo(0.4);
    expect(progressAt('study-1')).toBeNull();
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
