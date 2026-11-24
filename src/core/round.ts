import { starsFor } from './scoring';
import { createState, type RoundState } from './state';
import { expireTasks, spawnRandomTask, spawnScheduledTasks, spawnTask } from './tasks';
import type { GameSnapshot, RoundConfig, RoundSummary, TaskKind } from './types';
import { work } from './work';

export class Round {
  private readonly state: RoundState;

  constructor(config: RoundConfig) {
    this.state = createState(config);
    for (let i = 0; i < config.balance.initialTasks; i++) spawnRandomTask(this.state);
  }

  spawnTask(kind: TaskKind): number {
    return spawnTask(this.state, kind);
  }

  /** Holding E at a station for one frame. */
  work(stationId: string, dtMs: number): void {
    const station = this.state.config.stations.find((s) => s.id === stationId);
    if (station === undefined) return;
    work(this.state, station.type, dtMs);
  }

  update(dtMs: number): void {
    const { state } = this;
    if (state.phase === 'ended') return;
    const { balance } = state.config;
    // A long frame (background tab, suspended laptop) must not skip seconds of the round.
    const dt = Math.min(dtMs, balance.maxDtMs);
    state.elapsedMs += dt;
    spawnScheduledTasks(state, dt);
    expireTasks(state, dt);
    if (state.elapsedMs >= balance.durationMs) {
      state.elapsedMs = balance.durationMs;
      state.phase = 'ended';
    }
  }

  summary(): RoundSummary {
    const { score, stats } = this.snapshot();
    return {
      score,
      stars: starsFor(score, this.state.config.balance.starThresholds),
      completed: stats.completed,
      expired: stats.expired,
      incidentsResolved: stats.incidentsResolved,
    };
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
      tasks: state.tasks.map((task) => ({
        id: task.id,
        kind: task.kind,
        stepIndex: task.stepIndex,
        stepProgress: 0, // T3 fills this in once work advances the steps
        remainingMs: task.remainingMs,
        timeLimitMs: state.config.recipes[task.kind].timeLimitMs,
      })),
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
