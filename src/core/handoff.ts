import type { RoundState } from './state';
import type { Station } from './types';

/** Tapping E at a station (spec §5.4): leave or pick up items on counters. */
export function interact(state: RoundState, station: Station): void {
  if (station.type === 'counter') {
    const onCounter = state.counters[station.id] ?? null;
    // Only one side has something: hand and counter swap it. Both full or both empty: nothing.
    if ((state.held === null) === (onCounter === null)) return;
    state.counters[station.id] = state.held;
    state.held = onCounter;
  }
}
