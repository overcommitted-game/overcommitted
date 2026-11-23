import { describe, expect, test } from 'vitest';
import { advance, makeConfig } from './fixtures';
import { createRound } from './round';

describe('round clock', () => {
  test('round ends exactly at duration', () => {
    const r = createRound(makeConfig({ durationMs: 1000 }));
    advance(r, 1500);
    expect(r.snapshot()).toMatchObject({ phase: 'ended', elapsedMs: 1000 });
  });

  test('huge frame deltas are clamped to maxDtMs', () => {
    const r = createRound(makeConfig());
    r.update(5000);
    expect(r.snapshot().elapsedMs).toBe(100);
  });

  test('snapshot lists every station, empty, with agents idle', () => {
    const { stations } = createRound(makeConfig()).snapshot();
    expect(stations).toHaveLength(11);
    expect(stations.find((s) => s.id === 'agent-2')).toEqual({
      id: 'agent-2',
      type: 'agent',
      item: null,
      agent: { state: 'idle', progress: 0 },
      incident: null,
      workProgress: null,
    });
    expect(stations.find((s) => s.id === 'counter-1')).toMatchObject({ item: null, agent: null });
  });
});

describe('task expiry', () => {
  test('expired task is removed, counted, and score stays >= 0', () => {
    const r = createRound(makeConfig());
    r.spawnTask('jobApplication');
    advance(r, 30000);
    expect(r.snapshot()).toMatchObject({ tasks: [], score: 0, stats: { expired: 1 } });
  });

  test('tasks are listed oldest first with remaining time', () => {
    const r = createRound(makeConfig());
    const a = r.spawnTask('jobApplication');
    advance(r, 1000);
    const b = r.spawnTask('clientBug');
    const [ta, tb] = r.snapshot().tasks;
    expect([ta?.id, tb?.id]).toEqual([a, b]);
    expect(ta).toMatchObject({ remainingMs: 29000, timeLimitMs: 30000, stepIndex: 0, stepProgress: 0 });
  });
});

describe('task spawning', () => {
  test('spawns initial tasks, then on schedule, up to the max', () => {
    const r = createRound(makeConfig({ initialTasks: 2, spawnEveryMs: 1000, maxPendingTasks: 3 }));
    expect(r.snapshot().tasks).toHaveLength(2);
    advance(r, 1000);
    expect(r.snapshot().tasks).toHaveLength(3);
    advance(r, 2000);
    expect(r.snapshot().tasks).toHaveLength(3);
  });

  test('picks the kind from the weights and the rng', () => {
    const weights = { clientBug: 1, sideFeature: 0, englishInterview: 0, spanishInterview: 0, techTest: 0, jobApplication: 3 };
    const low = createRound(makeConfig({ initialTasks: 1, taskWeights: weights }, () => 0.1));
    const high = createRound(makeConfig({ initialTasks: 1, taskWeights: weights }, () => 0.9));
    expect(low.snapshot().tasks[0]?.kind).toBe('clientBug');
    expect(high.snapshot().tasks[0]?.kind).toBe('jobApplication');
  });

  test('task ids start at 1 and a spawned task begins with its full time limit', () => {
    const r = createRound(makeConfig());
    expect(r.spawnTask('clientBug')).toBe(1);
    expect(r.spawnTask('jobApplication')).toBe(2);
    expect(r.snapshot().tasks[0]).toEqual({
      id: 1,
      kind: 'clientBug',
      stepIndex: 0,
      stepProgress: 0,
      remainingMs: 70000,
      timeLimitMs: 70000,
    });
  });
});
