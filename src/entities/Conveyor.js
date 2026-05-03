import { Entity } from './Entity.js';
import { CELL_SIZE, COLORS, DIRECTION_ARROWS } from '../core/constants.js';

/**
 * 输送带实体
 */
export class Conveyor extends Entity {
  static type = 'conveyor';

  static isType(cell) {
    return cell !== null && cell !== 0 && cell.dir !== undefined && !cell.type;
  }

  static create(options = {}) {
    return {
      dir: options.dir || 1,
      speed: options.speed || COLORS.DEFAULT_SPEED,
      transferTime: options.transferTime || 0
    };
  }

  static render(ctx, x, y, cell, options = {}) {
    const { simTime = 0 } = options;
    const dir = cell.dir;
    const beltSpeed = cell.speed;
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // 根据方向旋转画布
    if (dir === 2) ctx.rotate(Math.PI / 2);
    else if (dir === 3) ctx.rotate(Math.PI);
    else if (dir === 4) ctx.rotate(-Math.PI / 2);

    const beltWidth = CELL_SIZE - 6;
    const beltLength = CELL_SIZE;

    // 设定剪裁区域
    ctx.beginPath();
    ctx.rect(-beltLength / 2, -beltWidth / 2, beltLength, beltWidth);
    ctx.clip();

    // 画履带底板
    const isHighSpeed = beltSpeed >= COLORS.HIGH_SPEED_THRESHOLD;
    ctx.fillStyle = isHighSpeed ? COLORS.BELT_HIGH_SPEED : COLORS.BELT_NORMAL;
    ctx.fillRect(-beltLength / 2, -beltWidth / 2, beltLength, beltWidth);

    // 画滚动的人字形纹理
    ctx.strokeStyle = isHighSpeed ? COLORS.BELT_STRIPE_HIGH_SPEED : COLORS.BELT_STRIPE_NORMAL;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const stripeSpacing = 16;
    const movePx = (simTime / 1000) * (beltSpeed / 60) * CELL_SIZE;
    const offset = movePx % stripeSpacing;

    ctx.beginPath();
    for (let lx = -beltLength / 2 - stripeSpacing * 2; lx <= beltLength / 2 + stripeSpacing; lx += stripeSpacing) {
      const drawX = lx + offset;
      ctx.moveTo(drawX - 4, -beltWidth / 2 + 4);
      ctx.lineTo(drawX + 4, 0);
      ctx.lineTo(drawX - 4, beltWidth / 2 - 4);
    }
    ctx.stroke();

    ctx.restore();

    // 画两侧的固定导轨
    ctx.save();
    ctx.translate(cx, cy);
    if (dir === 2) ctx.rotate(Math.PI / 2);
    else if (dir === 3) ctx.rotate(Math.PI);
    else if (dir === 4) ctx.rotate(-Math.PI / 2);

    ctx.fillStyle = COLORS.BELT_RAIL;
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2 + 1, CELL_SIZE, 2);
    ctx.fillRect(-CELL_SIZE / 2, CELL_SIZE / 2 - 3, CELL_SIZE, 2);
    ctx.restore();

    // 速度标签
    if (beltSpeed !== COLORS.DEFAULT_SPEED) {
      ctx.save();
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      const label = beltSpeed + '';
      const lx = x * CELL_SIZE + CELL_SIZE - 3;
      const ly = y * CELL_SIZE + CELL_SIZE - 2;
      ctx.strokeText(label, lx, ly);
      ctx.fillText(label, lx, ly);
      ctx.restore();
    }
  }
}