import type { RoundState } from './state';
import type { IncidentKind } from './types';

// shortcut: no arrow sequence yet, T5 generates it and adds the one-per-station check.
export function startIncident(state: RoundState, kind: IncidentKind, stationId: string): void {
  state.incidents[stationId] = { kind, sequence: [], typed: 0 };
}
