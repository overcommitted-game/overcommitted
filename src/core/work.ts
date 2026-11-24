import { completionPoints } from './scoring';
import { addScore, type RoundState, type TaskState } from './state';
import { removeTask } from './tasks';
import type { StationType } from './types';

/** The task that holding E at a station of this type advances: the oldest one waiting there. */
function taskAt(state: RoundState, stationType: StationType): TaskState | null {
  return (
    state.tasks.find((task) => {
      const step = state.config.recipes[task.kind].steps[task.stepIndex];
      return step?.kind === 'work' && step.station === stationType && step.needs === null;
    }) ?? null
  );
}

export function work(state: RoundState, stationType: StationType, dtMs: number): void {
  const task = taskAt(state, stationType);
  if (task === null) return;
  const recipe = state.config.recipes[task.kind];
  const step = recipe.steps[task.stepIndex];
  if (step?.kind !== 'work') return;
  task.stepProgressMs += dtMs;
  if (task.stepProgressMs < step.workMs) return;
  task.stepIndex++;
  task.stepProgressMs = 0;
  if (task.stepIndex < recipe.steps.length) return;
  const { speedBonusMax } = state.config.balance;
  addScore(state, completionPoints(recipe.points, task.remainingMs, recipe.timeLimitMs, speedBonusMax));
  state.stats.completed++;
  removeTask(state, task.id);
}
