import type { Arrow, IncidentKind, Item, RoundConfig, TaskKind } from './types';

export interface TaskState {
  id: number;
  kind: TaskKind;
  stepIndex: number;
  stepProgressMs: number;
  remainingMs: number;
}
export interface AgentState {
  status: 'idle' | 'working' | 'ready';
  item: Item | null;
  timerMs: number;
}
export interface IncidentState {
  kind: IncidentKind;
  sequence: Arrow[];
  typed: number;
}

export interface RoundState {
  config: RoundConfig;
  elapsedMs: number;
  phase: 'playing' | 'ended';
  score: number; // float: only rounded when shown
  nextTaskId: number;
  spawnTimerMs: number;
  tasks: TaskState[];
  held: Item | null;
  agents: Record<string, AgentState>;
  counters: Record<string, Item | null>;
  incidents: Record<string, IncidentState | null>;
  stats: { completed: number; expired: number; incidentsResolved: number };
}

export function addScore(state: RoundState, delta: number): void {
  state.score = Math.max(0, state.score + delta);
}

export function createState(config: RoundConfig): RoundState {
  const idsOf = (...types: string[]) => config.stations.filter((s) => types.includes(s.type)).map((s) => s.id);
  return {
    config,
    elapsedMs: 0,
    phase: 'playing',
    score: 0,
    nextTaskId: 1,
    spawnTimerMs: 0,
    tasks: [],
    held: null,
    agents: Object.fromEntries(
      idsOf('agent').map((id): [string, AgentState] => [id, { status: 'idle', item: null, timerMs: 0 }]),
    ),
    counters: Object.fromEntries(idsOf('counter').map((id) => [id, null])),
    // Incidents can hit the notebook (fire, npm) and the agents (hallucination).
    incidents: Object.fromEntries(idsOf('notebook', 'agent').map((id) => [id, null])),
    stats: { completed: 0, expired: 0, incidentsResolved: 0 },
  };
}
