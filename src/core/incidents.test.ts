import { describe, expect, test } from 'vitest';
import { makeConfig } from './fixtures';
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
