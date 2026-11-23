import { createState, type RoundState } from './state';
import type { GameSnapshot, RoundConfig } from './types';

export class Round {
  private readonly state: RoundState;

  constructor(config: RoundConfig) {
    this.state = createState(config);
  }

  update(dtMs: number): void {
    const { state } = this;
    if (state.phase === 'ended') return;
    const { balance } = state.config;
    // A long frame (background tab, suspended laptop) must not skip seconds of the round.
    state.elapsedMs += Math.min(dtMs, balance.maxDtMs);
    if (state.elapsedMs >= balance.durationMs) {
      state.elapsedMs = balance.durationMs;
      state.phase = 'ended';
    }
  }

  snapshot(): GameSnapshot {
    const { state } = this;
    return {
      phase: state.phase,
      elapsedMs: state.elapsedMs,
      durationMs: state.config.balance.durationMs,
      score: Math.round(state.score),
      held: state.held,
      speedMultiplier: 1,
      tasks: [],
      stations: state.config.stations.map(({ id, type }) => {
        const agent = state.agents[id] ?? null;
        return {
          id,
          type,
          item: agent?.item ?? state.counters[id] ?? null,
          agent: agent && { state: agent.status, progress: 0 },
          incident: state.incidents[id] ?? null,
          workProgress: null,
        };
      }),
      stats: { ...state.stats },
    };
  }
}

export function createRound(config: RoundConfig): Round {
  return new Round(config);
}
