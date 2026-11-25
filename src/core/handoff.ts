import type { AgentState, RoundState } from './state';
import type { Station } from './types';

function taskById(state: RoundState, taskId: number) {
  return state.tasks.find((task) => task.id === taskId) ?? null;
}

/** The agent step this task is on, or null when its current step is something else. */
function agentStep(state: RoundState, taskId: number) {
  const task = taskById(state, taskId);
  const step = task && state.config.recipes[task.kind].steps[task.stepIndex];
  return step?.kind === 'agent' ? step : null;
}

function interactWithAgent(state: RoundState, agent: AgentState): void {
  const { held } = state;
  if (agent.status === 'idle' && held !== null) {
    const step = agentStep(state, held.taskId);
    if (step === null || step.needs !== held.type) return;
    state.held = null;
    agent.status = 'working';
    agent.item = held;
    agent.timerMs = step.processMs;
  } else if (agent.status === 'ready' && held === null && agent.item !== null) {
    const task = taskById(state, agent.item.taskId);
    if (task === null) return;
    state.held = agent.item;
    task.stepIndex++;
    agent.status = 'idle';
    agent.item = null;
    agent.timerMs = 0;
  }
}

/** Tapping E at a station (spec §5.4): hand items to agents and counters, and take them back. */
export function interact(state: RoundState, station: Station): void {
  const agent = state.agents[station.id];
  if (agent !== undefined) {
    interactWithAgent(state, agent);
    return;
  }
  if (station.type === 'counter') {
    const onCounter = state.counters[station.id] ?? null;
    // Only one side has something: hand and counter swap it. Both full or both empty: nothing.
    if ((state.held === null) === (onCounter === null)) return;
    state.counters[station.id] = state.held;
    state.held = onCounter;
  }
}

/** Agents process on their own: the coffee buff speeds up the player, not them. */
export function updateAgents(state: RoundState, dtMs: number): void {
  for (const agent of Object.values(state.agents)) {
    if (agent.status !== 'working' || agent.item === null) continue;
    agent.timerMs -= dtMs;
    if (agent.timerMs > 0) continue;
    const step = agentStep(state, agent.item.taskId);
    if (step === null) continue;
    agent.status = 'ready';
    agent.item = { type: step.gives, taskId: agent.item.taskId };
    agent.timerMs = state.config.balance.agentReadyWindowMs;
  }
}

/** 0..1 of the processing while working; 0 when idle or ready. */
export function agentProgress(state: RoundState, agent: AgentState): number {
  if (agent.status !== 'working' || agent.item === null) return 0;
  const step = agentStep(state, agent.item.taskId);
  return step === null ? 0 : 1 - agent.timerMs / step.processMs;
}
