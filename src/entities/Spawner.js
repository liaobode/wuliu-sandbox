import { Entity } from './Entity.js';
import { CELL_SIZE, COLORS } from '../core/constants.js';

/**
 * 发货机实体
 * 注意：发货机存储在单独的 spawners 数组中，不在 grid 里
 */
export class Spawner extends Entity {
  static type = 'spawner';

  static create(options = {}) {
    return {
      x: options.x,
      y: options.y,
      timer: 0,
      interval: (options.interval || 1) * 1000
    };
  }

  static render(ctx, spawner, options = {}) {
    const cx = spawner.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = spawner.y * CELL_SIZE + CELL_SIZE / 2;
    const currentInterval = spawner.interval ? (spawner.interval / 1000) : 1;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = COLORS.SPAWNER_BG;
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);

    ctx.strokeStyle = COLORS.SPAWNER_BORDER;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-CELL_SIZE / 2 + 2, -CELL_SIZE / 2 + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    ctx.fillStyle = COLORS.SPAWNER_CENTER;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.SPAWNER_CENTER;
    ctx.strokeText(currentInterval.toFixed(1) + 's', 0, 16);
    ctx.fillText(currentInterval.toFixed(1) + 's', 0, 16);

    ctx.restore();
  }
}