import type { RoundState } from './state';
import type { Arrow, IncidentKind } from './types';

const ARROWS = ['up', 'right', 'down', 'left'] as const;

function randomArrow(rng: () => number): Arrow {
  const arrow = ARROWS[Math.floor(rng() * ARROWS.length)];
  if (arrow === undefined) throw new Error('rng must return a value in [0, 1)');
  return arrow;
}

/** False when the station already has an incident, or is of a type that cannot have one. */
export function startIncident(state: RoundState, kind: IncidentKind, stationId: string): boolean {
  // Only stations that can have incidents have a key here, and null means "free".
  if (state.incidents[stationId] !== null) return false;
  const { sequenceLength } = state.config.balance.incidents[kind];
  const sequence = Array.from({ length: sequenceLength }, () => randomArrow(state.config.rng));
  state.incidents[stationId] = { kind, sequence, typed: 0 };
  return true;
}
