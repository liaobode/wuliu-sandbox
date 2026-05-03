import { GRID_H, GRID_W } from '../core/constants.js';
import { Conveyor } from '../entities/Conveyor.js';
import { Diverter } from '../entities/Diverter.js';
import { Receiver } from '../entities/Receiver.js';

/**
 * 预设模板
 */
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

    // 入口输送带
    for (let x = 2; x < 7; x++) {
      grid[5][x] = Conveyor.create({ dir: 1, speed: 60, transferTime: 0 });
    }

    // 分流器：直行(dir1=1) 和 向上(dir2=4)
    grid[5][7] = Diverter.create({ dir1: 1, dir2: 4, speed: 60, transferTime: 1 });

    // 上路（向上分流）- 从分流器上方开始，避免覆盖分流器
    for (let y = 4; y > 1; y--) {
      grid[y][7] = Conveyor.create({ dir: 4, speed: 60, transferTime: 1 });
    }
    // 顶部横向输送带
    for (let x = 7; x < 14; x++) {
      grid[1][x] = Conveyor.create({ dir: 1, speed: 90, transferTime: 0 });
    }
    grid[1][14] = Receiver.create();

    // 下路（直行）- 从分流器右边开始，避免覆盖分流器
    for (let x = 8; x < 14; x++) {
      grid[5][x] = Conveyor.create({ dir: 1, speed: 60, transferTime: 0 });
    }
    grid[5][14] = Receiver.create();

    spawners.push({ x: 2, y: 5, timer: 0, interval: 800 });

    return { grid, spawners };
  }
};

/**
 * 预设模板管理
 */
export class PresetsManager {
  constructor(state) {
    this.state = state;
  }

  /**
   * 应用预设模板
   * @param {string} key - 预设名称
   */
  apply(key) {
    if (!PRESETS[key]) return false;

    this.state.pushUndo();
    const preset = PRESETS[key]();
    this.state.grid = preset.grid;
    this.state.spawners = preset.spawners;
    this.state.boxes = [];
    this.state.activeTimeMs = 0;
    this.state.deliveredCount = 0;
    this.state.emit('state:import', preset);

    return true;
  }
}