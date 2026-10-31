import { PuzzleLevel } from './logic';

export const PRESET_LEVELS: PuzzleLevel[] = [
  // Level 1: Gentle introduction (6x8 grid, clean, exact integer grid alignment)
  {
    id: 1,
    name: 'Level 1',
    subtitle: 'Find the Free Path',
    difficulty: 'Easy',
    gridWidth: 6,
    gridHeight: 8,
    arrows: [
      {
        id: 'l1_1',
        points: [{ x: 1, y: 1 }, { x: 5, y: 1 }],
        dir: 'RIGHT',
      },
      {
        id: 'l1_2',
        points: [{ x: 5, y: 2 }, { x: 5, y: 6 }],
        dir: 'DOWN',
      },
      {
        id: 'l1_3',
        points: [{ x: 4, y: 7 }, { x: 1, y: 7 }],
        dir: 'LEFT',
      },
      {
        id: 'l1_4',
        points: [{ x: 1, y: 6 }, { x: 1, y: 2 }],
        dir: 'UP',
      },
      {
        id: 'l1_5',
        points: [{ x: 2, y: 4 }, { x: 4, y: 4 }],
        dir: 'RIGHT',
      },
    ],
  },

  // Level 2: Interlocking turns (7x9 grid, clean integer grid alignment)
  {
    id: 2,
    name: 'Level 2',
    subtitle: 'Clear the Board',
    difficulty: 'Easy',
    gridWidth: 7,
    gridHeight: 9,
    arrows: [
      {
        id: 'l2_1',
        points: [{ x: 1, y: 1 }, { x: 5, y: 1 }],
        dir: 'RIGHT',
      },
      {
        id: 'l2_2',
        points: [{ x: 6, y: 2 }, { x: 6, y: 6 }],
        dir: 'DOWN',
      },
      {
        id: 'l2_3',
        points: [{ x: 5, y: 7 }, { x: 2, y: 7 }],
        dir: 'LEFT',
      },
      {
        id: 'l2_4',
        points: [{ x: 1, y: 6 }, { x: 1, y: 2 }],
        dir: 'UP',
      },
      {
        id: 'l2_5',
        points: [{ x: 2, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 5 }],
        dir: 'DOWN',
      },
      {
        id: 'l2_6',
        points: [{ x: 5, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 6 }],
        dir: 'DOWN',
      },
    ],
  },

  // Level 3: Labyrinth Weave (8x10 grid, exact integer coordinates)
  {
    id: 3,
    name: 'Level 3',
    subtitle: 'Clear the Board',
    difficulty: 'Medium',
    gridWidth: 8,
    gridHeight: 10,
    arrows: [
      {
        id: 'l3_1',
        points: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 1, y: 1 }],
        dir: 'LEFT',
      },
      {
        id: 'l3_2',
        points: [{ x: 1, y: 3 }, { x: 1, y: 6 }],
        dir: 'DOWN',
      },
      {
        id: 'l3_3',
        points: [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 1 }],
        dir: 'UP',
      },
      {
        id: 'l3_4',
        points: [{ x: 5, y: 3 }, { x: 5, y: 2 }, { x: 7, y: 2 }],
        dir: 'RIGHT',
      },
      {
        id: 'l3_5',
        points: [{ x: 6, y: 4 }, { x: 7, y: 4 }, { x: 7, y: 7 }],
        dir: 'DOWN',
      },
      {
        id: 'l3_6',
        points: [{ x: 3, y: 6 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 8 }],
        dir: 'DOWN',
      },
      {
        id: 'l3_7',
        points: [
          { x: 4, y: 6 },
          { x: 4, y: 5 },
          { x: 6, y: 5 },
          { x: 6, y: 8 },
          { x: 5, y: 8 },
          { x: 5, y: 9 },
          { x: 7, y: 9 },
        ],
        dir: 'RIGHT',
      },
      {
        id: 'l3_8',
        points: [
          { x: 4, y: 7 },
          { x: 4, y: 8 },
          { x: 3, y: 8 },
          { x: 3, y: 9 },
          { x: 2, y: 9 },
        ],
        dir: 'LEFT',
      },
    ],
  },
];
