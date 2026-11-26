import { addScore, type RoundState } from './state';
import type { Arrow, ArrowResult, IncidentKind } from './types';

const ARROWS = ['up', 'right', 'down', 'left'] as const;
// In roll order. Hallucinations are not random: the player causes them.
const RANDOM_KINDS = ['fire', 'npmVuln'] as const;

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

export function inputArrow(state: RoundState, stationId: string, arrow: Arrow): ArrowResult {
  const incident = state.incidents[stationId] ?? null;
  if (incident === null) return 'ignored';
  if (arrow !== incident.sequence[incident.typed]) {
    incident.typed = 0;
    return 'reset';
  }
  incident.typed++;
  if (incident.typed < incident.sequence.length) return 'progress';
  state.incidents[stationId] = null;
  state.stats.incidentsResolved++;
  return 'resolved';
}

/** Each frame, each kind has a dt / meanInterval chance of hitting a free notebook. */
function spawnRandomIncidents(state: RoundState, dtMs: number): void {
  const { incidents } = state.config.balance;
  if (state.elapsedMs <= incidents.graceMs) return;
  for (const { id, type } of state.config.stations) {
    if (type !== 'notebook') continue;
    for (const kind of RANDOM_KINDS) {
      // startIncident refuses an occupied station.
      if (state.config.rng() < dtMs / incidents[kind].meanIntervalMs) startIncident(state, kind, id);
    }
  }
}

export function updateIncidents(state: RoundState, dtMs: number): void {
  const { drainPerSec } = state.config.balance.incidents;
  const active = Object.values(state.incidents).filter((incident) => incident !== null).length;
  addScore(state, (-active * drainPerSec * dtMs) / 1000);
  spawnRandomIncidents(state, dtMs);
}
