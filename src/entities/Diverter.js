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
    const cx = px + CELL_SIZE / 2;
    const cy = py + CELL_SIZE / 2;

    ctx.save();

    // 外框投影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;

    const outerGrad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
    outerGrad.addColorStop(0, COLORS.DIVERTER_OUTER_TOP);
    outerGrad.addColorStop(1, COLORS.DIVERTER_OUTER_BOTTOM);
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // 内面板渐变
    const innerGrad = ctx.createLinearGradient(px + 5, py + 5, px + 5, py + CELL_SIZE - 5);
    innerGrad.addColorStop(0, COLORS.DIVERTER_INNER_TOP);
    innerGrad.addColorStop(1, COLORS.DIVERTER_INNER_BOTTOM);
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.roundRect(px + 5, py + 5, CELL_SIZE - 10, CELL_SIZE - 10, 3);
    ctx.fill();

    // 方向箭头
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const arrowText = DIRECTION_ARROWS[cell.dir1] + ' | ' + DIRECTION_ARROWS[cell.dir2];
    const tw = ctx.measureText(arrowText).width;

    // 箭头背景 pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.roundRect(cx - tw / 2 - 5, cy - 9, tw + 10, 18, 9);
    ctx.fill();

    // 箭头文字
    ctx.fillStyle = COLORS.DIVERTER_ARROW;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 1;
    ctx.fillText(arrowText, cx, cy);

    ctx.restore();
  }
}
