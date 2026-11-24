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

describe('Round.work guards', () => {
  test('work is ignored after the round ends and on unknown stations', () => {
    const r = createRound(makeConfig({ durationMs: 1000 }));
    r.spawnTask('jobApplication');
    r.work('nope', 100);
    advance(r, 1000);
    hold(r, 'linkedin-1', 1500);
    expect(r.snapshot().stats.completed).toBe(0);
  });

  test('huge work deltas are clamped to maxDtMs', () => {
    const r = createRound(makeConfig());
    r.spawnTask('jobApplication');
    r.work('linkedin-1', 5000);
    expect(r.snapshot().tasks[0]?.stepProgress).toBeCloseTo(100 / 1500);
  });
});

describe('carried items', () => {
  test('first step gives an item and advances the task', () => {
    const r = createRound(makeConfig());
    const id = r.spawnTask('clientBug');
    hold(r, 'notebook-1', 3000);
    expect(r.snapshot().held).toEqual({ type: 'prompt', taskId: id });
    expect(r.snapshot().tasks[0]?.stepIndex).toBe(1);
  });

  test('cannot start a new task with full hands', () => {
    const r = createRound(makeConfig());
    r.spawnTask('englishInterview');
    r.spawnTask('techTest');
    hold(r, 'study-1', 4000);
    hold(r, 'study-1', 4000);
    expect(r.snapshot().tasks.map((t) => t.stepIndex)).toEqual([1, 0]);
  });

  test('held item finishes its own task', () => {
    const r = createRound(makeConfig());
    r.spawnTask('englishInterview');
    hold(r, 'study-1', 4000);
    hold(r, 'interview-1', 4000);
    expect(r.snapshot()).toMatchObject({ held: null, tasks: [], stats: { completed: 1 } });
  });
});

describe('coffee', () => {
  test('coffee speeds up work and wears off', () => {
    const r = createRound(makeConfig());
    r.spawnTask('jobApplication');
    hold(r, 'coffee-1', 2000);
    expect(r.snapshot().speedMultiplier).toBe(1.5);
    hold(r, 'linkedin-1', 1000);
    expect(r.snapshot().tasks).toHaveLength(0);
    advance(r, 20000);
    expect(r.snapshot().speedMultiplier).toBe(1);
  });

  test('coffee is made with an item in hand, which stays there', () => {
    const r = createRound(makeConfig());
    const id = r.spawnTask('clientBug');
    hold(r, 'notebook-1', 3000);
    hold(r, 'coffee-1', 1000);
    expect(r.snapshot().stations.find((s) => s.id === 'coffee-1')?.workProgress).toBeCloseTo(0.5);
    hold(r, 'coffee-1', 1000);
    expect(r.snapshot()).toMatchObject({ speedMultiplier: 1.5, held: { type: 'prompt', taskId: id } });
  });
});
