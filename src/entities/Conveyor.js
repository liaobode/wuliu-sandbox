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

  /**
   * 在 direction-1（向右）坐标系下绘制输送带内容
   * 调用前已由 rotateToDir 旋转 ctx，所以该方法只需处理"向右"的绘制
   */
  static _drawBeltContent(ctx, beltLength, beltWidth, beltSpeed, simTime, isHighSpeed) {
    // a. 底板渐变（垂直方向，营造凹槽感）
    const baseGrad = ctx.createLinearGradient(0, -beltWidth / 2, 0, beltWidth / 2);
    if (isHighSpeed) {
      baseGrad.addColorStop(0, COLORS.BELT_HIGH_SPEED_BASE_TOP);
      baseGrad.addColorStop(0.5, COLORS.BELT_HIGH_SPEED_BASE_MID);
      baseGrad.addColorStop(1, COLORS.BELT_HIGH_SPEED_BASE_BOTTOM);
    } else {
      baseGrad.addColorStop(0, COLORS.BELT_BASE_TOP);
      baseGrad.addColorStop(0.5, COLORS.BELT_BASE_MID);
      baseGrad.addColorStop(1, COLORS.BELT_BASE_BOTTOM);
    }
    ctx.fillStyle = baseGrad;
    ctx.fillRect(-beltLength / 2, -beltWidth / 2, beltLength, beltWidth);

    // b. 滚动滚轮（圆柱形，横向排列）
    const rollerWidth = 4;
    const rollerGap = 3;
    const rollerPitch = rollerWidth + rollerGap;
    const numRollers = Math.ceil(beltLength / rollerPitch) + 4;

    const movePx = (simTime / 1000) * (beltSpeed / 60) * CELL_SIZE;
    const offset = movePx % rollerPitch;

    for (let i = 0; i < numRollers; i++) {
      const rx = -beltLength / 2 - rollerPitch * 2 + i * rollerPitch + offset;
      if (rx > beltLength / 2 + rollerWidth || rx + rollerWidth < -beltLength / 2) continue;

      const rTop = -beltWidth / 2 + 2;
      const rH = beltWidth - 4;

      // 滚轮圆柱渐变
      const rollGrad = ctx.createLinearGradient(0, rTop, 0, rTop + rH);
      if (isHighSpeed) {
        rollGrad.addColorStop(0, COLORS.BELT_HIGH_SPEED_ROLLER_HIGHLIGHT);
        rollGrad.addColorStop(0.3, COLORS.BELT_HIGH_SPEED_ROLLER_MID);
        rollGrad.addColorStop(0.5, COLORS.BELT_HIGH_SPEED_ROLLER_SHADOW);
        rollGrad.addColorStop(0.7, COLORS.BELT_HIGH_SPEED_ROLLER_MID);
        rollGrad.addColorStop(1, COLORS.BELT_HIGH_SPEED_ROLLER_HIGHLIGHT);
      } else {
        rollGrad.addColorStop(0, COLORS.BELT_ROLLER_HIGHLIGHT);
        rollGrad.addColorStop(0.3, COLORS.BELT_ROLLER_MID);
        rollGrad.addColorStop(0.5, COLORS.BELT_ROLLER_SHADOW);
        rollGrad.addColorStop(0.7, COLORS.BELT_ROLLER_MID);
        rollGrad.addColorStop(1, COLORS.BELT_ROLLER_HIGHLIGHT);
      }
      ctx.fillStyle = rollGrad;
      ctx.beginPath();
      ctx.roundRect(rx, rTop, rollerWidth, rH, 1.5);
      ctx.fill();
    }
  }

  /**
   * 皮带表面方向箭头（在 direction-1 坐标系下绘制，箭头指向右）
   */
  static _drawDirectionArrows(ctx, beltLength, beltWidth) {
    const arrowW = 7;
    const arrowH = 8;
    const cols = 3;
    const rows = 3;
    const stepX = beltLength / (cols + 1);
    const stepY = beltWidth / (rows + 1);
    const startX = -beltLength / 2 + stepX;
    const startY = -beltWidth / 2 + stepY;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = startX + col * stepX;
        const cy = startY + row * stepY;
        ctx.beginPath();
        ctx.moveTo(cx + arrowW / 2, cy);
        ctx.lineTo(cx - arrowW / 2, cy - arrowH / 2);
        ctx.lineTo(cx - arrowW / 2, cy + arrowH / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  /**
   * 绘制金属导轨（在 direction-1 坐标系下）
   */
  static _drawRails(ctx) {
    // 上导轨
    const railGrad1 = ctx.createLinearGradient(0, -CELL_SIZE / 2 + 1, 0, -CELL_SIZE / 2 + 4);
    railGrad1.addColorStop(0, COLORS.BELT_RAIL_TOP);
    railGrad1.addColorStop(0.3, COLORS.BELT_RAIL_MID);
    railGrad1.addColorStop(0.5, COLORS.BELT_RAIL_BOTTOM);
    railGrad1.addColorStop(0.7, COLORS.BELT_RAIL_MID);
    railGrad1.addColorStop(1, COLORS.BELT_RAIL_TOP);
    ctx.fillStyle = railGrad1;
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2 + 1, CELL_SIZE, 3);

    // 上导轨高光
    ctx.fillStyle = COLORS.BELT_RAIL_SPECULAR;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2 + 1, CELL_SIZE, 1);
    ctx.globalAlpha = 1;

    // 下导轨
    const railGrad2 = ctx.createLinearGradient(0, CELL_SIZE / 2 - 4, 0, CELL_SIZE / 2 - 1);
    railGrad2.addColorStop(0, COLORS.BELT_RAIL_TOP);
    railGrad2.addColorStop(0.3, COLORS.BELT_RAIL_MID);
    railGrad2.addColorStop(0.5, COLORS.BELT_RAIL_BOTTOM);
    railGrad2.addColorStop(0.7, COLORS.BELT_RAIL_MID);
    railGrad2.addColorStop(1, COLORS.BELT_RAIL_TOP);
    ctx.fillStyle = railGrad2;
    ctx.fillRect(-CELL_SIZE / 2, CELL_SIZE / 2 - 4, CELL_SIZE, 3);

    // 下导轨高光
    ctx.fillStyle = COLORS.BELT_RAIL_SPECULAR;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-CELL_SIZE / 2, CELL_SIZE / 2 - 4, CELL_SIZE, 1);
    ctx.globalAlpha = 1;
  }

  static render(ctx, x, y, cell, options = {}) {
    const { simTime = 0 } = options;
    const dir = cell.dir;
    const beltSpeed = cell.speed;
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;
    const isHighSpeed = beltSpeed >= COLORS.HIGH_SPEED_THRESHOLD;

    ctx.save();
    ctx.translate(cx, cy);

    // 根据方向旋转到标准坐标系（direction-1 = 向右）
    const rotMap = { 1: 0, 2: Math.PI / 2, 3: Math.PI, 4: -Math.PI / 2 };
    ctx.rotate(rotMap[dir] || 0);

    const beltWidth = CELL_SIZE - 6;
    const beltLength = CELL_SIZE;

    // 设定剪裁区域
    ctx.beginPath();
    ctx.rect(-beltLength / 2, -beltWidth / 2, beltLength, beltWidth);
    ctx.clip();

    // 绘制底板 + 滚轮
    this._drawBeltContent(ctx, beltLength, beltWidth, beltSpeed, simTime, isHighSpeed);

    // 方向箭头
    this._drawDirectionArrows(ctx, beltLength, beltWidth);

    ctx.restore();

    // 导轨在剪裁区域外绘制
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotMap[dir] || 0);
    this._drawRails(ctx);
    ctx.restore();

    // 速度标签（未旋转）
    if (beltSpeed !== COLORS.DEFAULT_SPEED) {
      ctx.save();
      const label = beltSpeed.toFixed(1) + 'x';
      ctx.font = 'bold 8px monospace';
      const labelW = ctx.measureText(label).width + 6;
      const labelH = 12;
      const lx = x * CELL_SIZE + CELL_SIZE - 4;
      const ly = y * CELL_SIZE + CELL_SIZE - 4;

      // 背景 pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.roundRect(lx - labelW, ly - labelH, labelW, labelH, 3);
      ctx.fill();

      // 文字
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, lx - 3, ly - 2);
      ctx.restore();
    }
  }
}
