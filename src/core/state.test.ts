import { describe, expect, test } from 'vitest';
import { makeConfig } from './fixtures';
import { addScore, createState } from './state';

describe('addScore', () => {
  test('adds and subtracts, but never goes below zero', () => {
    const state = createState(makeConfig());
    addScore(state, 10);
    expect(state.score).toBe(10);
    addScore(state, -20);
    expect(state.score).toBe(0);
  });
});
