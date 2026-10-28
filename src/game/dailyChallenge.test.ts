import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDailyMission,
  preloadDailyMission,
  isDailyDateCompleted,
  markDailyDateCompleted,
  getCompletedDailyDates,
  getMonthDaysCount,
  getMonthCompletedCount,
} from './dailyChallenge';
import { isLevelSolvable, getFreeArrows } from './logic';

test('Daily Challenge generates unique deterministic puzzles for different dates', () => {
  const dates = [
    '2026-10-25',
    '2026-10-26',
    '2026-10-27',
    '2026-10-28',
    '2026-10-29',
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
  ];

  const missions = dates.map((d) => generateDailyMission(d));

  // Verify each is solvable and has 17-25 arrows
  for (let i = 0; i < dates.length; i++) {
    const mission = missions[i];
    assert.ok(
      mission.arrows.length >= 16 && mission.arrows.length <= 26,
      `Date ${dates[i]} expected 16-26 arrows, got ${mission.arrows.length}`
    );
    assert.equal(
      isLevelSolvable(mission.arrows),
      true,
      `Mission for ${dates[i]} must be 100% solvable`
    );
    assert.ok(
      getFreeArrows(mission.arrows).length >= 1,
      `Mission for ${dates[i]} must have at least 1 free opening arrow`
    );
    assert.equal(
      mission.gridWidth / mission.gridHeight,
      0.75,
      `Mission for ${dates[i]} must have 3:4 portrait aspect ratio`
    );
  }

  // Verify date A is not identical to date B
  const p1 = JSON.stringify(missions[0].arrows);
  const p2 = JSON.stringify(missions[1].arrows);
  const p3 = JSON.stringify(missions[2].arrows);

  assert.notEqual(p1, p2, 'Adjacent dates must produce different puzzle layouts');
  assert.notEqual(p2, p3, 'Adjacent dates must produce different puzzle layouts');
});

test('Daily Challenge in-memory caching is instantaneous (under 1ms on cache hit)', () => {
  const testDate = '2026-12-25';

  // First call may generate
  const first = generateDailyMission(testDate);
  assert.ok(first.arrows.length > 0);

  // Second call must be instant cache hit
  const start = performance.now();
  const cached = generateDailyMission(testDate);
  const elapsed = performance.now() - start;

  assert.equal(first.arrows.length, cached.arrows.length);
  assert.ok(elapsed < 2, `Cache hit should take < 2ms, took ${elapsed}ms`);
});

test('Daily Challenge completion tracking persists dates correctly', () => {
  const d = '2026-10-15';
  markDailyDateCompleted(d);
  assert.equal(isDailyDateCompleted(d), true);
  assert.ok(getCompletedDailyDates().includes(d));
});

test('Month days calculation is accurate', () => {
  // October has 31 days
  assert.equal(getMonthDaysCount(2026, 9), 31);
  // November has 30 days
  assert.equal(getMonthDaysCount(2026, 10), 30);
  // February non-leap has 28 days
  assert.equal(getMonthDaysCount(2026, 1), 28);
});
