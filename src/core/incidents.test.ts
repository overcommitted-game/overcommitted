import { describe, expect, test } from 'vitest';
import { advance, hold, makeConfig } from './fixtures';
import { createRound, type Round } from './round';

function incidentAt(round: Round, stationId: string) {
  return round.snapshot().stations.find((s) => s.id === stationId)!.incident;
}

describe('starting an incident', () => {
  test('draws a random arrow sequence as long as its kind asks for', () => {
    const rolls = [0, 0.25, 0.5, 0.75];
    let next = 0;
    const round = createRound(makeConfig({}, () => rolls[next++ % rolls.length]!));
    expect(round.spawnIncident('fire', 'notebook-1')).toBe(true);
    expect(incidentAt(round, 'notebook-1')).toEqual({
      kind: 'fire',
      sequence: ['up', 'right', 'down', 'left'],
      typed: 0,
    });
    round.spawnIncident('hallucination', 'agent-1');
    expect(incidentAt(round, 'agent-1')!.sequence).toHaveLength(3);
  });

  test('keeps one incident per station', () => {
    const round = createRound(makeConfig());
    round.spawnIncident('fire', 'notebook-1');
    expect(round.spawnIncident('npmVuln', 'notebook-1')).toBe(false);
    expect(incidentAt(round, 'notebook-1')!.kind).toBe('fire');
  });

  test('is refused at a station that cannot have one', () => {
    const round = createRound(makeConfig());
    expect(round.spawnIncident('fire', 'coffee-1')).toBe(false);
    expect(incidentAt(round, 'coffee-1')).toBeNull();
  });
});

describe('a station with an incident', () => {
  test('ignores work until it is resolved', () => {
    const round = createRound(makeConfig());
    round.spawnTask('clientBug');
    round.spawnIncident('fire', 'notebook-1');
    hold(round, 'notebook-1', 3000);
    expect(round.snapshot().held).toBeNull();
    expect(round.snapshot().tasks[0]!.stepProgress).toBe(0);
  });
});

describe('score drain', () => {
  test('each active incident drains score every second', () => {
    const round = createRound(makeConfig());
    round.spawnTask('jobApplication');
    hold(round, 'linkedin-1', 1500);
    const before = round.snapshot().score;
    round.spawnIncident('fire', 'notebook-1');
    advance(round, 1000);
    expect(round.snapshot().score).toBe(before - 2);
    round.spawnIncident('hallucination', 'agent-1');
    advance(round, 1000);
    expect(round.snapshot().score).toBe(before - 6);
  });
});

describe('typing the arrow sequence', () => {
  test('the correct sequence resolves the incident and unblocks the station', () => {
    const round = createRound(makeConfig());
    round.spawnTask('clientBug');
    round.spawnIncident('fire', 'notebook-1');
    const { sequence } = incidentAt(round, 'notebook-1')!;
    const results = sequence.map((arrow) => round.inputArrow('notebook-1', arrow));
    expect(results).toEqual(['progress', 'progress', 'progress', 'resolved']);
    expect(incidentAt(round, 'notebook-1')).toBeNull();
    expect(round.snapshot().stats.incidentsResolved).toBe(1);
    hold(round, 'notebook-1', 3000);
    expect(round.snapshot().held?.type).toBe('prompt');
  });

  test('a wrong arrow restarts the sequence and the incident stays', () => {
    const round = createRound(makeConfig());
    round.spawnIncident('fire', 'notebook-1');
    // The fixture rng always draws 'left'.
    round.inputArrow('notebook-1', 'left');
    expect(round.inputArrow('notebook-1', 'up')).toBe('reset');
    expect(incidentAt(round, 'notebook-1')!.typed).toBe(0);
  });

  test('a snapshot does not change when more arrows are typed', () => {
    const round = createRound(makeConfig());
    round.spawnIncident('fire', 'notebook-1');
    const before = incidentAt(round, 'notebook-1')!;
    round.inputArrow('notebook-1', 'left');
    expect(before.typed).toBe(0);
  });

  test('arrows are ignored without an incident or after the round ends', () => {
    const round = createRound(makeConfig({ durationMs: 100 }));
    expect(round.inputArrow('notebook-1', 'up')).toBe('ignored');
    expect(round.inputArrow('coffee-1', 'up')).toBe('ignored');
    round.spawnIncident('fire', 'notebook-1');
    round.update(100);
    expect(round.inputArrow('notebook-1', 'left')).toBe('ignored');
  });
});

describe('random incidents', () => {
  const eager = {
    graceMs: 1000,
    drainPerSec: 2,
    fire: { meanIntervalMs: 1, sequenceLength: 4 },
    npmVuln: { meanIntervalMs: 1, sequenceLength: 4 },
    hallucination: { sequenceLength: 3 },
  };
  const active = (round: Round) =>
    round
      .snapshot()
      .stations.flatMap((s) => (s.incident === null ? [] : [[s.id, s.incident.kind]]));

  test('hit only notebooks, after the grace period, one per station', () => {
    const round = createRound(makeConfig({ incidents: eager }, () => 0));
    advance(round, 1000);
    expect(active(round)).toEqual([]);
    advance(round, 500);
    // Fire rolls first, so it takes the notebook before npm can.
    expect(active(round)).toEqual([['notebook-1', 'fire']]);
  });

  test('the chance per frame is dt over the mean interval', () => {
    // 100 ms frames: fire has a 0.1 chance and npm a 0.4 chance, and every roll is 0.2.
    const incidents = {
      ...eager,
      graceMs: 0,
      fire: { meanIntervalMs: 1000, sequenceLength: 4 },
      npmVuln: { meanIntervalMs: 250, sequenceLength: 4 },
    };
    const round = createRound(makeConfig({ incidents }, () => 0.2));
    advance(round, 100);
    expect(active(round)).toEqual([['notebook-1', 'npmVuln']]);
  });
});
