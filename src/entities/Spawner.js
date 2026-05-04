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
    const { simTime = 0 } = options;
    const cx = spawner.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = spawner.y * CELL_SIZE + CELL_SIZE / 2;
    const currentInterval = spawner.interval ? (spawner.interval / 1000) : 1;

    ctx.save();
    ctx.translate(cx, cy);

    // 外圈发光
    const glowRad = ctx.createRadialGradient(0, 0, 6, 0, 0, CELL_SIZE * 0.6);
    glowRad.addColorStop(0, COLORS.SPAWNER_BORDER_GLOW);
    glowRad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = glowRad;
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);

    // 背景渐变
    const bgGrad = ctx.createLinearGradient(-CELL_SIZE / 2, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE / 2);
    bgGrad.addColorStop(0, 'rgba(59, 130, 246, 0.06)');
    bgGrad.addColorStop(0.5, COLORS.SPAWNER_BG);
    bgGrad.addColorStop(1, 'rgba(59, 130, 246, 0.06)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);

    // 虚线边框（带滚动动画）
    ctx.save();
    ctx.shadowColor = COLORS.SPAWNER_BORDER_GLOW;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = COLORS.SPAWNER_BORDER;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -simTime / 50;
    ctx.strokeRect(-CELL_SIZE / 2 + 3, -CELL_SIZE / 2 + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    ctx.restore();

    // 中心圆渐变
    const centerGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 8);
    centerGrad.addColorStop(0, COLORS.SPAWNER_CENTER_HIGHLIGHT);
    centerGrad.addColorStop(1, COLORS.SPAWNER_CENTER);
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // 中心高光白点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(-2, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    // 间隔标签
    ctx.fillStyle = COLORS.SPAWNER_LABEL;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 1;
    ctx.fillText(currentInterval.toFixed(1) + 's', 0, 16);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
