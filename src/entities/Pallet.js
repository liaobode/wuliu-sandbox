import { CELL_SIZE, PALLET_SIZE, PALLET_OFFSET, COLORS } from '../core/constants.js';

export class Pallet {
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
      cargoType: 'pallet',
      w: options.w || 60,
      h: options.h || 40
    };
  }

  static render(ctx, pallet, options = {}) {
    const pw = pallet.w || 60;
    const ph = pallet.h || 40;
    const offX = (CELL_SIZE - pw) / 2;
    const offY = (CELL_SIZE - ph) / 2;
    const renderX = (pallet.x + (pallet.nextX - pallet.x) * pallet.progress) * CELL_SIZE + offX;
    const renderY = (pallet.y + (pallet.nextY - pallet.y) * pallet.progress) * CELL_SIZE + offY;

    ctx.save();

    // 投影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    // 塑料托盘主体（蓝色，带圆角）
    const palletGrad = ctx.createLinearGradient(renderX, renderY, renderX + pw, renderY + ph);
    palletGrad.addColorStop(0, COLORS.PALLET_BODY_LIGHT);
    palletGrad.addColorStop(0.5, COLORS.PALLET_BODY);
    palletGrad.addColorStop(1, COLORS.PALLET_BODY_DARK);
    ctx.fillStyle = palletGrad;
    ctx.beginPath();
    ctx.roundRect(renderX, renderY + ph * 0.55, pw, ph * 0.45, 2);
    ctx.fill();

    // 塑料隔板纹理
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = COLORS.PALLET_BODY_DARK;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.3;
    for (let i = 1; i < 4; i++) {
      const sx = renderX + (pw / 4) * i;
      ctx.beginPath();
      ctx.moveTo(sx, renderY + ph * 0.55);
      ctx.lineTo(sx, renderY + ph);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 上方堆叠货物
    const goodsW = pw - 6;
    const goodsH = ph * 0.52;
    const goodsX = renderX + 3;
    const goodsY = renderY + ph * 0.03;

    ctx.fillStyle = COLORS.PALLET_GOODS_SIDE;
    ctx.beginPath();
    ctx.roundRect(goodsX + 2, goodsY + 2, goodsW, goodsH, 2);
    ctx.fill();

    const goodsGrad = ctx.createLinearGradient(goodsX, goodsY, goodsX + goodsW, goodsY + goodsH);
    goodsGrad.addColorStop(0, COLORS.PALLET_GOODS_TOP);
    goodsGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = goodsGrad;
    ctx.beginPath();
    ctx.roundRect(goodsX, goodsY, goodsW, goodsH, 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(goodsX + goodsW / 2, goodsY);
    ctx.lineTo(goodsX + goodsW / 2, goodsY + goodsH);
    ctx.moveTo(goodsX, goodsY + goodsH / 2);
    ctx.lineTo(goodsX + goodsW, goodsY + goodsH / 2);
    ctx.stroke();

    // 缠绕膜
    ctx.fillStyle = COLORS.PALLET_WRAP;
    ctx.beginPath();
    ctx.roundRect(renderX, renderY, pw, ph, 2);
    ctx.fill();

    // 薄描边
    ctx.strokeStyle = COLORS.PALLET_BODY_DARK;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(renderX + 0.5, renderY + 0.5, pw - 1, ph - 1);

    ctx.restore();

    // 移载进度条
    if (pallet.transferWait > 0) {
      const barWidth = pw;
      const barHeight = 4;
      const progressRatio = 1 - (pallet.transferWait / pallet.transferTotal);

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
