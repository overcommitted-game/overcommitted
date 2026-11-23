import type { RoundState } from './state';
import { TASK_KINDS, type TaskKind } from './types';

export function spawnTask(state: RoundState, kind: TaskKind): number {
  const id = state.nextTaskId++;
  state.tasks.push({
    id,
    kind,
    stepIndex: 0,
    stepProgressMs: 0,
    remainingMs: state.config.recipes[kind].timeLimitMs,
  });
  return id;
}

/** Weighted random kind: each kind gets a slice of the roll proportional to its weight. */
export function spawnRandomTask(state: RoundState): number {
  const { taskWeights } = state.config.balance;
  const total = TASK_KINDS.reduce((sum, kind) => sum + taskWeights[kind], 0);
  let roll = state.config.rng() * total;
  for (const kind of TASK_KINDS) {
    roll -= taskWeights[kind];
    if (roll < 0) return spawnTask(state, kind);
  }
  throw new Error('taskWeights must add up to more than 0');
}

export function spawnScheduledTasks(state: RoundState, dtMs: number): void {
  const { spawnEveryMs, maxPendingTasks } = state.config.balance;
  state.spawnTimerMs += dtMs;
  while (state.spawnTimerMs >= spawnEveryMs) {
    state.spawnTimerMs -= spawnEveryMs;
    // At the cap the tick is skipped, not saved up: freeing a slot must not trigger a burst.
    if (state.tasks.length < maxPendingTasks) spawnRandomTask(state);
  }
}
