import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLevel } from './generator';
import { isLevelSolvable, getFreeArrows } from './logic';

test('Levels 1-10 have target arrow counts ~12-21 while remaining easy', () => {
  const expectedTargets = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  for (let i = 0; i < expectedTargets.length; i++) {
    const levelNumber = i + 1;
    const target = expectedTargets[i];
    const level = generateLevel(levelNumber);

    // Arrow count should be very close to target (~12 to ~21)
    assert.ok(
      level.arrows.length >= target - 1 && level.arrows.length <= target + 1,
      `Level ${levelNumber} expected around ${target} arrows, got ${level.arrows.length}`
    );

    // Separated difficulty: Level 1-10 are categorized as Beginner/Easy
    assert.equal(
      level.difficulty,
      'Beginner',
      `Level ${levelNumber} should have Beginner difficulty, got ${level.difficulty}`
    );

    // Must be 100% solvable
    assert.equal(
      isLevelSolvable(level.arrows),
      true,
      `Level ${levelNumber} must be 100% solvable`
    );

    // Must have free arrows at start
    const freeArrows = getFreeArrows(level.arrows);
    assert.ok(
      freeArrows.length >= 1,
      `Level ${levelNumber} must have at least 1 free arrow at start, got ${freeArrows.length}`
    );
  }
});

test('Every level from 1 to 30 strictly adheres to portrait 3:4 aspect ratio', () => {
  for (let levelNumber = 1; levelNumber <= 30; levelNumber++) {
    const level = generateLevel(levelNumber);

    // Aspect ratio check
    const ratio = level.gridWidth / level.gridHeight;
    assert.equal(
      ratio,
      0.75,
      `Level ${levelNumber} grid ${level.gridWidth}x${level.gridHeight} must have exact 3:4 aspect ratio (0.75), got ${ratio}`
    );

    // Never landscape
    assert.ok(
      level.gridWidth < level.gridHeight,
      `Level ${levelNumber} must be portrait (width < height), got ${level.gridWidth}x${level.gridHeight}`
    );

    // 100% solvable
    assert.equal(
      isLevelSolvable(level.arrows),
      true,
      `Level ${levelNumber} must be 100% solvable`
    );
  }
});

test('Higher levels smoothly scale arrow counts and grid dimensions in 3:4 portrait', () => {
  const l15 = generateLevel(15);
  const l30 = generateLevel(30);
  const l50 = generateLevel(50);

  assert.ok(l15.arrows.length >= 22, `Level 15 arrows should be >= 22, got ${l15.arrows.length}`);
  assert.ok(l30.arrows.length >= 35, `Level 30 arrows should be >= 35, got ${l30.arrows.length}`);
  assert.ok(l50.arrows.length >= 45, `Level 50 arrows should be >= 45, got ${l50.arrows.length}`);

  assert.equal(l15.gridWidth / l15.gridHeight, 0.75);
  assert.equal(l30.gridWidth / l30.gridHeight, 0.75);
  assert.equal(l50.gridWidth / l50.gridHeight, 0.75);
});
