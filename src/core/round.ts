import { agentProgress, interact, updateAgents } from './handoff';
import { starsFor } from './scoring';
import { createState, type RoundState } from './state';
import { expireTasks, spawnRandomTask, spawnScheduledTasks, spawnTask } from './tasks';
import type { GameSnapshot, RoundConfig, RoundSummary, TaskKind } from './types';
import { speedMultiplier, stepProgress, work, workProgress } from './work';

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
    const { state } = this;
    const station = state.config.stations.find((s) => s.id === stationId);
    if (state.phase === 'ended' || station === undefined) return;
    // Same clamp as update: one long frame must not finish a task at once.
    work(state, station.type, Math.min(dtMs, state.config.balance.maxDtMs));
  }

  /** Tapping E at a station once. */
  interact(stationId: string): void {
    const { state } = this;
    const station = state.config.stations.find((s) => s.id === stationId);
    if (state.phase === 'ended' || station === undefined) return;
    interact(state, station);
  }

  update(dtMs: number): void {
    const { state } = this;
    if (state.phase === 'ended') return;
    const { balance } = state.config;
    // A long frame (background tab, suspended laptop) must not skip seconds of the round.
    const dt = Math.min(dtMs, balance.maxDtMs);
    state.elapsedMs += dt;
    state.buffMs = Math.max(0, state.buffMs - dt);
    spawnScheduledTasks(state, dt);
    expireTasks(state, dt);
    updateAgents(state, dt);
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
      speedMultiplier: speedMultiplier(state),
      tasks: state.tasks.map((task) => ({
        id: task.id,
        kind: task.kind,
        stepIndex: task.stepIndex,
        stepProgress: stepProgress(state, task),
        remainingMs: task.remainingMs,
        timeLimitMs: state.config.recipes[task.kind].timeLimitMs,
      })),
      stations: state.config.stations.map(({ id, type }) => {
        const agent = state.agents[id] ?? null;
        return {
          id,
          type,
          item: agent?.item ?? state.counters[id] ?? null,
          agent: agent && { state: agent.status, progress: agentProgress(state, agent) },
          incident: state.incidents[id] ?? null,
          workProgress: workProgress(state, type),
        };
      }),
      stats: { ...state.stats },
    };
  }
}

export function createRound(config: RoundConfig): Round {
  return new Round(config);
}
