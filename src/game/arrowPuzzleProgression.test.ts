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

test('Challenging levels (including Level 39 HARD) have only 2-3 initially free arrows, multi-bend labyrinth geometry, and step-by-step unlocking chains', () => {
  const testLevels = [
    { lvl: 5, tier: 'EASY', maxInitialFree: 4, minDepth: 5 },
    { lvl: 18, tier: 'MEDIUM', maxInitialFree: 3, minDepth: 8 },
    { lvl: 39, tier: 'HARD', maxInitialFree: 3, minDepth: 12 },
    { lvl: 50, tier: 'HARD', maxInitialFree: 3, minDepth: 14 },
    { lvl: 100, tier: 'EXPERT', maxInitialFree: 3, minDepth: 18 },
  ];

  for (const spec of testLevels) {
    const level = generateLevel(spec.lvl);
    const total = level.arrows.length;
    const initialFree = getFreeArrows(level.arrows);

    // 1. Only 2-3 arrows should be initially available on challenging levels
    assert.ok(
      initialFree.length >= 2 && initialFree.length <= spec.maxInitialFree,
      `Level ${spec.lvl} (${spec.tier}) must have 2-${spec.maxInitialFree} initially available arrows, got ${initialFree.length}/${total}`
    );

    // 2. Remaining arrows must be genuinely blocked with a valid blockerId
    const freeIds = new Set(initialFree.map((a) => a.id));
    const blockedArrows = level.arrows.filter((a) => !freeIds.has(a.id));
    assert.equal(
      blockedArrows.length,
      total - initialFree.length,
      `Level ${spec.lvl} must have ${total - initialFree.length} blocked arrows at start`
    );

    // 3. Majority of arrows must have 90-degree labyrinth bends (not straight lines)
    const bentArrows = level.arrows.filter((a) => a.points.length >= 3);
    assert.ok(
      bentArrows.length >= Math.floor(total * 0.75),
      `Level ${spec.lvl} must have >=75% bent labyrinth arrows, got ${bentArrows.length}/${total}`
    );

    // 4. Step-by-step dynamic unlocking simulation: removing free arrows unlocks blocked arrows in sequence
    let board = [...level.arrows];
    let waves = 0;
    while (board.length > 0) {
      const currentlyFree = getFreeArrows(board);
      assert.ok(
        currentlyFree.length >= 1,
        `Level ${spec.lvl} encountered deadlock with ${board.length} arrows left`
      );
      waves++;
      const currentFreeSet = new Set(currentlyFree.map((a) => a.id));
      board = board.filter((a) => !currentFreeSet.has(a.id));
    }

    assert.ok(
      waves >= spec.minDepth,
      `Level ${spec.lvl} (${spec.tier}) must require at least ${spec.minDepth} sequential unlocking waves, got ${waves}`
    );
  }
});

