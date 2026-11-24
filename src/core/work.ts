import { completionPoints } from './scoring';
import { addScore, type RoundState, type TaskState } from './state';
import { removeTask } from './tasks';
import type { StationType } from './types';

function workStep(state: RoundState, task: TaskState) {
  const step = state.config.recipes[task.kind].steps[task.stepIndex];
  return step?.kind === 'work' ? step : null;
}

/**
 * The task that holding E at a station of this type advances (spec §5.4):
 * with an item in hand, only that item's task; with empty hands, the oldest one that needs nothing.
 */
function taskAt(state: RoundState, stationType: StationType): TaskState | null {
  const { held } = state;
  return (
    state.tasks.find((task) => {
      const step = workStep(state, task);
      if (step === null || step.station !== stationType) return false;
      return held === null ? step.needs === null : task.id === held.taskId && step.needs === held.type;
    }) ?? null
  );
}

/** 0..1 of the task's current step. Agent steps show their progress on the agent instead. */
export function stepProgress(state: RoundState, task: TaskState): number {
  const step = workStep(state, task);
  return step === null ? 0 : task.stepProgressMs / step.workMs;
}

/** 0..1 of the work already started at this station, or null when there is none to show. */
export function workProgress(state: RoundState, stationType: StationType): number | null {
  const task = taskAt(state, stationType);
  return task !== null && task.stepProgressMs > 0 ? stepProgress(state, task) : null;
}

export function work(state: RoundState, stationType: StationType, dtMs: number): void {
  const task = taskAt(state, stationType);
  const step = task && workStep(state, task);
  if (task === null || step === null) return;
  // Progress lives in the task, not the station: walking away keeps it.
  task.stepProgressMs += dtMs;
  if (task.stepProgressMs < step.workMs) return;
  if (step.needs !== null) state.held = null;
  if (step.gives !== null) state.held = { type: step.gives, taskId: task.id };
  task.stepIndex++;
  task.stepProgressMs = 0;
  const recipe = state.config.recipes[task.kind];
  if (task.stepIndex < recipe.steps.length) return;
  const { speedBonusMax } = state.config.balance;
  addScore(state, completionPoints(recipe.points, task.remainingMs, recipe.timeLimitMs, speedBonusMax));
  state.stats.completed++;
  removeTask(state, task.id);
}
