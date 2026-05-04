import { GRID_W, GRID_H, CELL_SIZE, COLORS } from '../core/constants.js';
import { Box } from '../entities/Box.js';
import { Spawner } from '../entities/Spawner.js';
import { createDefaultEntityRegistry } from '../entities/index.js';

/**
 * Canvas 渲染器
 */
export class CanvasRenderer {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;

    // 世界逻辑尺寸（网格总像素）
    this._logicalWidth = GRID_W * CELL_SIZE;
    this._logicalHeight = GRID_H * CELL_SIZE;
    // HiDPI
    this._dpr = window.devicePixelRatio || 1;

    // 视口状态
    this.view = { panX: 0, panY: 0, zoom: 1 };
    this._initialFit = false;

    this._setupCanvas();

    this.entityRegistry = createDefaultEntityRegistry();
    this._bindEvents();
  }

  _setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || this._logicalWidth;
    const h = rect.height || this._logicalHeight;
    this.canvas.width = w * this._dpr;
    this.canvas.height = h * this._dpr;
  }

  _bindEvents() {
    this.state.on('state:grid-change', () => this.draw());
    this.state.on('state:box-spawn', () => this.draw());
    this.state.on('state:box-remove', () => this.draw());
    this.state.on('state:undo', () => this.draw());
    this.state.on('state:import', () => this.draw());
    this.state.on('state:reset', () => this.draw());
  }

  /**
   * 处理窗口/DPR 变化
   */
  handleResize() {
    const newDpr = window.devicePixelRatio || 1;
    if (newDpr !== this._dpr) {
      this._dpr = newDpr;
    }
    this.resize();
    this.draw();
  }

  /**
   * 调整画布尺寸填满容器
   */
  resize() {
    const container = this.canvas.parentElement;
    const cssW = container.clientWidth - 64;
    const cssH = container.clientHeight - 64;
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.canvas.width = cssW * this._dpr;
    this.canvas.height = cssH * this._dpr;

    if (!this._initialFit) {
      this._initialFit = true;
      this.fitToScreen();
    }
  }

  /**
   * 获取视口逻辑宽高
   */
  getViewportWidth() {
    return this.canvas.width / this._dpr;
  }
  getViewportHeight() {
    return this.canvas.height / this._dpr;
  }

  // ========== 坐标转换 ==========

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.view.panX) / this.view.zoom,
      y: (sy - this.view.panY) / this.view.zoom
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.view.zoom + this.view.panX,
      y: wy * this.view.zoom + this.view.panY
    };
  }

  // ========== 视口操作 ==========

  zoomAt(sx, sy, factor) {
    const world = this.screenToWorld(sx, sy);
    const newZoom = Math.max(COLORS.ZOOM_MIN, Math.min(COLORS.ZOOM_MAX, this.view.zoom * factor));
    if (newZoom === this.view.zoom) return;
    this.view.zoom = newZoom;
    this.view.panX = sx - world.x * newZoom;
    this.view.panY = sy - world.y * newZoom;
    this._notify();
  }

  panBy(dx, dy) {
    this.view.panX += dx;
    this.view.panY += dy;
    this._notify();
  }

  fitToScreen() {
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();
    const margin = 40;
    const availW = vw - margin * 2;
    const availH = vh - margin * 2;
    if (availW <= 0 || availH <= 0) return;
    const fitZ = Math.min(availW / this._logicalWidth, availH / this._logicalHeight, 1.5);
    this.view.zoom = fitZ;
    this.view.panX = (vw - this._logicalWidth * fitZ) / 2;
    this.view.panY = (vh - this._logicalHeight * fitZ) / 2;
    this._notify();
  }

  fitToContent() {
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let hasItems = false;

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (this.state.grid[y][x] !== 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          hasItems = true;
        }
      }
    }
    for (const s of this.state.spawners) {
      if (s.x < minX) minX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.x > maxX) maxX = s.x;
      if (s.y > maxY) maxY = s.y;
      hasItems = true;
    }

    if (!hasItems) {
      this.fitToScreen();
      return;
    }

    const margin = 3;
    const left = (minX - margin) * CELL_SIZE;
    const top = (minY - margin) * CELL_SIZE;
    const right = (maxX + margin + 1) * CELL_SIZE;
    const bottom = (maxY + margin + 1) * CELL_SIZE;
    const areaW = right - left;
    const areaH = bottom - top;
    const fitZ = Math.min(vw / areaW, vh / areaH, 2);
    this.view.zoom = Math.max(0.1, fitZ);
    this.view.panX = vw / 2 - ((left + right) / 2) * this.view.zoom;
    this.view.panY = vh / 2 - ((top + bottom) / 2) * this.view.zoom;
    this._notify();
  }

  resetView() {
    this._initialFit = false;
    this.resize();
  }

  _notify() {
    this.state.emit('view:change', { ...this.view });
  }

  // ========== 渲染 ==========

  draw() {
    const ctx = this.ctx;
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();

    // 1. DPR 基础变换
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    // 2. 暗色背景填充整个视口
    ctx.fillStyle = COLORS.CANVAS_BG;
    ctx.fillRect(0, 0, vw, vh);

    // 3. 应用视口变换
    ctx.save();
    ctx.translate(this.view.panX, this.view.panY);
    ctx.scale(this.view.zoom, this.view.zoom);

    // 4. 世界空间内容
    this._drawGrid();
    this._drawEntities();
    this._drawSpawners();
    this._drawBoxes();
    this._drawHeatmap();
    this._drawPreview();

    // 5. 恢复回屏幕空间
    ctx.restore();

    // 6. 屏幕空间 HUD
    this.drawHUD();
  }

  _drawGrid() {
    const ctx = this.ctx;
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();
    const zoom = this.view.zoom;

    // 计算可见世界区域的范围
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(vw, vh);
    const startX = Math.floor(topLeft.x / CELL_SIZE);
    const startY = Math.floor(topLeft.y / CELL_SIZE);
    const endX = Math.ceil(bottomRight.x / CELL_SIZE);
    const endY = Math.ceil(bottomRight.y / CELL_SIZE);

    // 根据 zoom 决定网格密度
    let minorStep, majorStep;
    if (zoom < 0.3) {
      minorStep = 8; majorStep = 16;
    } else if (zoom < 0.6) {
      minorStep = 4; majorStep = 8;
    } else if (zoom < 2.0) {
      minorStep = 1; majorStep = 4;
    } else {
      minorStep = 1; majorStep = 1;
    }

    // 细网格线
    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth = Math.max(0.2, 0.4 / zoom);
    for (let x = startX; x <= endX; x += minorStep) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, startY * CELL_SIZE);
      ctx.lineTo(x * CELL_SIZE, endY * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += minorStep) {
      ctx.beginPath();
      ctx.moveTo(startX * CELL_SIZE, y * CELL_SIZE);
      ctx.lineTo(endX * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // 主网格线
    ctx.strokeStyle = COLORS.GRID_MAJOR_LINE;
    ctx.lineWidth = Math.max(0.3, 0.8 / zoom);
    for (let x = startX; x <= endX; x += majorStep) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, startY * CELL_SIZE);
      ctx.lineTo(x * CELL_SIZE, endY * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += majorStep) {
      ctx.beginPath();
      ctx.moveTo(startX * CELL_SIZE, y * CELL_SIZE);
      ctx.lineTo(endX * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
  }

  _drawEntities() {
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const cell = this.state.grid[y][x];
        this.entityRegistry.renderCell(this.ctx, x, y, cell, {
          simTime: this.state.simTime
        });
      }
    }
  }

  _drawSpawners() {
    const opts = { simTime: this.state.simTime };
    for (const spawner of this.state.spawners) {
      Spawner.render(this.ctx, spawner, opts);
    }
  }

  _drawBoxes() {
    for (const box of this.state.boxes) {
      Box.render(this.ctx, box);
    }
  }

  _drawHeatmap() {
    if (!this.state.showHeatMap) return;

    let maxHeat = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (this.state.heatData[y][x] > maxHeat) {
          maxHeat = this.state.heatData[y][x];
        }
      }
    }

    if (maxHeat > 0) {
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const v = this.state.heatData[y][x];
          if (v > 0) {
            const intensity = Math.min(v / maxHeat, 1);
            const hue = (1 - intensity) * 240;
            this.ctx.fillStyle = `hsla(${hue}, 80%, ${50 + intensity * 10}%, ${COLORS.HEATMAP_ALPHA})`;
            this.ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);

            if (v >= 0.5) {
              this.ctx.save();
              this.ctx.font = 'bold 10px monospace';
              this.ctx.textAlign = 'center';
              this.ctx.textBaseline = 'middle';
              this.ctx.fillStyle = '#fff';
              this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
              this.ctx.lineWidth = 2;
              const label = v >= 10 ? v.toFixed(0) : v.toFixed(1);
              this.ctx.strokeText(label, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
              this.ctx.fillText(label, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
              this.ctx.restore();
            }
          }
        }
      }
    }
  }

  _drawPreview() {
    if (this.state.isRunning) return;
    if (this.state.hoverX < 0 || this.state.hoverX >= GRID_W) return;
    if (this.state.hoverY < 0 || this.state.hoverY >= GRID_H) return;

    const px = this.state.hoverX * CELL_SIZE;
    const py = this.state.hoverY * CELL_SIZE;
    const tool = this.state.currentTool;
    const cellSize = CELL_SIZE;

    this.ctx.save();
    this.ctx.globalAlpha = 0.35;

    if (tool.startsWith('conveyor-')) {
      const dir = parseInt(tool.split('-')[1]);
      for (let i = 0; i < this.state.buildLength; i++) {
        let tx = this.state.hoverX, ty = this.state.hoverY;
        if (dir === 1) tx += i;
        else if (dir === 2) ty += i;
        else if (dir === 3) tx -= i;
        else if (dir === 4) ty -= i;

        if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
          const cx = tx * cellSize, cy = ty * cellSize;
          this.ctx.fillStyle = COLORS.PREVIEW_CONVEYOR;
          this.ctx.beginPath();
          this.ctx.roundRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, 3);
          this.ctx.fill();
          const arrows = ['→', '↓', '←', '↑'];
          this.ctx.globalAlpha = 0.7;
          this.ctx.fillStyle = '#fff';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(arrows[dir - 1], cx + cellSize / 2, cy + cellSize / 2);
          this.ctx.globalAlpha = 0.35;
        }
      }
    } else if (tool === 'receiver') {
      this.ctx.fillStyle = COLORS.PREVIEW_RECEIVER;
      this.ctx.beginPath();
      this.ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4);
      this.ctx.fill();
    } else if (tool === 'spawner') {
      this.ctx.fillStyle = COLORS.PREVIEW_CONVEYOR;
      this.ctx.beginPath();
      this.ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4);
      this.ctx.fill();
    } else if (tool === 'box') {
      const boxOff = (cellSize - 28) / 2;
      this.ctx.fillStyle = COLORS.PREVIEW_BOX;
      this.ctx.beginPath();
      this.ctx.roundRect(px + boxOff, py + boxOff, 28, 28, 3);
      this.ctx.fill();
    } else if (tool === 'eraser') {
      this.ctx.fillStyle = COLORS.PREVIEW_ERASER;
      this.ctx.beginPath();
      this.ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(px + 12, py + 12);
      this.ctx.lineTo(px + cellSize - 12, py + cellSize - 12);
      this.ctx.moveTo(px + cellSize - 12, py + 12);
      this.ctx.lineTo(px + 12, py + cellSize - 12);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * 绘制 HUD 覆盖层（屏幕空间）
   */
  drawHUD() {
    if (!this.state.isRunning && this.state.activeTimeMs === 0) return;

    const vw = this.getViewportWidth();

    const padding = 10;
    const timeSec = (this.state.activeTimeMs / 1000);
    const rate = timeSec > 0 ? (this.state.deliveredCount / timeSec) : 0;
    const lines = [
      `📦 ${this.state.boxes.length}  |  ✅ ${this.state.deliveredCount}`,
      `⏱️ ${timeSec.toFixed(1)}s  |  📊 ${rate.toFixed(2)}/s  |  ⚡${this.state.speed.toFixed(1)}x`
    ];

    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 12px monospace';
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const boxH = lines.length * 18 + padding;
    const boxW = maxW + padding * 2;
    const bx = vw - boxW - 8;
    const by = 8;

    const hudGrad = ctx.createLinearGradient(bx, by, bx, by + boxH);
    hudGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    hudGrad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = hudGrad;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.fillText(line, bx + padding, by + padding / 2 + i * 18);
    });

    ctx.restore();
  }
}
