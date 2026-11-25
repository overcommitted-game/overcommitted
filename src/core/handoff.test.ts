import { describe, expect, test } from 'vitest';
import { advance, hold, makeConfig } from './fixtures';
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

test('interact does nothing once the round ended', () => {
  const { r } = promptInHand({ durationMs: 3000 });
  expect(r.snapshot().phase).toBe('ended');
  r.interact('counter-1');
  expect(r.snapshot().held).not.toBeNull();
});

describe('ai agents', () => {
  test('drops a matching item into an idle agent', () => {
    const { r, id } = promptInHand();
    r.interact('agent-1');
    expect(r.snapshot().held).toBeNull();
    expect(station(r, 'agent-1')).toMatchObject({
      item: { type: 'prompt', taskId: id },
      agent: { state: 'working', progress: 0 },
    });
  });

  test('agent rejects items that are not its next step', () => {
    const r = createRound(makeConfig());
    r.spawnTask('englishInterview');
    hold(r, 'study-1', 4000);
    r.interact('agent-1');
    expect(r.snapshot().held?.type).toBe('englishNotes');
  });

  test('busy agent refuses a second item', () => {
    const { r } = promptInHand();
    r.interact('agent-1');
    r.spawnTask('clientBug');
    hold(r, 'notebook-1', 3000);
    r.interact('agent-1');
    expect(r.snapshot().held?.type).toBe('prompt');
  });

  test('agent shows its progress while working', () => {
    const { r } = promptInHand();
    r.interact('agent-1');
    advance(r, 2000);
    expect(station(r, 'agent-1').agent).toEqual({ state: 'working', progress: 0.25 });
  });

  test('agent result is collected with empty hands', () => {
    const { r, id } = promptInHand();
    r.interact('agent-1');
    advance(r, 8000);
    expect(station(r, 'agent-1')).toMatchObject({ item: { type: 'pr', taskId: id }, agent: { state: 'ready' } });
    r.interact('agent-1');
    expect(r.snapshot().held).toEqual({ type: 'pr', taskId: id });
    expect(r.snapshot().tasks[0]?.stepIndex).toBe(2);
    expect(station(r, 'agent-1')).toMatchObject({ item: null, agent: { state: 'idle' } });
  });

  test('ready agent keeps its result while your hands are full', () => {
    const { r, id } = promptInHand();
    r.interact('agent-1');
    advance(r, 8000);
    const other = r.spawnTask('clientBug');
    hold(r, 'notebook-1', 3000);
    r.interact('agent-1');
    expect(r.snapshot().held).toEqual({ type: 'prompt', taskId: other });
    expect(station(r, 'agent-1')).toMatchObject({ item: { type: 'pr', taskId: id }, agent: { state: 'ready' } });
  });

  test('full bug flow completes the task', () => {
    const { r } = promptInHand();
    r.interact('agent-1');
    advance(r, 8000);
    r.interact('agent-1');
    hold(r, 'notebook-1', 2000);
    expect(r.snapshot().stats.completed).toBe(1);
  });

  test('ready agent waits the whole window before hallucinating', () => {
    const { r } = promptInHand();
    r.interact('agent-1');
    advance(r, 8000 + 9900);
    expect(station(r, 'agent-1')).toMatchObject({ agent: { state: 'ready' }, incident: null });
  });

  test('unattended ready agent hallucinates and resets its task', () => {
    const { r } = promptInHand();
    r.interact('agent-1');
    advance(r, 8000 + 10000);
    expect(station(r, 'agent-1')).toMatchObject({
      item: null,
      agent: { state: 'idle' },
      incident: { kind: 'hallucination' },
    });
    expect(r.snapshot().tasks[0]).toMatchObject({ stepIndex: 0, stepProgress: 0 });
  });

  test('a hallucinated agent ignores interact until its incident is resolved', () => {
    const { r } = promptInHand();
    r.interact('agent-1');
    advance(r, 8000 + 10000);
    hold(r, 'notebook-1', 3000);
    r.interact('agent-1');
    expect(r.snapshot().held?.type).toBe('prompt');
  });
});

describe('a task that expires takes its item with it', () => {
  test('from the hand', () => {
    const { r } = promptInHand();
    advance(r, 70000);
    expect(r.snapshot().held).toBeNull();
  });

  test('from a counter', () => {
    const { r } = promptInHand();
    r.interact('counter-1');
    advance(r, 70000);
    expect(station(r, 'counter-1').item).toBeNull();
  });

  test('from an agent, which then never hallucinates', () => {
    const { r } = promptInHand({ agentReadyWindowMs: 1e9 }); // so it does not hallucinate before expiring
    r.interact('agent-1');
    advance(r, 70000);
    expect(station(r, 'agent-1')).toMatchObject({ item: null, agent: { state: 'idle' }, incident: null });
  });

  test('items of other tasks stay', () => {
    const { r } = promptInHand();
    r.spawnTask('jobApplication');
    advance(r, 30000);
    expect(r.snapshot().stats.expired).toBe(1);
    expect(r.snapshot().held?.type).toBe('prompt');
  });
});

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
    const { r, id } = promptInHand();
    r.interact('counter-1');
    const second = r.spawnTask('clientBug');
    hold(r, 'notebook-1', 3000);
    r.interact('counter-1');
    expect(r.snapshot().held).toEqual({ type: 'prompt', taskId: second });
    expect(station(r, 'counter-1').item).toEqual({ type: 'prompt', taskId: id });
  });
});
