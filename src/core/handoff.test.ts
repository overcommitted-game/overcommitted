import { describe, expect, test } from 'vitest';
import { hold, makeConfig } from './fixtures';
import { createRound, type Round } from './round';
import type { Balance } from './types';

/** A clientBug whose prompt is already in hand, ready for its agent step. */
function promptInHand(overrides: Partial<Balance> = {}) {
  const r = createRound(makeConfig(overrides));
  const id = r.spawnTask('clientBug');
  hold(r, 'notebook-1', 3000);
  return { r, id };
}
const station = (r: Round, id: string) => r.snapshot().stations.find((s) => s.id === id)!;

describe('counters', () => {
  test('counter stores one item and gives it back', () => {
    const { r, id } = promptInHand();
    r.interact('counter-1');
    expect(r.snapshot().held).toBeNull();
    expect(station(r, 'counter-1').item).toEqual({ type: 'prompt', taskId: id });
    r.interact('counter-1');
    expect(r.snapshot().held).toEqual({ type: 'prompt', taskId: id });
    expect(station(r, 'counter-1').item).toBeNull();
  });

  test('full counter refuses a second item', () => {
    const { r } = promptInHand();
    r.interact('counter-1');
    r.spawnTask('clientBug');
    hold(r, 'notebook-1', 3000);
    r.interact('counter-1');
    expect(r.snapshot().held).not.toBeNull();
  });

  test('interact does nothing once the round ended', () => {
    const { r } = promptInHand({ durationMs: 3000 });
    expect(r.snapshot().phase).toBe('ended');
    r.interact('counter-1');
    expect(r.snapshot().held).not.toBeNull();
  });
});
