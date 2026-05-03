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

    // 初始化画布尺寸
    this.canvas.width = GRID_W * CELL_SIZE;
    this.canvas.height = GRID_H * CELL_SIZE;

    // 实体注册表
    this.entityRegistry = createDefaultEntityRegistry();

    // 绑定事件
    this._bindEvents();
  }

  _bindEvents() {
    // 状态变化时自动重绘
    this.state.on('state:grid-change', () => this.draw());
    this.state.on('state:box-spawn', () => this.draw());
    this.state.on('state:box-remove', () => this.draw());
    this.state.on('state:undo', () => this.draw());
    this.state.on('state:import', () => this.draw());
    this.state.on('state:reset', () => this.draw());
  }

  /**
   * 调整画布大小
   */
  resize() {
    const container = this.canvas.parentElement;
    const maxW = container.clientWidth - 64;
    const maxH = container.clientHeight - 64;
    const scale = Math.min(maxW / this.canvas.width, maxH / this.canvas.height, 1);
    this.canvas.style.width = (this.canvas.width * scale) + 'px';
    this.canvas.style.height = (this.canvas.height * scale) + 'px';
  }

  /**
   * 主渲染函数
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawGrid();
    this._drawEntities();
    this._drawSpawners();
    this._drawBoxes();
    this._drawHeatmap();
    this._drawPreview();
  }

  _drawGrid() {
    this.ctx.strokeStyle = COLORS.GRID_LINE;
    this.ctx.lineWidth = 1;

    for (let y = 0; y <= GRID_H; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * CELL_SIZE);
      this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
      this.ctx.stroke();
    }

    for (let x = 0; x <= GRID_W; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * CELL_SIZE, 0);
      this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
      this.ctx.stroke();
    }

    // 网格坐标标签
    this.ctx.save();
    this.ctx.font = '9px monospace';
    this.ctx.fillStyle = COLORS.GRID_LABEL;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    for (let x = 0; x < GRID_W; x++) {
      this.ctx.fillText(x, x * CELL_SIZE + CELL_SIZE / 2, 2);
    }
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    for (let y = 0; y < GRID_H; y++) {
      this.ctx.fillText(y, 3, y * CELL_SIZE + CELL_SIZE / 2);
    }
    this.ctx.restore();
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
    for (const spawner of this.state.spawners) {
      Spawner.render(this.ctx, spawner);
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
            const r = intensity < 0.5 ? Math.round(255 * intensity * 2) : 255;
            const g = intensity < 0.5 ? 255 : Math.round(255 * (1 - (intensity - 0.5) * 2));
            this.ctx.fillStyle = `rgba(${r}, ${g}, 0, ${COLORS.HEATMAP_ALPHA})`;
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
          this.ctx.fillStyle = COLORS.PREVIEW_CONVEYOR;
          this.ctx.fillRect(tx * CELL_SIZE + 2, ty * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          const arrows = ['→', '↓', '←', '↑'];
          this.ctx.globalAlpha = 0.7;
          this.ctx.fillStyle = '#fff';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(arrows[dir - 1], tx * CELL_SIZE + CELL_SIZE / 2, ty * CELL_SIZE + CELL_SIZE / 2);
          this.ctx.globalAlpha = 0.35;
        }
      }
    } else if (tool === 'receiver') {
      this.ctx.fillStyle = COLORS.PREVIEW_RECEIVER;
      this.ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    } else if (tool === 'spawner') {
      this.ctx.fillStyle = COLORS.PREVIEW_CONVEYOR;
      this.ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    } else if (tool === 'box') {
      const BOX_OFFSET = (CELL_SIZE - 28) / 2;
      this.ctx.fillStyle = COLORS.PREVIEW_BOX;
      this.ctx.fillRect(px + BOX_OFFSET, py + BOX_OFFSET, 28, 28);
    } else if (tool === 'eraser') {
      this.ctx.fillStyle = COLORS.PREVIEW_ERASER;
      this.ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      this.ctx.strokeStyle = COLORS.PREVIEW_ERASER;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(px + 12, py + 12);
      this.ctx.lineTo(px + CELL_SIZE - 12, py + CELL_SIZE - 12);
      this.ctx.moveTo(px + CELL_SIZE - 12, py + 12);
      this.ctx.lineTo(px + 12, py + CELL_SIZE - 12);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * 绘制 HUD 覆盖层
   */
  drawHUD() {
    if (!this.state.isRunning && this.state.activeTimeMs === 0) return;

    const padding = 10;
    const timeSec = (this.state.activeTimeMs / 1000);
    const rate = timeSec > 0 ? (this.state.deliveredCount / timeSec) : 0;
    const lines = [
      `📦 ${this.state.boxes.length}  |  ✅ ${this.state.deliveredCount}`,
      `⏱️ ${timeSec.toFixed(1)}s  |  📊 ${rate.toFixed(2)}/s  |  ⚡${this.state.speed.toFixed(1)}x`
    ];

    this.ctx.save();
    this.ctx.font = 'bold 12px monospace';
    const maxW = Math.max(...lines.map(l => this.ctx.measureText(l).width));
    const boxH = lines.length * 18 + padding;
    const boxW = maxW + padding * 2;
    const bx = this.canvas.width - boxW - 8;
    const by = 8;

    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.beginPath();
    this.ctx.roundRect(bx, by, boxW, boxH, 6);
    this.ctx.fill();

    this.ctx.fillStyle = '#e5e7eb';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      this.ctx.fillText(line, bx + padding, by + padding / 2 + i * 18);
    });

    this.ctx.restore();
  }
}