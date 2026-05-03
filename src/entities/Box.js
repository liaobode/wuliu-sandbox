import { CELL_SIZE, BOX_SIZE, BOX_OFFSET, COLORS } from '../core/constants.js';

/**
 * 货物实体
 * 货物是动态实体，不在 grid 中存储
 */
export class Box {
  /**
   * 创建货物数据
   */
  static create(options = {}) {
    return {
      id: 0, // 由 State 分配
      x: options.x,
      y: options.y,
      nextX: options.x,
      nextY: options.y,
      progress: 0,
      lastDir: options.lastDir || 0,
      transferWait: 0,
      transferTotal: 0,
      diverterCell: null // 记录货物经过的分流器，离开时递增 counter
    };
  }

  /**
   * 渲染货物
   */
  static render(ctx, box, options = {}) {
    const renderX = (box.x + (box.nextX - box.x) * box.progress) * CELL_SIZE + BOX_OFFSET;
    const renderY = (box.y + (box.nextY - box.y) * box.progress) * CELL_SIZE + BOX_OFFSET;

    // 绘制纸箱
    ctx.fillStyle = COLORS.BOX_OUTER;
    ctx.fillRect(renderX, renderY, BOX_SIZE, BOX_SIZE);

    ctx.fillStyle = COLORS.BOX_INNER;
    ctx.fillRect(renderX + 2, renderY + 2, BOX_SIZE - 4, BOX_SIZE - 4);

    // 纸箱顶部的十字胶带线
    ctx.strokeStyle = COLORS.BOX_TAPE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(renderX + BOX_SIZE / 2, renderY);
    ctx.lineTo(renderX + BOX_SIZE / 2, renderY + BOX_SIZE);
    ctx.moveTo(renderX, renderY + BOX_SIZE / 2);
    ctx.lineTo(renderX + BOX_SIZE, renderY + BOX_SIZE / 2);
    ctx.stroke();

    // 绘制移载进度条
    if (box.transferWait > 0) {
      const barWidth = BOX_SIZE;
      const barHeight = 4;
      const progressRatio = 1 - (box.transferWait / box.transferTotal);

      ctx.fillStyle = COLORS.PROGRESS_BG;
      ctx.fillRect(renderX, renderY - 8, barWidth, barHeight);
      ctx.fillStyle = COLORS.PROGRESS_BAR;
      ctx.fillRect(renderX, renderY - 8, barWidth * progressRatio, barHeight);
    }
  }
}