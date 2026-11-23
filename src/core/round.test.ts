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
