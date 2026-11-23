export type StationType = 'notebook' | 'agent' | 'coffee' | 'study' | 'interview' | 'linkedin' | 'counter';
export type ItemType = 'prompt' | 'pr' | 'englishNotes' | 'frameworkNotes';
// A runtime list too: lets us walk every kind (weights, spawning) without casting `Object.keys`.
export const TASK_KINDS = [
  'clientBug',
  'sideFeature',
  'englishInterview',
  'spanishInterview',
  'techTest',
  'jobApplication',
] as const;
export type TaskKind = (typeof TASK_KINDS)[number];
export type IncidentKind = 'fire' | 'npmVuln' | 'hallucination';
export type Arrow = 'up' | 'right' | 'down' | 'left';
export type ArrowResult = 'progress' | 'reset' | 'resolved' | 'ignored';

export interface Item {
  type: ItemType;
  taskId: number;
}
export interface Station {
  id: string; // e.g. 'agent-2'
  type: StationType;
}
export type Step =
  | {
      kind: 'work';
      station: 'notebook' | 'study' | 'interview' | 'linkedin';
      workMs: number;
      needs: ItemType | null;
      gives: ItemType | null;
    }
  | { kind: 'agent'; needs: ItemType; processMs: number; gives: ItemType };
export interface Recipe {
  steps: Step[];
  timeLimitMs: number;
  points: number;
}

export interface Balance {
  durationMs: number;
  maxDtMs: number;
  initialTasks: number;
  spawnEveryMs: number;
  maxPendingTasks: number;
  taskWeights: Record<TaskKind, number>;
  speedBonusMax: number;
  expirePenalty: number;
  agentReadyWindowMs: number;
  coffee: { workMs: number; multiplier: number; durationMs: number };
  incidents: {
    graceMs: number;
    drainPerSec: number;
    fire: { meanIntervalMs: number; sequenceLength: number };
    npmVuln: { meanIntervalMs: number; sequenceLength: number };
    hallucination: { sequenceLength: number };
  };
  starThresholds: [number, number, number];
}
export interface RoundConfig {
  balance: Balance;
  recipes: Record<TaskKind, Recipe>;
  stations: Station[];
  rng: () => number;
}

export interface TaskView {
  id: number;
  kind: TaskKind;
  stepIndex: number;
  stepProgress: number;
  remainingMs: number;
  timeLimitMs: number;
}
export interface StationView {
  id: string;
  type: StationType;
  item: Item | null; // table: what is on it; agent: what it processes or the finished result
  agent: { state: 'idle' | 'working' | 'ready'; progress: number } | null; // agents only
  incident: { kind: IncidentKind; sequence: Arrow[]; typed: number } | null;
  workProgress: number | null; // 0..1 of the work in progress at this station
}
export interface GameSnapshot {
  phase: 'playing' | 'ended';
  elapsedMs: number;
  durationMs: number;
  score: number; // Math.round of the internal score, never < 0
  held: Item | null;
  speedMultiplier: number;
  tasks: TaskView[]; // pending, oldest first
  stations: StationView[];
  stats: { completed: number; expired: number; incidentsResolved: number };
}
export interface RoundSummary {
  score: number;
  stars: 0 | 1 | 2 | 3;
  completed: number;
  expired: number;
  incidentsResolved: number;
}
