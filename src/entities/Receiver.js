import { Entity } from './Entity.js';
import { CELL_SIZE, COLORS } from '../core/constants.js';

/**
 * 收货站实体
 */
export class Receiver extends Entity {
  static type = 'receiver';

  static create(options = {}) {
    return {
      type: 'receiver',
      collected: 0
    };
  }

  static render(ctx, x, y, cell, options = {}) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;

    ctx.fillStyle = COLORS.RECEIVER_OUTER;
    ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    ctx.fillStyle = COLORS.RECEIVER_INNER;
    ctx.fillRect(px + 6, py + 6, CELL_SIZE - 12, CELL_SIZE - 12);

    // 画✔标记
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const cx = px + CELL_SIZE / 2;
    const cy = py + CELL_SIZE / 2;
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx - 2, cy + 7);
    ctx.lineTo(cx + 9, cy - 6);
    ctx.stroke();
    ctx.restore();
  }
}