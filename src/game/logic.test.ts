import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPointOnSegment,
  rayIntersectsSegment,
  checkArrowEscape,
  getFreeArrows,
  isLevelSolvable,
  findOverlappingArrows,
  ArrowData,
} from './logic';
import { PRESET_LEVELS } from './levels';

test('isPointOnSegment correctly identifies points on segment', () => {
  const p1 = { x: 2, y: 2 };
  const p2 = { x: 8, y: 2 };

  assert.equal(isPointOnSegment(5, 2, p1, p2), true);
  assert.equal(isPointOnSegment(2, 2, p1, p2), true);
  assert.equal(isPointOnSegment(8, 2, p1, p2), true);
  assert.equal(isPointOnSegment(9, 2, p1, p2), false);
  assert.equal(isPointOnSegment(5, 3, p1, p2), false);
});

test('rayIntersectsSegment detects blocking orthogonal lines', () => {
  const p1 = { x: 5, y: 1 };
  const p2 = { x: 5, y: 6 };

  const hitRight = rayIntersectsSegment(2, 3, 'RIGHT', p1, p2);
  assert.equal(hitRight.hit, true);
  assert.equal(Math.round(hitRight.distance), 3);

  const hitLeft = rayIntersectsSegment(2, 3, 'LEFT', p1, p2);
  assert.equal(hitLeft.hit, false);

  const hitLeft2 = rayIntersectsSegment(7, 3, 'LEFT', p1, p2);
  assert.equal(hitLeft2.hit, true);
  assert.equal(Math.round(hitLeft2.distance), 2);

  const miss = rayIntersectsSegment(2, 8, 'RIGHT', p1, p2);
  assert.equal(miss.hit, false);
});

test('checkArrowEscape and getFreeArrows work on simple 2-arrow puzzle', () => {
  const arrowA: ArrowData = {
    id: 'a',
    points: [{ x: 1, y: 4 }, { x: 2, y: 4 }],
    dir: 'RIGHT',
  };

  const arrowB: ArrowData = {
    id: 'b',
    points: [{ x: 5, y: 6 }, { x: 5, y: 2 }],
    dir: 'UP',
  };

  const escapeA = checkArrowEscape('a', [arrowA, arrowB]);
  assert.equal(escapeA.canEscape, false);
  assert.equal(escapeA.blockerId, 'b');

  const escapeB = checkArrowEscape('b', [arrowA, arrowB]);
  assert.equal(escapeB.canEscape, true);

  const free = getFreeArrows([arrowA, arrowB]);
  assert.equal(free.length, 1);
  assert.equal(free[0].id, 'b');

  const escapeAAfter = checkArrowEscape('a', [arrowA]);
  assert.equal(escapeAAfter.canEscape, true);

  assert.equal(isLevelSolvable([arrowA, arrowB]), true);
});

test('detects unsolvable circular deadlock', () => {
  const a1: ArrowData = { id: '1', points: [{ x: 1, y: 2 }, { x: 3, y: 2 }], dir: 'RIGHT' };
  const a2: ArrowData = { id: '2', points: [{ x: 5, y: 1 }, { x: 5, y: 4 }], dir: 'DOWN' };
  const a3: ArrowData = { id: '3', points: [{ x: 6, y: 6 }, { x: 3, y: 6 }], dir: 'LEFT' };
  const a4: ArrowData = { id: '4', points: [{ x: 1, y: 7 }, { x: 1, y: 3 }], dir: 'UP' };

  assert.equal(isLevelSolvable([a1, a2, a3, a4]), false);
});

test('every preset level has ZERO overlapping arrow segments', () => {
  for (const level of PRESET_LEVELS) {
    const overlaps = findOverlappingArrows(level.arrows);
    assert.equal(
      overlaps.length,
      0,
      `Level ${level.id} (${level.name}) must have 0 overlapping arrows, but found: ${JSON.stringify(overlaps)}`
    );
  }
});

test('all preset levels have valid free arrows at start', () => {
  for (const level of PRESET_LEVELS) {
    const free = getFreeArrows(level.arrows);
    assert.ok(
      free.length > 0,
      `Level ${level.id} (${level.name}) must have at least one free arrow at start, got ${free.length}`
    );
  }
});
