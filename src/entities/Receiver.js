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
    const { simTime = 0 } = options;
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const cx = px + CELL_SIZE / 2;
    const cy = py + CELL_SIZE / 2;

    // 脉冲发光（基于 simTime 的呼吸效果）
    const glowPulse = 0.5 + 0.5 * Math.sin(simTime / 800);
    const glowAlpha = 0.12 + glowPulse * 0.13;

    const glowGrad = ctx.createRadialGradient(cx, cy, CELL_SIZE * 0.2, cx, cy, CELL_SIZE * 0.85);
    glowGrad.addColorStop(0, `rgba(16, 185, 129, ${glowAlpha * 1.5})`);
    glowGrad.addColorStop(0.5, `rgba(16, 185, 129, ${glowAlpha})`);
    glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(px - 4, py - 4, CELL_SIZE + 8, CELL_SIZE + 8);

    // 外框渐变
    const outerGrad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
    outerGrad.addColorStop(0, COLORS.RECEIVER_OUTER);
    outerGrad.addColorStop(1, '#064e3b');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
    ctx.fill();

    // 内面板渐变
    const innerGrad = ctx.createLinearGradient(px + 6, py + 6, px + 6, py + CELL_SIZE - 6);
    innerGrad.addColorStop(0, COLORS.RECEIVER_INNER_TOP);
    innerGrad.addColorStop(1, COLORS.RECEIVER_INNER_BOTTOM);
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.roundRect(px + 6, py + 6, CELL_SIZE - 12, CELL_SIZE - 12, 3);
    ctx.fill();

    // 对勾
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.strokeStyle = COLORS.RECEIVER_CHECK;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx - 2, cy + 7);
    ctx.lineTo(cx + 9, cy - 6);
    ctx.stroke();
    ctx.restore();

    // 收集计数
    if (cell.collected && cell.collected > 0) {
      ctx.save();
      const badgeText = cell.collected.toString();
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(badgeText).width;
      const bw = tw + 8;
      const bh = 14;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, py + CELL_SIZE - 18, bw, bh, 7);
      ctx.fill();

      ctx.fillStyle = '#ecfdf5';
      ctx.fillText(badgeText, cx, py + CELL_SIZE - 11);
      ctx.restore();
    }
  }
}
