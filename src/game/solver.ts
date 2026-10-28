import { ArrowData, checkArrowEscape } from './logic';

export interface SolveResult {
  solvable: boolean;
  deadlock: boolean;
  solutionOrder: string[];
  initialFreeCount: number;
}

/**
 * Solves an arrow puzzle by simulating removals step-by-step.
 * Returns whether all arrows can be cleared, whether a deadlock was reached,
 * and the exact solution removal sequence.
 */
export function solvePuzzle(initialArrows: ArrowData[]): SolveResult {
  if (initialArrows.length === 0) {
    return {
      solvable: true,
      deadlock: false,
      solutionOrder: [],
      initialFreeCount: 0,
    };
  }

  let remaining = [...initialArrows];
  const solutionOrder: string[] = [];

  // Check initial free moves
  const initialFree = remaining.filter((a) => checkArrowEscape(a.id, remaining).canEscape);
  const initialFreeCount = initialFree.length;

  if (initialFreeCount === 0) {
    return {
      solvable: false,
      deadlock: true,
      solutionOrder: [],
      initialFreeCount: 0,
    };
  }

  while (remaining.length > 0) {
    // Find all currently unblocked arrows
    const freeArrows = remaining.filter((a) => checkArrowEscape(a.id, remaining).canEscape);

    if (freeArrows.length === 0) {
      // Deadlock! Arrows still remain, but none can escape
      return {
        solvable: false,
        deadlock: true,
        solutionOrder,
        initialFreeCount,
      };
    }

    // Remove the first free arrow
    const nextToRemove = freeArrows[0];
    solutionOrder.push(nextToRemove.id);
    remaining = remaining.filter((a) => a.id !== nextToRemove.id);
  }

  return {
    solvable: true,
    deadlock: false,
    solutionOrder,
    initialFreeCount,
  };
}
