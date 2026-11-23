import type { Recipe, Step, TaskKind } from '../core/types';

const codeThenAgentThenReview: Step[] = [
  { kind: 'work', station: 'notebook', workMs: 3000, needs: null, gives: 'prompt' },
  { kind: 'agent', needs: 'prompt', processMs: 8000, gives: 'pr' },
  { kind: 'work', station: 'notebook', workMs: 2000, needs: 'pr', gives: null },
];

export const RECIPES: Record<TaskKind, Recipe> = {
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
