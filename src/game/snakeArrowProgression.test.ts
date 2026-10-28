import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSnakeArrowStage,
  getSnakeTargetArrowCount,
  getSnakeDifficultyLabel,
} from './snakeArrowLogic';
import { validateLevel } from './validator';
import { solvePuzzle } from './solver';

test('Snake Arrow Target Arrow Counts match exact user progression', () => {
  assert.equal(getSnakeTargetArrowCount(1), 4);
  assert.equal(getSnakeTargetArrowCount(2), 5);
  assert.equal(getSnakeTargetArrowCount(3), 6);
  assert.equal(getSnakeTargetArrowCount(4), 7);
  assert.equal(getSnakeTargetArrowCount(5), 8);
  assert.equal(getSnakeTargetArrowCount(6), 9);
  assert.equal(getSnakeTargetArrowCount(7), 10);
  assert.equal(getSnakeTargetArrowCount(8), 11);
  assert.equal(getSnakeTargetArrowCount(9), 12);
  assert.equal(getSnakeTargetArrowCount(10), 13);
  assert.equal(getSnakeTargetArrowCount(15), 18);
  assert.equal(getSnakeTargetArrowCount(20), 23);
  assert.ok(getSnakeTargetArrowCount(21) >= 24);
});

test('Snake Arrow Difficulty Labels match exact user specification', () => {
  // Level 1–3: EASY
  assert.equal(getSnakeDifficultyLabel(1), 'EASY');
  assert.equal(getSnakeDifficultyLabel(2), 'EASY');
  assert.equal(getSnakeDifficultyLabel(3), 'EASY');

  // Level 4–7: NORMAL
  assert.equal(getSnakeDifficultyLabel(4), 'NORMAL');
  assert.equal(getSnakeDifficultyLabel(5), 'NORMAL');
  assert.equal(getSnakeDifficultyLabel(6), 'NORMAL');
  assert.equal(getSnakeDifficultyLabel(7), 'NORMAL');

  // Level 8–12: HARD
  assert.equal(getSnakeDifficultyLabel(8), 'HARD');
  assert.equal(getSnakeDifficultyLabel(9), 'HARD');
  assert.equal(getSnakeDifficultyLabel(10), 'HARD');
  assert.equal(getSnakeDifficultyLabel(11), 'HARD');
  assert.equal(getSnakeDifficultyLabel(12), 'HARD');

  // Level 13–20: VERY HARD
  assert.equal(getSnakeDifficultyLabel(13), 'VERY HARD');
  assert.equal(getSnakeDifficultyLabel(17), 'VERY HARD');
  assert.equal(getSnakeDifficultyLabel(20), 'VERY HARD');

  // Level 21+: EXPERT
  assert.equal(getSnakeDifficultyLabel(21), 'EXPERT');
  assert.equal(getSnakeDifficultyLabel(30), 'EXPERT');
});

test('Snake Arrow stages 1 through 15 are 100% solvable with exact arrow counts', () => {
  for (let stage = 1; stage <= 15; stage++) {
    const puzzle = generateSnakeArrowStage(stage);
    const expectedCount = getSnakeTargetArrowCount(stage);

    assert.equal(
      puzzle.arrows.length,
      expectedCount,
      `Stage ${stage} must have exactly ${expectedCount} arrows, but got ${puzzle.arrows.length}`
    );

    // Verify complete solvability
    const solve = solvePuzzle(puzzle.arrows);
    assert.equal(
      solve.solvable,
      true,
      `Stage ${stage} must be mathematically solvable to completion`
    );
    assert.equal(
      solve.deadlock,
      false,
      `Stage ${stage} must not contain any deadlocks`
    );
    assert.ok(
      solve.initialFreeCount >= 1,
      `Stage ${stage} must have at least 1 valid opening move`
    );

    // Verify geometry validation
    const report = validateLevel(puzzle.arrows, puzzle.gridWidth, puzzle.gridHeight);
    assert.equal(
      report.passed,
      true,
      `Stage ${stage} geometry validation failed: ${report.errors.join(', ')}`
    );
  }
});

test('Level 8 is strictly harder than Level 7 and Level 6', () => {
  const l6 = generateSnakeArrowStage(6);
  const l7 = generateSnakeArrowStage(7);
  const l8 = generateSnakeArrowStage(8);

  assert.equal(l6.arrows.length, 9);
  assert.equal(l7.arrows.length, 10);
  assert.equal(l8.arrows.length, 11);

  assert.ok(l8.arrows.length > l7.arrows.length);
  assert.ok(l7.arrows.length > l6.arrows.length);
  assert.ok(l8.gridWidth >= l7.gridWidth);
});
