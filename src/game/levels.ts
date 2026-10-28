import { PuzzleLevel } from './logic';

export const PRESET_LEVELS: PuzzleLevel[] = [
  // Level 1: Gentle introduction (6x6 grid, clean, non-overlapping)
  {
    id: 1,
    name: 'Level 1',
    subtitle: 'Find the Free Path',
    difficulty: 'Easy',
    gridWidth: 6,
    gridHeight: 6,
    arrows: [
      {
        id: 'l1_1',
        points: [{ x: 1, y: 1 }, { x: 5, y: 1 }],
        dir: 'RIGHT',
      },
      {
        id: 'l1_2',
        points: [{ x: 5, y: 2 }, { x: 5, y: 5 }],
        dir: 'DOWN',
      },
      {
        id: 'l1_3',
        points: [{ x: 4, y: 5 }, { x: 1, y: 5 }],
        dir: 'LEFT',
      },
      {
        id: 'l1_4',
        points: [{ x: 1, y: 4 }, { x: 1, y: 2 }],
        dir: 'UP',
      },
      {
        id: 'l1_5',
        points: [{ x: 2, y: 3 }, { x: 4, y: 3 }],
        dir: 'RIGHT',
      },
    ],
  },

  // Level 2: Interlocking turns (7x7 grid, clean, non-overlapping)
  {
    id: 2,
    name: 'Level 2',
    subtitle: 'Clear the Board',
    difficulty: 'Easy',
    gridWidth: 7,
    gridHeight: 7,
    arrows: [
      {
        id: 'l2_1',
        points: [{ x: 1, y: 1 }, { x: 5, y: 1 }],
        dir: 'RIGHT',
      },
      {
        id: 'l2_2',
        points: [{ x: 6, y: 2 }, { x: 6, y: 5 }],
        dir: 'DOWN',
      },
      {
        id: 'l2_3',
        points: [{ x: 5, y: 6 }, { x: 2, y: 6 }],
        dir: 'LEFT',
      },
      {
        id: 'l2_4',
        points: [{ x: 1, y: 5 }, { x: 1, y: 2 }],
        dir: 'UP',
      },
      {
        id: 'l2_5',
        points: [{ x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
        dir: 'DOWN',
      },
      {
        id: 'l2_6',
        points: [{ x: 5, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 5 }],
        dir: 'DOWN',
      },
      {
        id: 'l2_7',
        points: [{ x: 2, y: 3 }, { x: 3, y: 3 }],
        dir: 'RIGHT',
      },
    ],
  },

  // Level 3: Level 168 - Clear The Board (Directly matching user image unnamed__2)
  {
    id: 3,
    name: 'Level 168',
    subtitle: 'Clear the Board',
    difficulty: 'Medium',
    gridWidth: 8,
    gridHeight: 9,
    arrows: [
      // Top left hook pointing LEFT: [1.8, 2.2] -> [2.6, 2.2] -> [2.6, 1.2] -> [1.4, 1.2]
      {
        id: 'l3_1',
        points: [{ x: 1.8, y: 2.2 }, { x: 2.6, y: 2.2 }, { x: 2.6, y: 1.2 }, { x: 1.4, y: 1.2 }],
        dir: 'LEFT',
      },
      // Left vertical straight down: [1.4, 2.8] -> [1.4, 5.0]
      {
        id: 'l3_2',
        points: [{ x: 1.4, y: 2.8 }, { x: 1.4, y: 5.0 }],
        dir: 'DOWN',
      },
      // Center top S-bend pointing UP: [3.2, 3.2] -> [4.2, 3.2] -> [4.2, 1.2]
      {
        id: 'l3_3',
        points: [{ x: 3.2, y: 3.2 }, { x: 4.2, y: 3.2 }, { x: 4.2, y: 1.2 }],
        dir: 'UP',
      },
      // Upper right L-turn pointing RIGHT: [5.0, 2.8] -> [5.0, 2.0] -> [6.8, 2.0]
      {
        id: 'l3_4',
        points: [{ x: 5.0, y: 2.8 }, { x: 5.0, y: 2.0 }, { x: 6.8, y: 2.0 }],
        dir: 'RIGHT',
      },
      // Right edge down arrow: [5.8, 3.2] -> [6.8, 3.2] -> [6.8, 5.5]
      {
        id: 'l3_5',
        points: [{ x: 5.8, y: 3.2 }, { x: 6.8, y: 3.2 }, { x: 6.8, y: 5.5 }],
        dir: 'DOWN',
      },
      // Left-center inverted U pointing DOWN: [2.6, 5.0] -> [2.6, 2.6] -> [2.0, 2.6] -> [2.0, 7.2]
      {
        id: 'l3_6',
        points: [{ x: 2.6, y: 5.0 }, { x: 2.6, y: 2.6 }, { x: 2.0, y: 2.6 }, { x: 2.0, y: 7.2 }],
        dir: 'DOWN',
      },
      // Center branching U loop pointing RIGHT: [4.2, 5.0] -> [4.2, 4.2] -> [5.8, 4.2] -> [5.8, 6.5] -> [5.0, 6.5] -> [5.0, 7.2] -> [6.0, 7.2]
      {
        id: 'l3_7',
        points: [
          { x: 4.2, y: 5.0 },
          { x: 4.2, y: 4.2 },
          { x: 5.8, y: 4.2 },
          { x: 5.8, y: 6.5 },
          { x: 5.0, y: 6.5 },
          { x: 5.0, y: 7.2 },
          { x: 6.0, y: 7.2 },
        ],
        dir: 'RIGHT',
      },
      // Bottom zigzag pointing LEFT: [4.2, 5.8] -> [4.2, 7.2] -> [3.4, 7.2] -> [3.4, 8.0] -> [2.4, 8.0]
      {
        id: 'l3_8',
        points: [
          { x: 4.2, y: 5.8 },
          { x: 4.2, y: 7.2 },
          { x: 3.4, y: 7.2 },
          { x: 3.4, y: 8.0 },
          { x: 2.4, y: 8.0 },
        ],
        dir: 'LEFT',
      },
    ],
  },

  // Level 4: Level 42 - Heart Shape (The Iconic Featured Level from Video & Sample Images 1 & 5)
  // Completely redesigned with ZERO overlapping segments: each horizontal bar and vertical comb has its own dedicated track!
  {
    id: 4,
    name: 'Level 42',
    subtitle: 'Find the Free Path',
    difficulty: 'Hard',
    gridWidth: 15,
    gridHeight: 15,
    shapeOutline: 'M 7.5,13.8 C 0.8,8.5 0.8,2.0 7.5,5.2 C 14.2,2.0 14.2,8.5 7.5,13.8 Z',
    arrows: [
      // Top left lobe outer escape
      {
        id: 'h_1',
        points: [{ x: 4.5, y: 1.2 }, { x: 2.2, y: 1.2 }],
        dir: 'LEFT',
      },
      // Top left outer vertical
      {
        id: 'h_2',
        points: [{ x: 1.2, y: 4.5 }, { x: 1.2, y: 2.0 }],
        dir: 'UP',
      },
      // Top left inner hook
      {
        id: 'h_3',
        points: [{ x: 2.2, y: 3.0 }, { x: 4.8, y: 3.0 }, { x: 4.8, y: 2.0 }, { x: 3.0, y: 2.0 }],
        dir: 'LEFT',
      },
      // Top left small inner bar
      {
        id: 'h_4',
        points: [{ x: 2.2, y: 4.0 }, { x: 3.8, y: 4.0 }],
        dir: 'RIGHT',
      },

      // Top right lobe outer escape
      {
        id: 'h_5',
        points: [{ x: 9.5, y: 1.2 }, { x: 11.8, y: 1.2 }],
        dir: 'RIGHT',
      },
      // Top right outer vertical
      {
        id: 'h_6',
        points: [{ x: 12.8, y: 4.5 }, { x: 12.8, y: 2.0 }],
        dir: 'UP',
      },
      // Top right inner spiral
      {
        id: 'h_7',
        points: [{ x: 11.8, y: 3.0 }, { x: 9.2, y: 3.0 }, { x: 9.2, y: 2.0 }, { x: 11.0, y: 2.0 }],
        dir: 'RIGHT',
      },
      // Top right small inner bar
      {
        id: 'h_8',
        points: [{ x: 11.8, y: 4.0 }, { x: 10.2, y: 4.0 }],
        dir: 'LEFT',
      },

      // Center cleft vertical arrows
      {
        id: 'h_9',
        points: [{ x: 6.5, y: 4.8 }, { x: 6.5, y: 1.5 }],
        dir: 'UP',
      },
      {
        id: 'h_10',
        points: [{ x: 7.5, y: 4.8 }, { x: 7.5, y: 1.5 }],
        dir: 'UP',
      },

      // Middle chest distinct horizontal bars (each on its own Y coordinate!)
      {
        id: 'h_11',
        points: [{ x: 1.2, y: 5.0 }, { x: 12.8, y: 5.0 }],
        dir: 'RIGHT',
      },
      {
        id: 'h_12',
        points: [{ x: 12.8, y: 5.8 }, { x: 1.2, y: 5.8 }],
        dir: 'LEFT',
      },
      {
        id: 'h_13',
        points: [{ x: 1.8, y: 6.6 }, { x: 12.2, y: 6.6 }],
        dir: 'RIGHT',
      },
      {
        id: 'h_14',
        points: [{ x: 12.2, y: 7.4 }, { x: 1.8, y: 7.4 }],
        dir: 'LEFT',
      },
      {
        id: 'h_15',
        points: [{ x: 2.5, y: 8.2 }, { x: 11.5, y: 8.2 }],
        dir: 'RIGHT',
      },
      {
        id: 'h_16',
        points: [{ x: 11.5, y: 9.0 }, { x: 2.5, y: 9.0 }],
        dir: 'LEFT',
      },

      // Lower V-comb (each on its own X coordinate!)
      {
        id: 'h_17',
        points: [{ x: 3.2, y: 9.8 }, { x: 3.2, y: 11.0 }],
        dir: 'DOWN',
      },
      {
        id: 'h_18',
        points: [{ x: 4.0, y: 11.4 }, { x: 4.0, y: 9.8 }],
        dir: 'UP',
      },
      {
        id: 'h_19',
        points: [{ x: 4.8, y: 9.8 }, { x: 4.8, y: 12.0 }],
        dir: 'DOWN',
      },
      {
        id: 'h_20',
        points: [{ x: 5.6, y: 12.4 }, { x: 5.6, y: 9.8 }],
        dir: 'UP',
      },
      {
        id: 'h_21',
        points: [{ x: 6.4, y: 9.8 }, { x: 6.4, y: 13.0 }],
        dir: 'DOWN',
      },
      {
        id: 'h_22',
        points: [{ x: 7.0, y: 9.8 }, { x: 7.0, y: 13.8 }],
        dir: 'DOWN',
      },
      {
        id: 'h_23',
        points: [{ x: 7.6, y: 13.0 }, { x: 7.6, y: 9.8 }],
        dir: 'UP',
      },
      {
        id: 'h_24',
        points: [{ x: 8.4, y: 9.8 }, { x: 8.4, y: 12.4 }],
        dir: 'DOWN',
      },
      {
        id: 'h_25',
        points: [{ x: 9.2, y: 12.0 }, { x: 9.2, y: 9.8 }],
        dir: 'UP',
      },
      {
        id: 'h_26',
        points: [{ x: 10.0, y: 9.8 }, { x: 10.0, y: 11.4 }],
        dir: 'DOWN',
      },
      {
        id: 'h_27',
        points: [{ x: 10.8, y: 11.0 }, { x: 10.8, y: 9.8 }],
        dir: 'UP',
      },

      // Bottom tip hooks
      {
        id: 'h_28',
        points: [{ x: 7.0, y: 14.4 }, { x: 5.8, y: 14.4 }],
        dir: 'LEFT',
      },
      {
        id: 'h_29',
        points: [{ x: 7.0, y: 14.4 }, { x: 8.2, y: 14.4 }],
        dir: 'RIGHT',
      },
    ],
  },

  // Level 5: Level 239 - Labyrinth Weave (Directly matching user image unnamed__3)
  // Perfectly non-overlapping distinct corridors!
  {
    id: 5,
    name: 'Level 239',
    subtitle: 'Use Helpful Hints',
    difficulty: 'Hard',
    gridWidth: 10,
    gridHeight: 11,
    arrows: [
      // Top horizontal roof bar: [2.0, 1.0] -> [8.0, 1.0] -> [8.0, 2.0]
      {
        id: 'l5_1',
        points: [{ x: 2.0, y: 1.0 }, { x: 8.0, y: 1.0 }, { x: 8.0, y: 2.0 }],
        dir: 'DOWN',
      },
      // Leftmost vertical line straight UP: [1.2, 7.8] -> [1.2, 1.0]
      {
        id: 'l5_2',
        points: [{ x: 1.2, y: 7.8 }, { x: 1.2, y: 1.0 }],
        dir: 'UP',
      },
      // Left inverted U: [2.0, 6.8] -> [2.0, 1.8] -> [2.8, 1.8] -> [2.8, 5.8]
      {
        id: 'l5_3',
        points: [{ x: 2.0, y: 6.8 }, { x: 2.0, y: 1.8 }, { x: 2.8, y: 1.8 }, { x: 2.8, y: 5.8 }],
        dir: 'DOWN',
      },
      // Inner hook top-left: [3.6, 4.2] -> [4.4, 4.2] -> [4.4, 3.2] -> [5.2, 3.2]
      {
        id: 'l5_4',
        points: [{ x: 3.6, y: 4.2 }, { x: 4.4, y: 4.2 }, { x: 4.4, y: 3.2 }, { x: 5.2, y: 3.2 }],
        dir: 'RIGHT',
      },
      // Upper right hook: [8.0, 4.2] -> [8.0, 3.2] -> [6.2, 3.2]
      {
        id: 'l5_5',
        points: [{ x: 8.0, y: 4.2 }, { x: 8.0, y: 3.2 }, { x: 6.2, y: 3.2 }],
        dir: 'LEFT',
      },
      // Middle right shelf: [6.6, 5.0] -> [7.4, 5.0] -> [7.4, 4.2] -> [5.6, 4.2]
      {
        id: 'l5_6',
        points: [{ x: 6.6, y: 5.0 }, { x: 7.4, y: 5.0 }, { x: 7.4, y: 4.2 }, { x: 5.6, y: 4.2 }],
        dir: 'LEFT',
      },
      // Center blue highlighted path from image 3: [5.0, 8.0] -> [4.2, 8.0] -> [4.2, 5.2] -> [3.4, 5.2]
      {
        id: 'l5_7',
        points: [{ x: 5.0, y: 8.0 }, { x: 4.2, y: 8.0 }, { x: 4.2, y: 5.2 }, { x: 3.4, y: 5.2 }],
        dir: 'LEFT',
      },
      // Bottom left hook: [2.0, 8.0] -> [2.0, 9.2] -> [3.8, 9.2]
      {
        id: 'l5_8',
        points: [{ x: 2.0, y: 8.0 }, { x: 2.0, y: 9.2 }, { x: 3.8, y: 9.2 }],
        dir: 'RIGHT',
      },
      // Bottom right maze paths: [5.2, 9.2] -> [5.2, 8.2] -> [7.2, 8.2] -> [7.2, 7.0]
      {
        id: 'l5_9',
        points: [{ x: 5.2, y: 9.2 }, { x: 5.2, y: 8.2 }, { x: 7.2, y: 8.2 }, { x: 7.2, y: 7.0 }],
        dir: 'UP',
      },
      // Bottom right horizontal escape: [8.0, 9.8] -> [5.4, 9.8]
      {
        id: 'l5_10',
        points: [{ x: 8.0, y: 9.8 }, { x: 5.4, y: 9.8 }],
        dir: 'LEFT',
      },
    ],
  },

  // Level 6: Train Your Brain - The Leaf (From user sample unnamed__4)
  {
    id: 6,
    name: 'Level 6',
    subtitle: 'Train Your Brain',
    difficulty: 'Hard',
    gridWidth: 12,
    gridHeight: 14,
    arrows: [
      {
        id: 'lf_stem',
        points: [{ x: 9.5, y: 13.0 }, { x: 11.2, y: 13.0 }],
        dir: 'RIGHT',
      },
      {
        id: 'lf_stem2',
        points: [{ x: 8.5, y: 12.0 }, { x: 10.2, y: 12.0 }],
        dir: 'RIGHT',
      },
      {
        id: 'lf_tip',
        points: [{ x: 3.0, y: 3.0 }, { x: 3.0, y: 1.2 }, { x: 4.5, y: 1.2 }],
        dir: 'RIGHT',
      },
      {
        id: 'lf_l1',
        points: [{ x: 2.0, y: 2.0 }, { x: 2.0, y: 5.0 }],
        dir: 'DOWN',
      },
      {
        id: 'lf_l2',
        points: [{ x: 2.0, y: 6.0 }, { x: 2.0, y: 9.0 }],
        dir: 'DOWN',
      },
      {
        id: 'lf_r1',
        points: [{ x: 3.2, y: 4.0 }, { x: 5.0, y: 4.0 }, { x: 5.0, y: 3.0 }],
        dir: 'UP',
      },
      {
        id: 'lf_r2',
        points: [{ x: 4.2, y: 5.0 }, { x: 6.0, y: 5.0 }, { x: 6.0, y: 4.0 }],
        dir: 'UP',
      },
      {
        id: 'lf_r3',
        points: [{ x: 5.2, y: 6.0 }, { x: 7.0, y: 6.0 }, { x: 7.0, y: 5.0 }],
        dir: 'UP',
      },
      {
        id: 'lf_rib_m',
        points: [{ x: 4.0, y: 7.0 }, { x: 8.0, y: 7.0 }],
        dir: 'RIGHT',
      },
      {
        id: 'lf_rib_d1',
        points: [{ x: 7.0, y: 8.0 }, { x: 4.0, y: 8.0 }],
        dir: 'LEFT',
      },
      {
        id: 'lf_rib_d2',
        points: [{ x: 8.0, y: 9.0 }, { x: 5.0, y: 9.0 }],
        dir: 'LEFT',
      },
      {
        id: 'lf_rib_d3',
        points: [{ x: 8.0, y: 10.0 }, { x: 5.0, y: 10.0 }, { x: 5.0, y: 11.0 }],
        dir: 'DOWN',
      },
      {
        id: 'lf_rib_bot',
        points: [{ x: 6.0, y: 11.5 }, { x: 8.0, y: 11.5 }],
        dir: 'RIGHT',
      },
    ],
  },
];
