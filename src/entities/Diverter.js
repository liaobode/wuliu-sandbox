import { Entity } from './Entity.js';
import { CELL_SIZE, COLORS, DIRECTION_ARROWS } from '../core/constants.js';

/**
 * 分流器实体
 */
export class Diverter extends Entity {
  static type = 'diverter';

  static create(options = {}) {
    const dir1 = options.dir1 || 1;
    const dir2 = options.dir2 || (dir1 % 4) + 1;
    return {
      type: 'diverter',
      dir1,
      dir2,
      speed: options.speed || COLORS.DEFAULT_SPEED,
      transferTime: options.transferTime || 0,
      counter: 0
    };
  }

  static render(ctx, x, y, cell, options = {}) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;

    ctx.fillStyle = COLORS.DIVERTER_OUTER;
    ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    ctx.fillStyle = COLORS.DIVERTER_INNER;
    ctx.fillRect(px + 5, py + 5, CELL_SIZE - 10, CELL_SIZE - 10);

    // 画两个方向箭头
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    const cx = px + CELL_SIZE / 2;
    const cy = py + CELL_SIZE / 2;
    ctx.fillText(DIRECTION_ARROWS[cell.dir1] + '|' + DIRECTION_ARROWS[cell.dir2], cx, cy);
    ctx.restore();
  }
}