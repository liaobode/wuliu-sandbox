import { GRID_H, GRID_W } from '../core/constants.js';
import { Conveyor } from '../entities/Conveyor.js';
import { ChainConveyor } from '../entities/ChainConveyor.js';
import { Diverter } from '../entities/Diverter.js';
import { Receiver } from '../entities/Receiver.js';

export const PRESETS = {
  straight: () => {
    const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    const spawners = [];

    for (let x = 1; x < 15; x++) {
      grid[5][x] = Conveyor.create({ dir: 1, speed: 60, transferTime: 0 });
    }
    spawners.push({ x: 1, y: 5, timer: 0, interval: 1000 });
    grid[5][15] = Receiver.create();

    return { grid, spawners };
  },

  'l-turn': () => {
    const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    const spawners = [];

    for (let x = 2; x < 10; x++) {
      grid[3][x] = Conveyor.create({ dir: 1, speed: 60, transferTime: 2 });
    }
    for (let y = 3; y < 10; y++) {
      grid[y][10] = Conveyor.create({ dir: 2, speed: 60, transferTime: 2 });
    }
    grid[10][10] = Receiver.create();
    spawners.push({ x: 2, y: 3, timer: 0, interval: 800 });

    return { grid, spawners };
  },

  'u-turn': () => {
    const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    const spawners = [];

    for (let x = 2; x < 14; x++) {
      grid[2][x] = Conveyor.create({ dir: 1, speed: 80, transferTime: 1.5 });
    }
    for (let y = 2; y < 9; y++) {
      grid[y][14] = Conveyor.create({ dir: 2, speed: 80, transferTime: 1.5 });
    }
    for (let x = 14; x > 2; x--) {
      grid[9][x] = Conveyor.create({ dir: 3, speed: 80, transferTime: 1.5 });
    }
    grid[9][2] = Receiver.create();
    spawners.push({ x: 2, y: 2, timer: 0, interval: 600 });

    return { grid, spawners };
  },

  split: () => {
    const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    const spawners = [];

    for (let x = 2; x < 7; x++) {
      grid[5][x] = Conveyor.create({ dir: 1, speed: 60, transferTime: 0 });
    }

    grid[5][7] = Diverter.create({ dir1: 1, dir2: 4, speed: 60, transferTime: 1 });

    for (let y = 4; y > 1; y--) {
      grid[y][7] = Conveyor.create({ dir: 4, speed: 60, transferTime: 1 });
    }
    for (let x = 7; x < 14; x++) {
      grid[1][x] = Conveyor.create({ dir: 1, speed: 90, transferTime: 0 });
    }
    grid[1][14] = Receiver.create();

    for (let x = 8; x < 14; x++) {
      grid[5][x] = Conveyor.create({ dir: 1, speed: 60, transferTime: 0 });
    }
    grid[5][14] = Receiver.create();

    spawners.push({ x: 2, y: 5, timer: 0, interval: 800 });

    return { grid, spawners };
  },

  'chain-straight': () => {
    const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    const spawners = [];

    for (let x = 2; x < 12; x++) {
      grid[4][x] = ChainConveyor.create({ dir: 1, speed: 12, transferTime: 3 });
    }
    spawners.push({ x: 2, y: 4, timer: 0, interval: 3000 });
    grid[4][12] = Receiver.create();

    return { grid, spawners };
  },

  'chain-l-turn': () => {
    const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    const spawners = [];

    for (let x = 3; x < 8; x++) {
      grid[2][x] = ChainConveyor.create({ dir: 1, speed: 30, transferTime: 3 });
    }
    for (let y = 2; y < 8; y++) {
      grid[y][8] = ChainConveyor.create({ dir: 2, speed: 30, transferTime: 3 });
    }
    grid[8][8] = Receiver.create();
    spawners.push({ x: 3, y: 2, timer: 0, interval: 2500 });

    return { grid, spawners };
  },

  'chain-wharf': () => {
    const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    const spawners = [];

    // 发货口 (左)
    for (let x = 4; x < 10; x++) {
      grid[2][x] = ChainConveyor.create({ dir: 1, speed: 30, transferTime: 3 });
    }
    grid[2][10] = Receiver.create();
    spawners.push({ x: 4, y: 2, timer: 0, interval: 2500 });

    // 收货口 (右，反向)
    for (let x = 10; x > 4; x--) {
      grid[5][x] = ChainConveyor.create({ dir: 3, speed: 30, transferTime: 3 });
    }
    grid[5][4] = Receiver.create();
    spawners.push({ x: 10, y: 5, timer: 0, interval: 2800 });

    return { grid, spawners };
  }
};

export class PresetsManager {
  constructor(store) {
    this.store = store;
  }

  apply(key) {
    if (!PRESETS[key]) return false;

    this.store.pushUndo();
    const preset = PRESETS[key]();
    this.store.state.grid = preset.grid;
    this.store.state.spawners = preset.spawners;
    this.store.state.boxes.length = 0;
    this.store.state.activeTimeMs = 0;
    this.store.state.deliveredCount = 0;
    this.store.state.heatData = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
    this.store.state._onDraw?.();

    return true;
  }
}
