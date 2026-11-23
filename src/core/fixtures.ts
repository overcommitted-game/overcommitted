// Test-only helpers: a fixed config that does not move when the real balance is tuned (T16).
import type { Balance, Recipe, RoundConfig, Station, Step, TaskKind } from './types';
import type { Round } from './round';

const codeThenAgentThenReview: Step[] = [
  { kind: 'work', station: 'notebook', workMs: 3000, needs: null, gives: 'prompt' },
  { kind: 'agent', needs: 'prompt', processMs: 8000, gives: 'pr' },
  { kind: 'work', station: 'notebook', workMs: 2000, needs: 'pr', gives: null },
];

const recipes: Record<TaskKind, Recipe> = {
  clientBug: { steps: codeThenAgentThenReview, timeLimitMs: 70000, points: 60 },
  sideFeature: { steps: codeThenAgentThenReview, timeLimitMs: 80000, points: 40 },
  englishInterview: {
    steps: [
      { kind: 'work', station: 'study', workMs: 4000, needs: null, gives: 'englishNotes' },
      { kind: 'work', station: 'interview', workMs: 4000, needs: 'englishNotes', gives: null },
    ],
    timeLimitMs: 60000,
    points: 50,
  },
  spanishInterview: {
    steps: [{ kind: 'work', station: 'interview', workMs: 4000, needs: null, gives: null }],
    timeLimitMs: 45000,
    points: 30,
  },
  techTest: {
    steps: [
      { kind: 'work', station: 'study', workMs: 4000, needs: null, gives: 'frameworkNotes' },
      { kind: 'work', station: 'notebook', workMs: 3000, needs: 'frameworkNotes', gives: null },
    ],
    timeLimitMs: 60000,
    points: 50,
  },
  jobApplication: {
    steps: [{ kind: 'work', station: 'linkedin', workMs: 1500, needs: null, gives: null }],
    timeLimitMs: 30000,
    points: 10,
  },
};

const stations: Station[] = [
  { id: 'notebook-1', type: 'notebook' },
  { id: 'agent-1', type: 'agent' },
  { id: 'agent-2', type: 'agent' },
  { id: 'agent-3', type: 'agent' },
  { id: 'coffee-1', type: 'coffee' },
  { id: 'study-1', type: 'study' },
  { id: 'interview-1', type: 'interview' },
  { id: 'linkedin-1', type: 'linkedin' },
  { id: 'counter-1', type: 'counter' },
  { id: 'counter-2', type: 'counter' },
  { id: 'counter-3', type: 'counter' },
];

const balance: Balance = {
  durationMs: 300000,
  maxDtMs: 100,
  initialTasks: 0,
  spawnEveryMs: 1e9,
  maxPendingTasks: 5,
  taskWeights: {
    clientBug: 1,
    sideFeature: 1,
    englishInterview: 1,
    spanishInterview: 1,
    techTest: 1,
    jobApplication: 1,
  },
  speedBonusMax: 0.5,
  expirePenalty: 20,
  agentReadyWindowMs: 10000,
  coffee: { workMs: 2000, multiplier: 1.5, durationMs: 20000 },
  incidents: {
    graceMs: 0,
    drainPerSec: 2,
    fire: { meanIntervalMs: 1e12, sequenceLength: 4 },
    npmVuln: { meanIntervalMs: 1e12, sequenceLength: 4 },
    hallucination: { sequenceLength: 3 },
  },
  starThresholds: [100, 200, 300],
};

export function makeConfig(overrides: Partial<Balance> = {}, rng: () => number = () => 0.99): RoundConfig {
  return { balance: { ...balance, ...overrides }, recipes, stations, rng };
}

/** Runs the round for `ms` in 100 ms frames, like the game loop would. */
export function advance(round: Round, ms: number): void {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) round.update(100);
}
