import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevel, inspectLevel } from './levelManager';
import { checkArrowEscape } from './logic';

test('AUTOMATED 200 LEVEL VALIDATION: Sequential Levels 1 to 200', () => {
  let levelsTested = 0;
  let solvableCount = 0;
  let deadlockCount = 0;
  let spacingFailures = 0;
  let geometryFailures = 0;
  let progressionFailures = 0;

  let prevArrowCount = 0;

  for (let lvl = 1; lvl <= 200; lvl++) {
    levelsTested++;
    const data = inspectLevel(lvl);
    const { level, report } = data;

    // 1. Check sequential level number
    if (level.id !== lvl) {
      progressionFailures++;
    }

    // 2. Check geometry and spacing
    if (!report.passed) {
      if (report.errors.some((e) => e.includes('bounds') || e.includes('direction'))) {
        geometryFailures++;
      }
      if (
        report.errors.some(
          (e) =>
            e.includes('overlapping') ||
            e.includes('too close') ||
            e.includes('touching') ||
            e.includes('intersect')
        )
      ) {
        spacingFailures++;
      }
    }

    // 3. Check deadlock
    if (report.solveResult.deadlock) {
      deadlockCount++;
    }

    // 4. Check solvability
    if (report.solveResult.solvable && report.solveResult.initialFreeCount >= 1) {
      solvableCount++;
    }

    // 5. Verify deterministic replay: calling getLevel(lvl) again yields identical arrows
    const replayLevel = getLevel(lvl);
    assert.equal(
      replayLevel.arrows.length,
      level.arrows.length,
      `Level ${lvl} replay must have identical arrow count`
    );
    assert.deepEqual(
      replayLevel.arrows[0].points,
      level.arrows[0].points,
      `Level ${lvl} replay must have identical first arrow`
    );

    // 6. Verify hint validity: the hint must be a currently free arrow
    const solutionFirst = report.solveResult.solutionOrder[0];
    const canEscape = checkArrowEscape(solutionFirst, level.arrows).canEscape;
    assert.equal(canEscape, true, `Level ${lvl} first solution move must be currently free to escape`);

    assert.ok(report.passed, `Level ${lvl} failed validation with errors: ${report.errors.join(', ')}`);
  }

  // 7. Verify progressive difficulty scaling across landmark levels
  const l1 = getLevel(1);
  const l9 = getLevel(9);
  const l20 = getLevel(20);
  const l50 = getLevel(50);
  const l100 = getLevel(100);
  const l200 = getLevel(200);

  console.log(`\n========================================`);
  console.log(`Difficulty Progression Check:`);
  console.log(`Level   1: ${l1.arrows.length} arrows, Grid ${l1.gridWidth}x${l1.gridHeight}, Score: ${l1.difficultyScore}`);
  console.log(`Level   9: ${l9.arrows.length} arrows, Grid ${l9.gridWidth}x${l9.gridHeight}, Score: ${l9.difficultyScore}`);
  console.log(`Level  20: ${l20.arrows.length} arrows, Grid ${l20.gridWidth}x${l20.gridHeight}, Score: ${l20.difficultyScore}`);
  console.log(`Level  50: ${l50.arrows.length} arrows, Grid ${l50.gridWidth}x${l50.gridHeight}, Score: ${l50.difficultyScore}`);
  console.log(`Level 100: ${l100.arrows.length} arrows, Grid ${l100.gridWidth}x${l100.gridHeight}, Score: ${l100.difficultyScore}`);
  console.log(`Level 200: ${l200.arrows.length} arrows, Grid ${l200.gridWidth}x${l200.gridHeight}, Score: ${l200.difficultyScore}`);
  console.log(`========================================`);
  console.log(`Levels tested: ${levelsTested}`);
  console.log(`Solvable: ${solvableCount}/${levelsTested}`);
  console.log(`Deadlocks: ${deadlockCount}`);
  console.log(`Spacing failures: ${spacingFailures}`);
  console.log(`Geometry failures: ${geometryFailures}`);
  console.log(`Progression failures: ${progressionFailures}`);
  console.log(`========================================\n`);

  assert.equal(levelsTested, 200);
  assert.equal(solvableCount, 200);
  assert.equal(deadlockCount, 0);
  assert.equal(spacingFailures, 0);
  assert.equal(geometryFailures, 0);
  assert.equal(progressionFailures, 0);

  // Progressive scaling asserts
  assert.ok(l9.arrows.length >= 7, 'Level 9 must have at least 7-12 arrows');
  assert.ok(l50.arrows.length > l9.arrows.length, 'Level 50 must have more arrows than Level 9');
  assert.ok(l100.arrows.length > l50.arrows.length, 'Level 100 must have more arrows than Level 50');
  assert.ok(l200.arrows.length > l100.arrows.length, 'Level 200 must have more arrows than Level 100');
  assert.ok((l9.difficultyScore || 0) > (l1.difficultyScore || 0), 'Score must increase Level 1 -> 9');
  assert.ok((l50.difficultyScore || 0) > (l9.difficultyScore || 0), 'Score must increase Level 9 -> 50');
  assert.ok((l100.difficultyScore || 0) > (l50.difficultyScore || 0), 'Score must increase Level 50 -> 100');
  assert.ok((l200.difficultyScore || 0) > (l100.difficultyScore || 0), 'Score must increase Level 100 -> 200');
});
