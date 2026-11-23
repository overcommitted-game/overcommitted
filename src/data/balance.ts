import type { Balance } from '../core/types';

// Initial values: they get tuned by playing (T16).
export const BALANCE: Balance = {
  durationMs: 300000,
  maxDtMs: 100,
  initialTasks: 2,
  spawnEveryMs: 18000,
  maxPendingTasks: 5,
  taskWeights: {
    clientBug: 2,
    sideFeature: 1,
    englishInterview: 1,
    spanishInterview: 1,
    techTest: 1,
    jobApplication: 3,
  },
  speedBonusMax: 0.5,
  expirePenalty: 20,
  agentReadyWindowMs: 10000,
  coffee: { workMs: 2000, multiplier: 1.5, durationMs: 20000 },
  incidents: {
    graceMs: 20000,
    drainPerSec: 2,
    fire: { meanIntervalMs: 60000, sequenceLength: 6 },
    npmVuln: { meanIntervalMs: 75000, sequenceLength: 5 },
    hallucination: { sequenceLength: 4 },
  },
  starThresholds: [150, 350, 600],
};
