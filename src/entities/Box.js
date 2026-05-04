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
      id: 0,
      x: options.x,
      y: options.y,
      nextX: options.x,
      nextY: options.y,
      progress: 0,
      lastDir: options.lastDir || 0,
      transferWait: 0,
      transferTotal: 0,
      diverterCell: null,
      cargoType: 'box',
      w: options.w || 30,
      h: options.h || 20
    };
  }

  /**
   * 渲染货物
   */
  static render(ctx, box, options = {}) {
    const bw = box.w || 30;
    const bh = box.h || 20;
    const offX = (CELL_SIZE - bw) / 2;
    const offY = (CELL_SIZE - bh) / 2;
    const renderX = (box.x + (box.nextX - box.x) * box.progress) * CELL_SIZE + offX;
    const renderY = (box.y + (box.nextY - box.y) * box.progress) * CELL_SIZE + offY;

    ctx.save();

    // 投影
    ctx.shadowColor = COLORS.BOX_SHADOW;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    // 箱体渐变（左上光源）
    const boxGrad = ctx.createLinearGradient(renderX, renderY, renderX + bw, renderY + bh);
    boxGrad.addColorStop(0, COLORS.BOX_TOP);
    boxGrad.addColorStop(0.6, COLORS.BOX_FRONT);
    boxGrad.addColorStop(1, COLORS.BOX_SIDE);
    ctx.fillStyle = boxGrad;
    ctx.beginPath();
    ctx.roundRect(renderX, renderY, bw, bh, 2);
    ctx.fill();

    // 重置阴影后画胶带和边框
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 十字胶带
    ctx.strokeStyle = COLORS.BOX_TAPE;
    ctx.lineWidth = Math.max(1.5, bh * 0.09);
    ctx.beginPath();
    ctx.moveTo(renderX + bw / 2, renderY + 1);
    ctx.lineTo(renderX + bw / 2, renderY + bh - 1);
    ctx.moveTo(renderX + 1, renderY + bh / 2);
    ctx.lineTo(renderX + bw - 1, renderY + bh / 2);
    ctx.stroke();

    // 胶带阴影
    ctx.strokeStyle = COLORS.BOX_TAPE_SHADOW;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(renderX + bw / 2 + 1.5, renderY + 1);
    ctx.lineTo(renderX + bw / 2 + 1.5, renderY + bh - 1);
    ctx.moveTo(renderX + 1, renderY + bh / 2 + 1.5);
    ctx.lineTo(renderX + bw - 1, renderY + bh / 2 + 1.5);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 薄描边
    ctx.strokeStyle = COLORS.BOX_SIDE;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(renderX + 0.5, renderY + 0.5, bw - 1, bh - 1);

    ctx.restore();

    // 移载进度条
    if (box.transferWait > 0) {
      const barWidth = bw;
      const barHeight = 4;
      const progressRatio = 1 - (box.transferWait / box.transferTotal);

      ctx.fillStyle = COLORS.PROGRESS_BG;
      ctx.beginPath();
      ctx.roundRect(renderX, renderY - 8, barWidth, barHeight, 2);
      ctx.fill();

      if (progressRatio > 0) {
        ctx.fillStyle = COLORS.PROGRESS_BAR;
        ctx.beginPath();
        ctx.roundRect(renderX, renderY - 8, barWidth * progressRatio, barHeight, 2);
        ctx.fill();
      }
    }
  }
}
