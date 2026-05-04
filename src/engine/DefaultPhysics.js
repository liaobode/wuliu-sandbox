import { GRID_W, GRID_H } from '../core/constants.js';
import { Conveyor } from '../entities/Conveyor.js';
import { ChainConveyor } from '../entities/ChainConveyor.js';
import { ChainTransfer } from '../entities/ChainTransfer.js';
import { Diverter } from '../entities/Diverter.js';
import { Receiver } from '../entities/Receiver.js';
import { Box } from '../entities/Box.js';
import { Pallet } from '../entities/Pallet.js';

export class PhysicsEngine {
  update(state, dt) {
    throw new Error('PhysicsEngine.update() must be implemented');
  }
}

function isBeltConveyor(cell) { return Conveyor.isType(cell); }
function isChainConveyor(cell) { return ChainConveyor.isType(cell); }
function isChainTransfer(cell) { return ChainTransfer.isType(cell); }
function isAnyConveyor(cell) { return isBeltConveyor(cell) || isChainConveyor(cell) || isChainTransfer(cell); }
function isDiverter(cell) { return Diverter.isType(cell); }
function isReceiver(cell) { return Receiver.isType(cell); }

function isCompatibleConveyor(cell, cargo) {
  if (cargo.cargoType === 'pallet') return isChainConveyor(cell) || isChainTransfer(cell);
  return isBeltConveyor(cell);
}

export class DefaultPhysics extends PhysicsEngine {
  update(state, dt) {
    this._updateSpawners(state, dt);
    this._updateCargo(state, dt);
  }

  _updateSpawners(state, dt) {
    for (let s of state.spawners) {
      s.timer += dt * state.speed;
      const currentInterval = s.interval || 1000;

      if (s.timer >= currentInterval) {
        const hasCargo = state.boxes.some(b =>
          (b.x === s.x && b.y === s.y) ||
          (b.nextX === s.x && b.nextY === s.y)
        );

        const cell = state.getCell(s.x, s.y);
        // 根据脚下传送带类型决定货物类型
        const isBelt = isBeltConveyor(cell);
        const isChain = isChainConveyor(cell);

        if (!hasCargo && (isBelt || isChain)) {
          if (isBelt) {
            state.addBox(Box.create({ x: s.x, y: s.y, lastDir: cell.dir, w: state.boxWidth, h: state.boxHeight }));
          } else {
            state.addBox(Pallet.create({ x: s.x, y: s.y, lastDir: cell.dir, w: state.palletWidth, h: state.palletHeight }));
          }
          s.timer = 0;
        } else if (hasCargo) {
          s.timer = currentInterval;
        }
      }
    }
  }

  _updateCargo(state, dt) {
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
      const defaultSpeed = b.cargoType === 'pallet' ? 12 : 60;
      const beltSpeed = (currentCell !== 0 && currentCell.speed) ? currentCell.speed : defaultSpeed;
      const speedCellsPerSec = beltSpeed / 60;
      const progressDelta = (speedCellsPerSec * state.speed * dt) / 1000;

      if (b.transferWait > 0) {
        b.transferWait -= state.speed * dt;
        if (b.transferWait < 0) b.transferWait = 0;
      }

      // 1. 决定目标点
      if (b.x === b.nextX && b.y === b.nextY) {
        let dir = 0;
        let cellTransferTime = 0;

        if (isCompatibleConveyor(currentCell, b)) {
          // 链条机无移载机时只能直行，不能转弯
          if (isChainConveyor(currentCell) && b.lastDir !== 0 && b.lastDir !== currentCell.dir) {
            dir = 0;
          } else {
            dir = currentCell.dir;
            cellTransferTime = currentCell.transferTime || 0;
          }
        } else if (isDiverter(currentCell)) {
          dir = currentCell.counter % 2 === 0 ? currentCell.dir1 : currentCell.dir2;
          cellTransferTime = currentCell.transferTime || 0;
          if (!b.diverterCell) b.diverterCell = currentCell;
        }

        if (dir !== 0) {
          // 链条机：提前检查下一格，不同方向且非移载机则禁止前进
          if (isChainConveyor(currentCell)) {
            let nx = b.x, ny = b.y;
            if (dir === 1) nx++;
            else if (dir === 2) ny++;
            else if (dir === 3) nx--;
            else if (dir === 4) ny--;
            const nextCell = state.getCell(nx, ny);
            if (nextCell !== 0 && isChainConveyor(nextCell) && nextCell.dir !== dir) {
              dir = 0;
            }
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

          if (b.diverterCell) {
            b.diverterCell.counter++;
            b.diverterCell = null;
          }

          let removed = false;
          if (b.x < 0 || b.x >= GRID_W || b.y < 0 || b.y >= GRID_H) {
            removed = true;
          } else {
            const arrivedCell = state.getCell(b.x, b.y);
            // 到达收货站或空单元格 → 移除
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
          }
        }
      }
    }
  }
}
