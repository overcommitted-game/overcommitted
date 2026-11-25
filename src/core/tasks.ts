import { addScore, idleAgent, type RoundState } from './state';
import { TASK_KINDS, type Item, type TaskKind } from './types';

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

/** The only place a task leaves the round: its item leaves with it, from wherever it is. */
export function removeTask(state: RoundState, taskId: number): void {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  const ofTask = (item: Item | null) => item?.taskId === taskId;
  if (ofTask(state.held)) state.held = null;
  for (const [id, item] of Object.entries(state.counters)) {
    if (ofTask(item)) state.counters[id] = null;
  }
  // An emptied agent goes idle, so it never hallucinates over a task that is gone.
  for (const agent of Object.values(state.agents)) {
    if (ofTask(agent.item)) Object.assign(agent, idleAgent());
  }
}

export function expireTasks(state: RoundState, dtMs: number): void {
  for (const task of state.tasks) {
    task.remainingMs -= dtMs;
    if (task.remainingMs <= 0) {
      addScore(state, -state.config.balance.expirePenalty);
      state.stats.expired++;
      removeTask(state, task.id);
    }
  }
}
