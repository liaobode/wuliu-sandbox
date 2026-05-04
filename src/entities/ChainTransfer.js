import { Entity } from './Entity.js';
import { CELL_SIZE, COLORS } from '../core/constants.js';

export class ChainTransfer extends Entity {
  static type = 'chain-transfer';

  static isType(cell) {
    return cell !== null && cell !== 0 && cell.type === 'chain-transfer';
  }

  static create(options = {}) {
    return {
      type: 'chain-transfer',
      dir: options.dir || 1,
      speed: options.speed || COLORS.CHAIN_DEFAULT_SPEED,
      transferTime: options.transferTime || 3.0
    };
  }

  static _drawBase(ctx, cellSize, simTime, speed) {
    // 深色底板
    ctx.fillStyle = COLORS.TRANSFER_BASE;
    ctx.fillRect(0, 0, cellSize, cellSize);

    // 链条纹路（简化滚动动画）
    const plateW = 5;
    const pitch = plateW + 2;
    const movePx = (simTime / 1000) * (speed / 60) * CELL_SIZE;
    const offset = movePx % pitch;

    ctx.fillStyle = COLORS.TRANSFER_PLATFORM;
    for (let i = -2; i < Math.ceil(cellSize / pitch) + 2; i++) {
      const px = i * pitch + offset;
      ctx.fillRect(px, 4, plateW, cellSize - 8);
    }

    // 边缘加强筋
    ctx.strokeStyle = COLORS.TRANSFER_PLATFORM_EDGE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(3, 3, cellSize - 6, cellSize - 6);
    ctx.globalAlpha = 1;
  }

  static _drawCylinders(ctx, cellSize, liftPx) {
    const cylinderR = 3;
    const positions = [
      { x: 8, y: 8 },
      { x: cellSize - 8, y: 8 },
      { x: 8, y: cellSize - 8 },
      { x: cellSize - 8, y: cellSize - 8 }
    ];

    for (const pos of positions) {
      // 液压缸底座
      ctx.fillStyle = COLORS.TRANSFER_CYLINDER;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y + cylinderR, cylinderR + 1, 0, Math.PI * 2);
      ctx.fill();

      // 液压缸伸出杆（高度随 liftPx 变化）
      ctx.strokeStyle = COLORS.TRANSFER_CYLINDER_HEAD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y + cylinderR);
      ctx.lineTo(pos.x, pos.y - cylinderR - liftPx);
      ctx.stroke();

      // 缸头顶部圆点
      ctx.fillStyle = COLORS.TRANSFER_CYLINDER_HEAD;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - cylinderR - liftPx, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  static render(ctx, x, y, cell, options = {}) {
    const { simTime = 0, boxes = [] } = options;
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const cellSize = CELL_SIZE;

    ctx.save();
    ctx.translate(px, py);

    // 查找此格子上的托盘是否正在移载
    const palletHere = boxes.find(b =>
      b.x === x && b.y === y &&
      b.nextX === x && b.nextY === y &&
      b.cargoType === 'pallet' &&
      b.transferWait > 0
    );

    let liftPx = 0;

    if (palletHere) {
      const progress = 1 - (palletHere.transferWait / palletHere.transferTotal);
      if (progress < 0.25) {
        // 顶升阶段
        liftPx = (progress / 0.25) * COLORS.TRANSFER_LIFT_PX;
      } else if (progress < 0.75) {
        // 保持抬高
        liftPx = COLORS.TRANSFER_LIFT_PX;
      } else if (progress < 1.0) {
        // 下降阶段
        liftPx = ((1.0 - progress) / 0.25) * COLORS.TRANSFER_LIFT_PX;
      }
    }

    // 链条底板
    this._drawBase(ctx, cellSize, simTime, cell.speed);

    // 液压缸 + 顶升平台
    this._drawCylinders(ctx, cellSize, liftPx);

    // 平台浮板（随 liftPx 上移）
    if (liftPx > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      const platGrad = ctx.createLinearGradient(0, py, 0, py + cellSize);
      platGrad.addColorStop(0, COLORS.TRANSFER_PLATFORM_EDGE);
      platGrad.addColorStop(1, COLORS.TRANSFER_PLATFORM);
      ctx.fillStyle = platGrad;
      ctx.fillRect(4, 4 - liftPx, cellSize - 8, cellSize - 8);
      ctx.restore();
    }

    // 方向箭头
    const dir = cell.dir;
    const arrows = ['→', '↓', '←', '↑'];
    ctx.fillStyle = COLORS.CHAIN_BOLT;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arrows[dir - 1], cellSize / 2, cellSize / 2);

    ctx.restore();
  }
}
