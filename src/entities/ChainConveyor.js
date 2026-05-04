import { Entity } from './Entity.js';
import { CELL_SIZE, COLORS } from '../core/constants.js';

export class ChainConveyor extends Entity {
  static type = 'chain-conveyor';

  static isType(cell) {
    return cell !== null && cell !== 0 && cell.type === 'chain-conveyor';
  }

  static create(options = {}) {
    return {
      type: 'chain-conveyor',
      dir: options.dir || 1,
      speed: options.speed || COLORS.CHAIN_DEFAULT_SPEED,
      transferTime: options.transferTime || 0
    };
  }

  static _drawChainPlates(ctx, beltLength, beltWidth, simTime, beltSpeed) {
    // 深色底板
    ctx.fillStyle = COLORS.CHAIN_BASE;
    ctx.fillRect(-beltLength / 2, -beltWidth / 2, beltLength, beltWidth);

    // 链板横向排列，带滚动动画
    const plateWidth = 6;
    const plateGap = 2;
    const platePitch = plateWidth + plateGap;
    const numPlates = Math.ceil(beltLength / platePitch) + 6;

    const movePx = (simTime / 1000) * (beltSpeed / 60) * CELL_SIZE;
    const offset = movePx % platePitch;

    for (let i = 0; i < numPlates; i++) {
      const px = -beltLength / 2 - platePitch * 3 + i * platePitch + offset;
      if (px > beltLength / 2 + plateWidth || px + plateWidth < -beltLength / 2) continue;

      // 链板主体
      const plateGrad = ctx.createLinearGradient(0, -beltWidth / 2 + 3, 0, beltWidth / 2 - 3);
      plateGrad.addColorStop(0, COLORS.CHAIN_PLATE_EDGE);
      plateGrad.addColorStop(0.2, COLORS.CHAIN_PLATE);
      plateGrad.addColorStop(0.8, COLORS.CHAIN_PLATE);
      plateGrad.addColorStop(1, COLORS.CHAIN_PLATE_EDGE);
      ctx.fillStyle = plateGrad;
      ctx.fillRect(px, -beltWidth / 2 + 3, plateWidth, beltWidth - 6);

      // 链板间缝隙线
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px + plateWidth, -beltWidth / 2 + 3);
      ctx.lineTo(px + plateWidth, beltWidth / 2 - 3);
      ctx.stroke();

      // 螺栓点（链板两端）
      ctx.fillStyle = COLORS.CHAIN_BOLT;
      ctx.beginPath();
      ctx.arc(px + plateWidth / 2, -beltWidth / 2 + 10, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + plateWidth / 2, beltWidth / 2 - 10, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 边缘加强筋
    ctx.strokeStyle = COLORS.CHAIN_LINK_HIGHLIGHT;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(-beltLength / 2, -beltWidth / 2 + 2);
    ctx.lineTo(beltLength / 2, -beltWidth / 2 + 2);
    ctx.moveTo(-beltLength / 2, beltWidth / 2 - 2);
    ctx.lineTo(beltLength / 2, beltWidth / 2 - 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  static _drawDirectionArrows(ctx, beltLength, beltWidth) {
    const arrowW = 7;
    const arrowH = 8;
    const cols = 3;
    const rows = 3;
    const stepX = beltLength / (cols + 1);
    const stepY = beltWidth / (rows + 1);
    const startX = -beltLength / 2 + stepX;
    const startY = -beltWidth / 2 + stepY;

    ctx.fillStyle = COLORS.CHAIN_BOLT;

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

  static render(ctx, x, y, cell, options = {}) {
    const { simTime = 0 } = options;
    const dir = cell.dir;
    const beltSpeed = cell.speed;
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;

    ctx.save();
    ctx.translate(cx, cy);

    const rotMap = { 1: 0, 2: Math.PI / 2, 3: Math.PI, 4: -Math.PI / 2 };
    ctx.rotate(rotMap[dir] || 0);

    const beltWidth = CELL_SIZE - 6;
    const beltLength = CELL_SIZE;

    ctx.beginPath();
    ctx.rect(-beltLength / 2, -beltWidth / 2, beltLength, beltWidth);
    ctx.clip();

    this._drawChainPlates(ctx, beltLength, beltWidth, simTime, beltSpeed);
    this._drawDirectionArrows(ctx, beltLength, beltWidth);
    ctx.restore();

    // 速度标签
    if (beltSpeed !== COLORS.CHAIN_DEFAULT_SPEED) {
      ctx.save();
      const label = beltSpeed.toFixed(1) + 'x';
      ctx.font = 'bold 8px monospace';
      const labelW = ctx.measureText(label).width + 6;
      const labelH = 12;
      const lx = x * CELL_SIZE + CELL_SIZE - 4;
      const ly = y * CELL_SIZE + CELL_SIZE - 4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.roundRect(lx - labelW, ly - labelH, labelW, labelH, 3);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, lx - 3, ly - 2);
      ctx.restore();
    }
  }
}
