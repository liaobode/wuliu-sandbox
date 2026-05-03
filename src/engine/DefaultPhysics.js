import { GRID_W, GRID_H } from '../core/constants.js';
import { Conveyor } from '../entities/Conveyor.js';
import { Diverter } from '../entities/Diverter.js';
import { Receiver } from '../entities/Receiver.js';
import { Box } from '../entities/Box.js';

/**
 * 物理引擎基类
 */
export class PhysicsEngine {
  /**
   * 更新物理状态
   * @param {State} state - 游戏状态
   * @param {number} dt - 时间增量（毫秒）
   */
  update(state, dt) {
    throw new Error('PhysicsEngine.update() must be implemented');
  }
}

// 辅助函数
function isConveyor(cell) {
  return Conveyor.isType(cell);
}

function isDiverter(cell) {
  return Diverter.isType(cell);
}

function isReceiver(cell) {
  return Receiver.isType(cell);
}

/**
 * 默认物理引擎实现
 */
export class DefaultPhysics extends PhysicsEngine {
  update(state, dt) {
    this._updateSpawners(state, dt);
    this._updateBoxes(state, dt);
  }

  _updateSpawners(state, dt) {
    for (let s of state.spawners) {
      s.timer += dt * state.speed;
      const currentInterval = s.interval || 1000;

      if (s.timer >= currentInterval) {
        const hasBox = state.boxes.some(b =>
          (b.x === s.x && b.y === s.y) ||
          (b.nextX === s.x && b.nextY === s.y)
        );

        if (!hasBox && isConveyor(state.getCell(s.x, s.y))) {
          const cell = state.getCell(s.x, s.y);
          state.addBox(Box.create({ x: s.x, y: s.y, lastDir: cell.dir }));
          s.timer = 0;
        } else if (hasBox) {
          s.timer = currentInterval;
        }
      }
    }
  }

  _updateBoxes(state, dt) {
    // 构建占位地图用于 O(1) 碰撞检测
    const visualMap = new Map();
    const targetMap = new Map();

    for (const b of state.boxes) {
      const vx = Math.round(b.x + (b.nextX - b.x) * b.progress);
      const vy = Math.round(b.y + (b.nextY - b.y) * b.progress);
      visualMap.set(vx + ',' + vy, b);
      const tk = b.nextX + ',' + b.nextY;
      if (!targetMap.has(tk)) targetMap.set(tk, []);
      targetMap.get(tk).push(b);
    }

    for (let i = state.boxes.length - 1; i >= 0; i--) {
      let b = state.boxes[i];

      const currentCell = state.getCell(b.x, b.y);
      const beltSpeed = (currentCell !== 0 && currentCell.speed) ? currentCell.speed : 60;
      const speedCellsPerSec = beltSpeed / 60;
      const progressDelta = (speedCellsPerSec * state.speed * dt) / 1000;

      // 处理移载倒计时
      if (b.transferWait > 0) {
        b.transferWait -= state.speed * dt;
        if (b.transferWait < 0) b.transferWait = 0;
      }

      // 1. 决定目标点
      if (b.x === b.nextX && b.y === b.nextY) {
        let dir = 0;
        let cellTransferTime = 0;

        if (isConveyor(currentCell)) {
          dir = currentCell.dir;
          cellTransferTime = currentCell.transferTime || 0;
        } else if (isDiverter(currentCell)) {
          // 分流器：根据 counter 决定方向，但只在货物首次进入时记录
          dir = currentCell.counter % 2 === 0 ? currentCell.dir1 : currentCell.dir2;
          cellTransferTime = currentCell.transferTime || 0;
          // 只在首次进入分流器时记录，避免重复设置
          if (!b.diverterCell) {
            b.diverterCell = currentCell;
          }
        }

        if (dir !== 0) {
          if (b.lastDir !== 0 && b.lastDir !== dir && cellTransferTime > 0) {
            b.transferWait = cellTransferTime * 1000;
            b.transferTotal = cellTransferTime * 1000;
          }
          b.lastDir = dir;

          if (dir === 1) b.nextX = b.x + 1;
          else if (dir === 2) b.nextY = b.y + 1;
          else if (dir === 3) b.nextX = b.x - 1;
          else if (dir === 4) b.nextY = b.y - 1;
        }
      }

      // 2. 移动
      if ((b.x !== b.nextX || b.y !== b.nextY) && b.transferWait <= 0) {
        let blocked = false;
        const targetKey = b.nextX + ',' + b.nextY;

        // 冲突检测
        const competitors = targetMap.get(targetKey) || [];
        for (const other of competitors) {
          if (other.id === b.id) continue;
          if (other.progress > b.progress) { blocked = true; break; }
          if (other.progress === b.progress && other.id < b.id) { blocked = true; break; }
        }

        if (!blocked) {
          const occupant = visualMap.get(targetKey);
          if (occupant && occupant.id !== b.id) blocked = true;
        }

        if (!blocked) {
          b.progress += progressDelta;
        } else {
          // 记录拥堵数据
          const bvx = Math.round(b.x + (b.nextX - b.x) * b.progress);
          const bvy = Math.round(b.y + (b.nextY - b.y) * b.progress);
          if (bvx >= 0 && bvx < GRID_W && bvy >= 0 && bvy < GRID_H) {
            state.heatData[bvy][bvx] += dt / 1000;
          }
        }

        // 3. 到达目标点
        if (b.progress >= 1.0) {
          b.x = b.nextX;
          b.y = b.nextY;
          b.progress = 0;

          // 货物成功离开分流器，递增 counter
          if (b.diverterCell) {
            b.diverterCell.counter++;
            b.diverterCell = null;
          }

          // 检查是否出界或到达收货站
          let removed = false;
          if (b.x < 0 || b.x >= GRID_W || b.y < 0 || b.y >= GRID_H) {
            removed = true;
          } else {
            const arrivedCell = state.getCell(b.x, b.y);
            if (arrivedCell === 0 || isReceiver(arrivedCell)) {
              if (isReceiver(arrivedCell)) {
                arrivedCell.collected = (arrivedCell.collected || 0) + 1;
              }
              removed = true;
            }
          }

          if (removed) {
            state.boxes.splice(i, 1);
            state.deliveredCount++;
            state.emit('state:box-deliver', { box: b });
          }
        }
      }
    }
  }
}